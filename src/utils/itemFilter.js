/**
 * Item Filtering and Scoring Utilities
 *
 * Scores Item model instances against FilterModel criteria.
 * Works with the internal Item model (affixPools, monograms)
 * rather than legacy raw save data.
 *
 * @module utils/itemFilter
 */

import { STAT_REGISTRY } from './statRegistry.js';
import { isWeaponType } from '../models/itemTransformer.js';

/**
 * Build a set of regex patterns from an array of affix criteria.
 * Each affixId maps to STAT_REGISTRY patterns.
 *
 * @param {Array<{affixId: string}>} affixCriteria
 * @returns {Array<{affixId: string, patterns: RegExp[]}>}
 */
export function buildAffixMatchers(affixCriteria) {
  return affixCriteria.map(({ affixId }) => {
    const stat = STAT_REGISTRY[affixId];
    if (!stat || !stat.patterns) return { affixId, patterns: [] };
    const patterns = stat.patterns.map(p =>
      new RegExp('^' + p.replace(/[.*+?^${}()|[\]\\]/g, '\\$&').replace(/%6/g, '(%6|%)') + '$', 'i')
    );
    return { affixId, patterns };
  });
}

/**
 * Check if a pool rowName matches any pattern for a given affix matcher
 *
 * @param {string} rowName - Affix pool row name
 * @param {{affixId: string, patterns: RegExp[]}} matcher
 * @returns {boolean}
 */
function rowNameMatchesMatcher(rowName, matcher) {
  return matcher.patterns.some(rx => rx.test(rowName));
}

/**
 * Count how many affix matchers hit at least one rowName in a pool.
 *
 * @param {Array<{rowName: string}>} poolAffixes - From item.affixPools.poolN
 * @param {Array<{affixId: string, patterns: RegExp[]}>} matchers
 * @returns {{count: number, matchedAffixIds: string[]}}
 */
export function scorePool(poolAffixes, matchers) {
  if (!poolAffixes || poolAffixes.length === 0 || matchers.length === 0) {
    return { count: 0, matchedAffixIds: [] };
  }

  const rowNames = poolAffixes.map(a => a.rowName);
  const matchedAffixIds = [];

  for (const matcher of matchers) {
    if (rowNames.some(rn => rowNameMatchesMatcher(rn, matcher))) {
      matchedAffixIds.push(matcher.affixId);
    }
  }

  return { count: matchedAffixIds.length, matchedAffixIds };
}

/**
 * Score an Item model's affix pools against filter affix criteria.
 *
 * @param {import('../models/Item.js').Item} item
 * @param {Array<{affixId: string, patterns: RegExp[]}>} matchers
 * @returns {{s1: number, s2: number, s3: number, total: number, poolMatches: Object}}
 */
export function scoreItemPools(item, matchers) {
  const p1 = scorePool(item.affixPools?.pool1, matchers);
  const p2 = scorePool(item.affixPools?.pool2, matchers);
  const p3 = scorePool(item.affixPools?.pool3, matchers);

  return {
    s1: p1.count,
    s2: p2.count,
    s3: p3.count,
    total: p1.count + p2.count + p3.count,
    poolMatches: {
      pool1: p1.matchedAffixIds,
      pool2: p2.matchedAffixIds,
      pool3: p3.matchedAffixIds,
    },
  };
}

/**
 * Count occurrences of each monogram ID on an item.
 *
 * @param {import('../models/Item.js').Item} item
 * @returns {Map<string, number>} monogramId → count
 */
export function getMonogramCounts(item) {
  const counts = new Map();
  for (const mono of (item.monograms || [])) {
    counts.set(mono.id, (counts.get(mono.id) || 0) + 1);
  }
  return counts;
}

/**
 * Score an item's monograms against filter monogram criteria.
 * Supports minCount per criterion (e.g., "at least 2x Bloodlust.Base").
 *
 * @param {import('../models/Item.js').Item} item
 * @param {Array<{monogramId: string, minCount?: number|null}>} monogramCriteria
 * @returns {{matched: string[], missing: string[], totalCount: number}}
 */
export function scoreMonograms(item, monogramCriteria) {
  const totalCount = (item.monograms || []).length;

  if (!monogramCriteria || monogramCriteria.length === 0) {
    return { matched: [], missing: [], totalCount };
  }

  const counts = getMonogramCounts(item);
  const matched = [];
  const missing = [];

  for (const { monogramId, minCount } of monogramCriteria) {
    const actual = counts.get(monogramId) || 0;
    const required = minCount ?? 1;
    if (actual >= required) {
      matched.push(monogramId);
    } else {
      missing.push(monogramId);
    }
  }

  return { matched, missing, totalCount };
}

/**
 * Filter Item model array against a FilterModel.
 *
 * Items qualify as "hits" when:
 * - At least minHitsPerPool affix matchers hit each pool (pool1, pool2, pool3)
 * - All required monograms are present
 *
 * Items qualify as "close" (near miss) when:
 * - Total pool hits >= closeMinTotal but not all pools met threshold
 * - OR all pools pass but some monograms are missing
 *
 * @param {import('../models/Item.js').Item[]} items
 * @param {import('../models/FilterModel.js').FilterModel} filterModel
 * @returns {{hits: Array, close: Array, totalItems: number}}
 */
export function filterByModel(items, filterModel) {
  const { affixes, monograms: monogramCriteria, options } = filterModel;
  const { minHitsPerPool = 1, closeMinTotal = 2, includeWeapons = true, minTotalMonograms = null } = options;

  const matchers = buildAffixMatchers(affixes);
  const hits = [];
  const close = [];

  for (const item of items) {
    // Optionally skip weapons
    if (!includeWeapons && isWeaponType(item.type)) {
      continue;
    }

    const poolScores = scoreItemPools(item, matchers);
    const monoScores = scoreMonograms(item, monogramCriteria);

    const poolsPass = affixes.length === 0 || (
      poolScores.s1 >= minHitsPerPool &&
      poolScores.s2 >= minHitsPerPool &&
      poolScores.s3 >= minHitsPerPool
    );

    const monosPass = monogramCriteria.length === 0 || monoScores.missing.length === 0;
    const totalMonosPass = minTotalMonograms === null || monoScores.totalCount >= minTotalMonograms;

    const scored = {
      ...item,
      s1: poolScores.s1,
      s2: poolScores.s2,
      s3: poolScores.s3,
      total: poolScores.total,
      poolMatches: poolScores.poolMatches,
      monoMatched: monoScores.matched,
      monoMissing: monoScores.missing,
      monoTotalCount: monoScores.totalCount,
    };

    if (poolsPass && monosPass && totalMonosPass) {
      hits.push(scored);
    } else {
      const hasPoolRelevance = poolScores.total >= closeMinTotal;
      // For mono close: pools pass but monos don't, and the item has at least some monograms
      const monoNearMiss = poolsPass && (!monosPass || !totalMonosPass) && monoScores.totalCount > 0;
      if (hasPoolRelevance || monoNearMiss) {
        close.push(scored);
      }
    }
  }

  return { hits, close, totalItems: items.length };
}
