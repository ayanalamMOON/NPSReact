import Papa from 'papaparse';
import { normalizeCatalogueRows } from './catalogueUtils';

export async function fetchCatalogue(platform, type, serverUrl) {
  const baseUrl = String(serverUrl || 'https://nopaystation.com').trim().replace(/\/+$/, '');
  const url = baseUrl + '/tsv/' + platform + '_' + type + '.tsv';
  const response = await fetch(url, {
    method: 'GET',
    headers: { Accept: 'text/tab-separated-values, text/plain, */*' },
  });

  if (!response.ok) throw new Error('Catalogue request failed (' + response.status + ').');
  const source = await response.text();
  if (!source || !source.trim()) throw new Error('The catalogue source returned an empty response.');

  const parsed = Papa.parse(source, {
    header: true,
    delimiter: '\t',
    skipEmptyLines: 'greedy',
    transformHeader: (header) => String(header || '').replace(/^\uFEFF/, '').trim(),
  });

  if (!parsed.meta || !parsed.meta.fields || parsed.meta.fields.length === 0) {
    throw new Error('The catalogue response did not contain a valid TSV header.');
  }

  const rows = (parsed.data || []).filter((row) =>
    row && Object.values(row).some((value) => String(value || '').trim() !== '')
  );
  return normalizeCatalogueRows(rows, platform, type);
}
