/**
 * Item Filtering and Scoring Utilities
 *
 * Pure functions for filtering and scoring items against patterns.
 * Used by FilterTab and ItemsTab for item search/matching.
 *
 * @module utils/itemFilter
 */

/**
 * Compile filter patterns to regex list
 * Supports wildcards (*) converted to .*
 *
 * @param {Array<string|RegExp>} patterns - Filter patterns
 * @returns {RegExp[]} Compiled regex array
 */
export function compilePatterns(patterns) {
  return patterns.map(p => {
    if (p instanceof RegExp) return p;
    return new RegExp(String(p).replace(/\*/g, '.*'), 'i');
  });
}

/**
 * Count how many attributes match any pattern
 *
 * @param {string[]} attrs - Attribute names to check
 * @param {RegExp[]} regexList - Compiled patterns
 * @returns {number} Number of matching attributes
 */
export function countHits(attrs, regexList) {
  if (!Array.isArray(attrs) || !regexList.length) return 0;
  let hits = 0;
  for (const attr of attrs) {
    for (const regex of regexList) {
      if (regex.test(attr)) {
        hits++;
        break; // Count each attribute only once
      }
    }
  }
  return hits;
}

/**
 * Score an item's pools against filter patterns
 *
 * @param {Object} item - Item with pool attributes
 * @param {RegExp[]} regexList - Compiled patterns
 * @returns {{s1: number, s2: number, s3: number, total: number}}
 */
export function scoreItemPools(item, regexList) {
  const pool1 = item.item?.pool1_attributes || [];
  const pool2 = item.item?.pool2_attributes || [];
  const pool3 = item.item?.pool3_attributes || [];

  const s1 = countHits(pool1, regexList);
  const s2 = countHits(pool2, regexList);
  const s3 = countHits(pool3, regexList);
  const total = s1 + s2 + s3;

  return { s1, s2, s3, total };
}

/**
 * Filter and score items from inventory against filter patterns
 *
 * Used when filtering itemStore.inventory (already processed items).
 * Items qualify as "hits" if they have at least minHits in each pool.
 * Items qualify as "close" if they don't qualify but have >= closeMinTotal.
 *
 * @param {Array} items - Items from itemStore.inventory
 * @param {Array<string|RegExp>} patterns - Filter patterns
 * @param {Object} options - Filtering options
 * @param {number} [options.closeMinTotal=2] - Minimum total for "close" matches
 * @param {number} [options.minHits=1] - Minimum hits per pool for full match
 * @returns {{ hits: Array, close: Array, totalItems: number }}
 */
export function filterInventoryItems(items, patterns, options = {}) {
  const { closeMinTotal = 2, minHits = 1 } = options;

  const regexList = compilePatterns(patterns);
  const hits = [];
  const close = [];

  for (const item of items) {
    const scores = scoreItemPools(item, regexList);
    const scored = { ...item, ...scores };

    if (scores.s1 >= minHits && scores.s2 >= minHits && scores.s3 >= minHits) {
      hits.push(scored);
    } else if (scores.total >= closeMinTotal) {
      close.push(scored);
    }
  }

  return { hits, close, totalItems: items.length };
}

/**
 * Check if an item's attributes match any pattern
 *
 * @param {Object} item - Item with all_attributes
 * @param {RegExp[]} regexList - Compiled patterns
 * @returns {boolean}
 */
export function itemMatchesAnyPattern(item, regexList) {
  if (regexList.length === 0) return true;
  const attributes = item.item?.all_attributes || [];
  return attributes.some(attr => regexList.some(regex => regex.test(attr)));
}
