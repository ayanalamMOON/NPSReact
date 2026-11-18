import Papa from 'papaparse';
import { Platform } from 'react-native';
import { Storage } from './storage';
import { normalizeCatalogueRows } from './catalogueUtils';

const CACHE_PREFIX = 'npsreact:catalogue:v2:';
const DEFAULT_SERVER_URL = 'https://nopaystation.com';

function getCatalogueCacheKey(platform, type) {
  return CACHE_PREFIX + String(platform).toUpperCase() + ':' + String(type).toUpperCase();
}

function getCatalogueUrl(serverUrl, platform, type) {
  const candidate = String(serverUrl || DEFAULT_SERVER_URL).trim();
  let parsed;

  try {
    parsed = new URL(candidate);
  } catch {
    throw new Error('The catalogue server URL is invalid.');
  }

  const localHttpHosts = new Set(['localhost', '127.0.0.1', '10.0.2.2', '::1']);
  const isSecure = parsed.protocol === 'https:';
  const isLocalDevelopment = parsed.protocol === 'http:' && localHttpHosts.has(parsed.hostname);

  if (!isSecure && !isLocalDevelopment) {
    throw new Error('Catalogue servers must use HTTPS. HTTP is allowed only for localhost development.');
  }

  if (parsed.username || parsed.password || parsed.search || parsed.hash) {
    throw new Error('The catalogue server URL must not contain credentials, query parameters or fragments.');
  }

  const baseUrl = parsed.href.replace(/\/+$/, '');
  return baseUrl + '/tsv/' + platform + '_' + type + '.tsv';
}

export async function getCachedCatalogue(platform, type) {
  try {
    const raw = await Storage.getItem(getCatalogueCacheKey(platform, type));
    if (!raw) return null;

    const cached = JSON.parse(raw);
    if (
      cached &&
      cached.version === 2 &&
      Array.isArray(cached.rows) &&
      Number.isFinite(cached.cachedAt)
    ) {
      return cached;
    }

    await Storage.removeItem(getCatalogueCacheKey(platform, type));
  } catch (error) {
    console.warn('Unable to read cached catalogue:', error);
  }
  return null;
}

export async function fetchCatalogue(platform, type, serverUrl, options = {}) {
  const cacheKey = getCatalogueCacheKey(platform, type);
  const cached = await getCachedCatalogue(platform, type);
  const headers = {
    Accept: 'text/tab-separated-values, text/plain, */*',
  };

  // Conditional headers are useful on native, but on web they can trigger a
  // CORS preflight against public TSV hosts. Web therefore re-fetches normally.
  if (Platform.OS !== 'web' && cached && cached.etag) headers['If-None-Match'] = cached.etag;
  if (Platform.OS !== 'web' && cached && cached.lastModified) {
    headers['If-Modified-Since'] = cached.lastModified;
  }

  try {
    const url = getCatalogueUrl(serverUrl, platform, type);
    const response = await fetch(url, {
      method: 'GET',
      headers,
      signal: options.signal,
    });

    if (response.status === 304 && cached) {
      const refreshed = { ...cached, cachedAt: Date.now() };
      await Storage.setItem(cacheKey, JSON.stringify(refreshed));
      return { rows: refreshed.rows, source: 'cache', stale: false, notModified: true };
    }

    if (!response.ok) {
      throw new Error('Catalogue request failed (' + response.status + ').');
    }

    const source = await response.text();
    if (!source || !source.trim()) {
      throw new Error('The catalogue source returned an empty response.');
    }

    const parsed = Papa.parse(source, {
      header: true,
      delimiter: '\t',
      skipEmptyLines: 'greedy',
      transformHeader: (header) => String(header || '').replace(/^\uFEFF/, '').trim(),
    });

    if (!parsed.meta || !parsed.meta.fields || parsed.meta.fields.length === 0) {
      throw new Error('The catalogue response did not contain a valid TSV header.');
    }

    if (parsed.errors && parsed.errors.length > 0) {
      const fatalError = parsed.errors.find((entry) => entry.type === 'Delimiter' || entry.type === 'Quotes');
      if (fatalError) {
        throw new Error('The catalogue response could not be parsed: ' + fatalError.message);
      }
    }

    const rows = normalizeCatalogueRows(
      (parsed.data || []).filter((row) =>
        row && Object.values(row).some((value) => String(value || '').trim() !== '')
      ),
      platform,
      type
    );

    const updatedCache = {
      version: 2,
      rows,
      cachedAt: Date.now(),
      etag: response.headers.get('etag'),
      lastModified: response.headers.get('last-modified'),
    };

    try {
      await Storage.setItem(cacheKey, JSON.stringify(updatedCache));
    } catch (cacheError) {
      console.warn('Catalogue loaded but could not be cached:', cacheError);
    }

    return { rows, source: 'network', stale: false, notModified: false };
  } catch (error) {
    if (options.signal && options.signal.aborted) throw error;
    if (cached && Array.isArray(cached.rows)) {
      return { rows: cached.rows, source: 'cache', stale: true, error };
    }
    throw error;
  }
}
