export const SUPPORTED_PLATFORMS = [
  { value: 'PSV', label: 'PSV' },
  { value: 'PSM', label: 'PSM' },
  { value: 'PSX', label: 'PSX' },
  { value: 'PS3', label: 'PS3' },
  { value: 'PSP', label: 'PSP' },
];

export const SORT_OPTIONS = [
  { value: 'name-asc', label: 'Name (A–Z)' },
  { value: 'name-desc', label: 'Name (Z–A)' },
  { value: 'size-desc', label: 'Largest first' },
  { value: 'size-asc', label: 'Smallest first' },
  { value: 'date-desc', label: 'Recently updated' },
  { value: 'region-asc', label: 'Region' },
  { value: 'title-id-asc', label: 'Title ID' },
];

export function getField(item, ...names) {
  if (!item) return '';
  for (const name of names) {
    if (item[name] !== undefined && item[name] !== null && String(item[name]).trim() !== '') {
      return String(item[name]).trim();
    }
  }
  const keys = Object.keys(item);
  for (const name of names) {
    const matchingKey = keys.find((key) => key.toLowerCase() === name.toLowerCase());
    if (matchingKey && item[matchingKey] !== undefined && item[matchingKey] !== null) {
      return String(item[matchingKey]).trim();
    }
  }
  return '';
}

export function getItemName(item) {
  return getField(item, 'Name', 'name') || 'Untitled entry';
}

export function getTitleId(item) {
  return getField(item, 'Title ID', 'Title Id', 'title_id', 'titleId').toUpperCase();
}

export function getRegion(item) {
  return getField(item, 'Region', 'region') || 'Unknown region';
}

export function getContentId(item) {
  return getField(item, 'Content ID', 'Content Id', 'content_id', 'contentId').toUpperCase();
}

export function getFileSizeBytes(item) {
  const raw = getField(item, 'File Size', 'File size', 'size');
  const parsed = Number(raw.replace(/[^0-9.]/g, ''));
  return Number.isFinite(parsed) ? parsed : 0;
}

export function formatFileSize(rawSize) {
  const size = Number(String(rawSize || '').replace(/[^0-9.]/g, ''));
  if (!Number.isFinite(size) || size <= 0) return 'Size unknown';
  if (size >= 1024 * 1024 * 1024) return (size / (1024 * 1024 * 1024)).toFixed(2) + ' GB';
  if (size >= 1024 * 1024) return (size / (1024 * 1024)).toFixed(1) + ' MB';
  if (size >= 1024) return Math.round(size / 1024) + ' KB';
  return size + ' bytes';
}

export function getItemKey(item) {
  if (!item) return 'unknown';
  const platform = item.__platform || getField(item, 'Platform') || 'unknown';
  const type = item.__catalogueType || item.__type || 'unknown';
  const contentId = getContentId(item);
  const titleId = getTitleId(item);
  const region = getRegion(item);
  const name = getItemName(item);
  return [platform, type, contentId || titleId || name, region].join(':').toLowerCase();
}

export function normalizeCatalogueRows(rows, platform, type) {
  return (Array.isArray(rows) ? rows : [])
    .filter((row) => row && typeof row === 'object' && Object.keys(row).length > 0)
    .map((row) => ({ ...row, __platform: platform, __catalogueType: type }));
}

function normalizeText(value) {
  return String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

function levenshteinAtMostOne(a, b) {
  if (Math.abs(a.length - b.length) > 1) return false;
  if (a === b) return true;
  let i = 0;
  let j = 0;
  let edits = 0;
  while (i < a.length && j < b.length) {
    if (a[i] === b[j]) {
      i += 1;
      j += 1;
    } else {
      edits += 1;
      if (edits > 1) return false;
      if (a.length > b.length) i += 1;
      else if (b.length > a.length) j += 1;
      else { i += 1; j += 1; }
    }
  }
  if (i < a.length || j < b.length) edits += 1;
  return edits <= 1;
}

function matchesQuery(item, query) {
  const normalizedQuery = normalizeText(query);
  if (!normalizedQuery) return true;
  const fields = [
    getItemName(item),
    getField(item, 'Original Name', 'Original name'),
    getTitleId(item),
    getContentId(item),
    getRegion(item),
    getField(item, 'Type', 'Content Type', 'Required FW', 'Required Firmware'),
  ].map(normalizeText).filter(Boolean);
  const combined = fields.join(' ');
  if (combined.includes(normalizedQuery)) return true;

  const queryTokens = normalizedQuery.split(/\s+/).filter(Boolean);
  return queryTokens.every((token) => {
    if (fields.some((field) => field.split(/\s+/).some((word) => word.startsWith(token)))) return true;
    if (token.length >= 5) {
      return fields.some((field) => field.split(/\s+/).some((word) =>
        Math.abs(word.length - token.length) <= 1 && levenshteinAtMostOne(word, token)
      ));
    }
    return false;
  });
}

export function filterCatalogue(items, options) {
  const settings = options || {};
  return (Array.isArray(items) ? items : []).filter((item) => {
    if (!matchesQuery(item, settings.query)) return false;
    if (settings.region && settings.region !== 'All' && getRegion(item) !== settings.region) return false;
    if (settings.contentType && settings.contentType !== 'All') {
      if (String(item.__catalogueType || '').toUpperCase() !== settings.contentType.toUpperCase()) return false;
    }
    const hasDownload = !!getField(item, 'PKG direct link') &&
      getField(item, 'PKG direct link').toUpperCase() !== 'MISSING';
    if (settings.downloadAvailability === 'available' && !hasDownload) return false;
    if (settings.downloadAvailability === 'missing' && hasDownload) return false;
    return true;
  });
}

export function sortCatalogue(items, sortBy) {
  const copy = [...(Array.isArray(items) ? items : [])];
  const nameCompare = (a, b) => getItemName(a).localeCompare(getItemName(b), undefined, { sensitivity: 'base' });
  switch (sortBy) {
    case 'name-desc': return copy.sort((a, b) => nameCompare(b, a));
    case 'size-desc': return copy.sort((a, b) => getFileSizeBytes(b) - getFileSizeBytes(a));
    case 'size-asc': return copy.sort((a, b) => getFileSizeBytes(a) - getFileSizeBytes(b));
    case 'date-desc': return copy.sort((a, b) => getField(b, 'Last Modification Date').localeCompare(getField(a, 'Last Modification Date')));
    case 'region-asc': return copy.sort((a, b) => getRegion(a).localeCompare(getRegion(b)));
    case 'title-id-asc': return copy.sort((a, b) => getTitleId(a).localeCompare(getTitleId(b)));
    case 'name-asc':
    default: return copy.sort(nameCompare);
  }
}

export function findRelatedDlc(dlcRows, game) {
  const parentTitleId = getTitleId(game);
  if (!parentTitleId) return [];
  return (Array.isArray(dlcRows) ? dlcRows : []).filter((item) => getTitleId(item) === parentTitleId);
}

export function getDistinctRegions(items) {
  return [...new Set((items || []).map(getRegion).filter((region) => region && region !== 'Unknown region'))]
    .sort((a, b) => a.localeCompare(b));
}
