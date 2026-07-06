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
import { calculateDerivedStats, DERIVED_STATS } from './derivedStats.js';
import { MONOGRAM_CALC_CONFIGS, BUFF_STACK_MAP } from './monogramConfigs.js';

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
 * Compute the temporary life-bonus percentage that was ACTIVE at save time.
 *
 * The saved Health value includes contributions from buffs running when the
 * game saved (verified on a fully-buffed save: Health_29 ≈ unbuffed ×
 * (1 + DrawLife + MoreLife...)). To recover the unbuffed base, run the engine
 * with the equipped monograms but with stack counts taken from the save's
 * StatusEffects — a buff not present at save time contributes 0.
 *
 * @param {Array} items - Equipped item models (monograms drive the chains)
 * @param {Object<string, {value:number}>} allocatedAttributes - Base attribute pool
 * @param {Array<{id:string, stacks:number}>} statusEffects - Parsed save buffs
 * @returns {number} Temp life bonus active at save, as a decimal (1.0 = +100%)
 */
export function computeSaveTimeTempLifePct(items, allocatedAttributes, statusEffects) {
  if (!statusEffects || statusEffects.length === 0) return 0;

  // Aggregate base stats the same way useDerivedStats does (gear + allocated)
  const base = {};
  for (const [statId, v] of Object.entries(allocatedAttributes || {})) {
    const value = typeof v === 'number' ? v : Number(v?.value || 0);
    base[statId] = (base[statId] || 0) + value;
  }
  for (const item of items || []) {
    for (const s of item?.baseStats || []) {
      const def = findStatForAttribute(s.rawTag || s.stat || '');
      if (def?.id && typeof s.value === 'number') base[def.id] = (base[def.id] || 0) + s.value;
    }
  }

  // Enable monogram-driven configs from equipped gear (theorycraft defaults).
  // Duplicate monograms stack additively — count instances first (mirrors
  // useDerivedStats) so e.g. two MoreLife rings double the divisor too.
  const instanceCounts = {};
  for (const item of items || []) {
    for (const m of item?.monograms || []) {
      instanceCounts[m.id] = (instanceCounts[m.id] || 0) + 1;
    }
  }
  const overrides = {};
  for (const [monoId, instanceCount] of Object.entries(instanceCounts)) {
    const mc = MONOGRAM_CALC_CONFIGS[monoId];
    if (!mc?.effects) continue;
    for (const e of mc.effects) {
      if (e.derivedStatId && e.config) {
        overrides[e.derivedStatId] = { ...DERIVED_STATS[e.derivedStatId]?.config, ...e.config, instanceCount };
      }
    }
  }

  // ...then pin stack counts to what was actually running at save time.
  // Any stack-based buff NOT in StatusEffects was inactive → 0 stacks.
  const savedStacks = {};
  for (const buff of statusEffects) {
    const stackStatId = BUFF_STACK_MAP[buff.id];
    if (stackStatId) savedStacks[stackStatId] = buff.stacks || 0;
  }
  for (const stackStatId of Object.values(BUFF_STACK_MAP)) {
    const current = savedStacks[stackStatId] ?? 0;
    overrides[stackStatId] = {
      ...DERIVED_STATS[stackStatId]?.config,
      ...(overrides[stackStatId] || {}),
      enabled: current > 0 ? true : (overrides[stackStatId]?.enabled ?? false),
      currentStacks: current,
    };
  }

  const r = calculateDerivedStats(base, overrides);
  const tempPct = (r.lifeBuffBonus || 0)
    + (r.bloodlustLifeBonus || 0)
    + (r.shroudLifeBonus || 0)
    + (r.damageCircleLifeBonus || 0)
    + (r.lifeBonusFromCritChance || 0)
    + (r.lifeFromElement || 0);
  return tempPct / 100;
}

/**
 * Compute the untracked flat-health residual from the saved max health.
 *
 * Saved health bakes in permanent flat × health% from ALL sources (gear plus
 * untracked tree/cards/level) AND any temp life buffs active at save time:
 *
 *   residual = savedMaxHealth / ((1 + gear health%) × (1 + save-time temp life%))
 *              − gear flat health
 *
 * Known simplification: permanent monogram HP (e.g. paragon) currently lands
 * in the residual rather than its own line — totals stay correct, attribution
 * refines as more sources are subtracted here.
 *
 * @param {Array} items - Equipped item models
 * @param {number} savedMaxHealth - Health value from save player data
 * @param {Object} [opts]
 * @param {Object} [opts.allocatedAttributes] - Base attribute pool (for buff scaling)
 * @param {Array} [opts.statusEffects] - Parsed save buffs (divides out active temp life)
 * @returns {number} Residual flat health (0 if nothing to seed)
 */
export function computeHealthResidual(items, savedMaxHealth, opts = {}) {
  if (!savedMaxHealth || savedMaxHealth <= 0) return 0;
  const gearFlat = sumItemStat(items, 'health');
  const gearBonus = sumItemStat(items, 'healthBonus'); // decimal (0.10 = 10%)
  const tempLife = computeSaveTimeTempLifePct(items, opts.allocatedAttributes, opts.statusEffects);
  const residual = savedMaxHealth / ((1 + gearBonus) * (1 + tempLife)) - gearFlat;
  return residual > 0 ? Math.round(residual) : 0;
}

/**
 * Seed the external-bonuses bucket from save-derived data.
 * Currently seeds only the health residual; other stats start manual/empty.
 *
 * @param {Array} items - Equipped item models
 * @param {number} savedMaxHealth - Health value from save player data
 * @param {Object} [opts] - See computeHealthResidual
 * @returns {Object<string, {value: number, sourceName: string}>}
 */
export function seedExternalBonuses(items, savedMaxHealth, opts = {}) {
  const bonuses = {};
  const healthResidual = computeHealthResidual(items, savedMaxHealth, opts);
  if (healthResidual > 0) {
    bonuses.health = { value: healthResidual, sourceName: RESIDUAL_SOURCE };
  }
  return bonuses;
}
