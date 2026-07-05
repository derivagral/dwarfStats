/**
 * External Bonuses — catch-all bucket for untracked character-wide stats.
 *
 * The save can't attribute every stat total to a source: the main levelup tree
 * is ~200 opaque node IDs, crystal cards are unmapped, and seasonal changes
 * shift values faster than they can be verified. Instead of pretending those
 * sources don't exist, this bucket holds per-stat bonuses that sit outside any
 * item — seeded from save data where an authoritative total exists (health),
 * user-editable everywhere else.
 *
 * Shape matches allocatedAttributes for easy aggregation:
 *   { [statId]: { value: number, sourceName: string } }
 *
 * As card/tree mappings land in the registries, their parsed contributions
 * shrink the seeded residual instead of changing displayed totals.
 *
 * @module utils/externalBonuses
 */

import { findStatForAttribute } from './statRegistry.js';

export const RESIDUAL_SOURCE = 'Untracked (tree/cards) — auto';
export const MANUAL_SOURCE = 'Manual';

/**
 * Sum a stat across item baseStats, resolving tags through the registry.
 *
 * @param {Array<{baseStats?: Array}>} items - Item models (save- or share-derived)
 * @param {string} statId - Registry stat ID to sum
 * @returns {number}
 */
function sumItemStat(items, statId) {
  let total = 0;
  for (const item of items || []) {
    for (const s of item?.baseStats || []) {
      const def = findStatForAttribute(s.rawTag || s.stat || '');
      if (def?.id === statId && typeof s.value === 'number') total += s.value;
    }
  }
  return total;
}

/**
 * Compute the untracked flat-health residual from the saved max health.
 *
 * Saved health bakes in permanent flat × health% from ALL sources (gear plus
 * untracked tree/cards/level). Removing the known gear contribution leaves the
 * untracked flat remainder:
 *
 *   residual = savedMaxHealth / (1 + gear health%) − gear flat health
 *
 * Known simplification: permanent monogram HP (e.g. paragon) currently lands
 * in the residual rather than its own line — totals stay correct, attribution
 * refines as more sources are subtracted here.
 *
 * @param {Array} items - Equipped item models
 * @param {number} savedMaxHealth - Health value from save player data
 * @returns {number} Residual flat health (0 if nothing to seed)
 */
export function computeHealthResidual(items, savedMaxHealth) {
  if (!savedMaxHealth || savedMaxHealth <= 0) return 0;
  const gearFlat = sumItemStat(items, 'health');
  const gearBonus = sumItemStat(items, 'healthBonus'); // decimal (0.10 = 10%)
  const residual = savedMaxHealth / (1 + gearBonus) - gearFlat;
  return residual > 0 ? Math.round(residual) : 0;
}

/**
 * Seed the external-bonuses bucket from save-derived data.
 * Currently seeds only the health residual; other stats start manual/empty.
 *
 * @param {Array} items - Equipped item models
 * @param {number} savedMaxHealth - Health value from save player data
 * @returns {Object<string, {value: number, sourceName: string}>}
 */
export function seedExternalBonuses(items, savedMaxHealth) {
  const bonuses = {};
  const healthResidual = computeHealthResidual(items, savedMaxHealth);
  if (healthResidual > 0) {
    bonuses.health = { value: healthResidual, sourceName: RESIDUAL_SOURCE };
  }
  return bonuses;
}
