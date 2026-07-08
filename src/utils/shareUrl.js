/**
 * URL Sharing Utilities for DwarfStats
 *
 * Encodes/decodes filter profiles (and future share types) into
 * hash-based URLs for copy-paste sharing.
 *
 * Format: #filter=<base64url-encoded-compact-json>
 *
 * @module utils/shareUrl
 */

const CURRENT_VERSION = 1;
let _shareId = 0;

// Default filter options — must match FilterModel.js defaults
const DEFAULT_OPTIONS = {
  minHitsPerPool: 1,
  closeMinTotal: 2,
  includeWeapons: true,
  minTotalMonograms: null,
};

/**
 * Encode a UTF-8 string to base64url (URL-safe, no padding)
 * @param {string} str
 * @returns {string}
 */
function toBase64Url(str) {
  const b64 = btoa(unescape(encodeURIComponent(str)));
  return b64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

/**
 * Decode a base64url string back to UTF-8
 * @param {string} b64url
 * @returns {string}
 */
function fromBase64Url(b64url) {
  let b64 = b64url.replace(/-/g, '+').replace(/_/g, '/');
  // Re-add padding
  while (b64.length % 4 !== 0) b64 += '=';
  return decodeURIComponent(escape(atob(b64)));
}

/**
 * Build a compact representation of a FilterModel for URL sharing.
 * Only includes non-default option values to minimize URL length.
 *
 * @param {import('../models/FilterModel').FilterModel} filterModel
 * @returns {string} base64url-encoded string
 */
export function encodeFilterShare(filterModel) {
  const compact = { v: CURRENT_VERSION };

  if (filterModel.name && filterModel.name !== 'Untitled Filter' && filterModel.name !== 'Default') {
    compact.n = filterModel.name;
  }

  compact.a = filterModel.affixes.map(a => a.affixId);

  if (filterModel.monograms.length > 0) {
    compact.m = filterModel.monograms.map(m => [m.monogramId, m.minCount]);
  }

  // Only include non-default options
  const opts = {};
  const o = filterModel.options || {};
  if (o.minHitsPerPool !== DEFAULT_OPTIONS.minHitsPerPool) opts.h = o.minHitsPerPool;
  if (o.closeMinTotal !== DEFAULT_OPTIONS.closeMinTotal) opts.c = o.closeMinTotal;
  if (o.includeWeapons !== DEFAULT_OPTIONS.includeWeapons) opts.w = o.includeWeapons;
  if (o.minTotalMonograms !== DEFAULT_OPTIONS.minTotalMonograms) opts.t = o.minTotalMonograms;

  if (Object.keys(opts).length > 0) {
    compact.o = opts;
  }

  return toBase64Url(JSON.stringify(compact));
}

/**
 * Decode a base64url-encoded filter share string back into a FilterModel.
 *
 * @param {string} encoded - base64url string
 * @returns {import('../models/FilterModel').FilterModel|null} Decoded model or null on failure
 */
export function decodeFilterShare(encoded) {
  try {
    const json = fromBase64Url(encoded);
    const compact = JSON.parse(json);

    if (!compact.v || compact.v > CURRENT_VERSION) return null;
    if (!Array.isArray(compact.a)) return null;

    const affixes = compact.a.map(id => ({ affixId: id }));
    const monograms = Array.isArray(compact.m)
      ? compact.m.map(tuple => ({
          monogramId: tuple[0],
          minCount: tuple[1] ?? null,
        }))
      : [];

    const opts = compact.o || {};
    const options = {
      minHitsPerPool: opts.h ?? DEFAULT_OPTIONS.minHitsPerPool,
      closeMinTotal: opts.c ?? DEFAULT_OPTIONS.closeMinTotal,
      includeWeapons: opts.w ?? DEFAULT_OPTIONS.includeWeapons,
      minTotalMonograms: opts.t ?? DEFAULT_OPTIONS.minTotalMonograms,
    };

    return {
      id: `filter-shared-${Date.now()}-${++_shareId}`,
      name: compact.n || 'Shared Filter',
      affixes,
      monograms,
      options,
    };
  } catch {
    return null;
  }
}

/**
 * Build a full shareable URL for a given share type and encoded payload.
 *
 * @param {'filter'|'character'} type - Share type key
 * @param {string} encoded - base64url-encoded payload
 * @param {string} [baseUrl] - Optional base URL override (defaults to current page)
 * @returns {string} Full URL
 */
export function buildShareUrl(type, encoded, baseUrl) {
  const base = baseUrl || (window.location.origin + window.location.pathname);
  return `${base}#${type}=${encoded}`;
}

/**
 * Parse the current window hash for a share payload.
 *
 * @param {string} hash - window.location.hash (e.g. "#filter=abc123")
 * @returns {{ type: string, data: string }|null}
 */
export function parseShareFromHash(hash) {
  if (!hash || hash.length < 2) return null;

  // Strip leading #
  const raw = hash.startsWith('#') ? hash.slice(1) : hash;
  const eqIdx = raw.indexOf('=');
  if (eqIdx < 1) return null;

  const type = raw.slice(0, eqIdx);
  const data = raw.slice(eqIdx + 1);

  if (!data) return null;

  return { type, data };
}

/**
 * Encode a CharacterSharePayload to a base64url string.
 *
 * @param {import('../models/CharacterShareModel').CharacterSharePayload} payload
 * @returns {string} base64url-encoded string
 */
export function encodeCharacterShare(payload) {
  return toBase64Url(JSON.stringify(payload));
}

/**
 * Decode a base64url character share string back into a payload.
 *
 * @param {string} encoded - base64url string
 * @returns {import('../models/CharacterShareModel').CharacterSharePayload|null}
 */
export function decodeCharacterShare(encoded) {
  try {
    const json = fromBase64Url(encoded);
    const payload = JSON.parse(json);
    // v2 fields are additive, so uncompressed v2 payloads decode fine here too
    if (!payload || typeof payload.v !== 'number' || payload.v > 2) return null;
    return payload;
  } catch {
    return null;
  }
}

/**
 * Build a full shareable URL for a character payload.
 *
 * @param {import('../models/CharacterShareModel').CharacterSharePayload} payload
 * @param {string} [baseUrl] - Optional base URL override
 * @returns {string} Full URL with #character= hash
 */
export function buildCharacterShareUrl(payload, baseUrl) {
  return buildShareUrl('character', encodeCharacterShare(payload), baseUrl);
}

// ---------------------------------------------------------------------------
// Compressed (v2) character shares
//
// Format: "2." + base64url(deflate-raw(JSON)). The prefix distinguishes
// compressed payloads from legacy v1 (bare base64url JSON, which never starts
// with "2." because base64 of '{' is 'ey...'). Compression uses the native
// CompressionStream API (browsers + Node 18+), so encode/decode are async.
// ---------------------------------------------------------------------------

const COMPRESSED_PREFIX = '2.';
const MAX_SHARE_VERSION = 2;

function bytesToBase64Url(bytes) {
  let binary = '';
  const CHUNK = 0x8000;
  for (let i = 0; i < bytes.length; i += CHUNK) {
    binary += String.fromCharCode(...bytes.subarray(i, i + CHUNK));
  }
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function base64UrlToBytes(b64url) {
  let b64 = b64url.replace(/-/g, '+').replace(/_/g, '/');
  while (b64.length % 4 !== 0) b64 += '=';
  const binary = atob(b64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

async function pipeThrough(bytes, TransformCtor, mode) {
  const stream = new Blob([bytes]).stream().pipeThrough(new TransformCtor(mode));
  return new Uint8Array(await new Response(stream).arrayBuffer());
}

/**
 * Encode a CharacterSharePayload to a compressed "2."-prefixed share code.
 * @param {import('../models/CharacterShareModel').CharacterSharePayload} payload
 * @returns {Promise<string>}
 */
export async function encodeCharacterShareCompressed(payload) {
  const json = JSON.stringify(payload);
  const bytes = new TextEncoder().encode(json);
  const deflated = await pipeThrough(bytes, CompressionStream, 'deflate-raw');
  return COMPRESSED_PREFIX + bytesToBase64Url(deflated);
}

/**
 * Decode any character share string — compressed v2 ("2." prefix) or legacy
 * v1 (bare base64url JSON).
 * @param {string} encoded
 * @returns {Promise<import('../models/CharacterShareModel').CharacterSharePayload|null>}
 */
export async function decodeCharacterShareAny(encoded) {
  if (typeof encoded !== 'string' || !encoded) return null;
  if (!encoded.startsWith(COMPRESSED_PREFIX)) {
    return decodeCharacterShare(encoded);
  }
  try {
    const deflated = base64UrlToBytes(encoded.slice(COMPRESSED_PREFIX.length));
    const bytes = await pipeThrough(deflated, DecompressionStream, 'deflate-raw');
    const payload = JSON.parse(new TextDecoder().decode(bytes));
    if (!payload || typeof payload.v !== 'number' || payload.v > MAX_SHARE_VERSION) return null;
    return payload;
  } catch {
    return null;
  }
}

/**
 * Build a full shareable URL using the compressed v2 encoding.
 * @param {import('../models/CharacterShareModel').CharacterSharePayload} payload
 * @param {string} [baseUrl]
 * @returns {Promise<string>}
 */
export async function buildCharacterShareUrlCompressed(payload, baseUrl) {
  return buildShareUrl('character', await encodeCharacterShareCompressed(payload), baseUrl);
}
