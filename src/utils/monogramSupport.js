import { DERIVED_STATS } from './derivedStats.js';
import { MONOGRAM_CALC_CONFIGS, MONOGRAM_BASE_EFFECTS } from './monogramConfigs.js';
import { getMonogramName, SLOT_MONOGRAMS } from './monogramRegistry.js';

const MONOGRAM_CATEGORIES = new Set(['monogram', 'monogram-buff', 'monogram-chain', 'chained']);
const configuredTargets = new Set(Object.values(MONOGRAM_CALC_CONFIGS).flatMap(config =>
  (config.effects || [config]).map(effect => effect.derivedStatId).filter(Boolean)));

/** Visibility is based on grants, not nonzero results. An equipped conversion
 * below its threshold remains visible; an absent multiplier returning 1 does not.
 * Unconfigured buff children inherit their parent grant (e.g. Bloodlust armor).
 */
export function getActiveMonogramStats(overrides = {}) {
  const active = new Set();
  const visited = new Set();
  function visit(id) {
    if (visited.has(id)) return active.has(id);
    visited.add(id);
    const def = DERIVED_STATS[id];
    if (!def) return false;
    const config = { ...def.config, ...overrides[id] };
    if (config.enabled === false) return false;
    if (configuredTargets.has(id)) {
      if (overrides[id]) active.add(id);
    } else if (MONOGRAM_CATEGORIES.has(def.category)) {
      if ((def.dependencies || []).some(dep => visit(dep))) active.add(id);
    }
    return active.has(id);
  }
  Object.keys(DERIVED_STATS).forEach(visit);
  return active;
}

const HIT_OUTPUTS = ['edpsPhysPrimary', 'edpsPhysQ', 'edpsPhysR', 'edpsElemPrimary', 'edpsElemQ', 'edpsElemR'];
function ancestors(ids) {
  const found = new Set();
  function visit(id) {
    if (found.has(id)) return;
    found.add(id);
    for (const dep of DERIVED_STATS[id]?.dependencies || []) visit(dep);
  }
  ids.forEach(visit);
  return found;
}
const hitInputs = ancestors(HIT_OUTPUTS);

// Wiring is not runtime correctness. Retain concrete known limitations beside
// the status so a configured target cannot silently imply complete support.
export const MONOGRAM_COVERAGE_NOTES = {
  'DamageCircle.DamageForStats.Highest': 'Legacy mapping uses health; export says 3 base damage per 25 highest stat. Needs correction and UV activation.',
  'DamageCircle.ExtraDamage': '1% per 35 health regen; UV-only offhand bucket remains provisional.',
  'DamageCircle.DamageForHealthRegen': 'Legacy selector ID; verify against DamageCircle.ExtraDamage before implementing.',
  'GainDamageForHPLoseArmor': 'Damage is calculated; the armor drawback is not modeled.',
  'DamageBonusAnd51Damage': 'Flat damage is calculated; incoming-damage drawback is not modeled.',
  'Bloodlust.DrawLife': 'Life bonus is displayed; complete final-health reconstruction is pending.',
  'Bloodlust.MoreLife.Highest': 'Life bonus is displayed; complete final-health reconstruction is pending.',
  'Shroud.ExtraHp': 'Life bonus is displayed; complete final-health reconstruction is pending.',
  'ElementalToHp%.Fire': 'Uses the overcrit fire contribution; full elemental-to-health reconstruction is pending.',
  'PotionSlotForStat.Highest': 'Legacy slot formula needs grant gating and actual available-slot accounting.',
  'Damage%ForPotions': 'Legacy slot/damage chain needs grant gating and final-output verification.',
};
for (const element of ['Fire', 'Arcane', 'Lightning']) {
  MONOGRAM_COVERAGE_NOTES[`Colossus.ElementalBonusForHighestStat.${element}`] =
    'Legacy shared target loses element identity; mixed grants and duplicate scaling need separation.';
}

export function getMonogramCoverage(id) {
  const config = MONOGRAM_CALC_CONFIGS[id];
  const targets = [...new Set([
    ...(MONOGRAM_BASE_EFFECTS[id] || []).map(effect => effect.statId),
    ...(config ? config.effects || [config] : []).map(effect => effect.derivedStatId).filter(Boolean),
  ])];
  const hits = targets.filter(target => hitInputs.has(target));
  const note = MONOGRAM_COVERAGE_NOTES[id];
  const status = targets.length === 0 ? 'not-modeled'
    : note ? 'partial' : hits.length > 0 ? 'on-hit' : 'stats-only';
  return { id, name: getMonogramName(id), targets, hitTargets: hits, status,
    label: { 'not-modeled': 'Not modeled', partial: 'Partial', 'on-hit': 'On-hit path', 'stats-only': 'Stat/display path' }[status],
    note: note || (targets.length === 0 ? 'No numeric calculation is connected. Proc/utility behavior may be outside on-hit scope.' : ''),
  };
}

/** Craftable selectors plus the reviewed numeric grants, not hundreds of
 * internal text tags in the game export. Shared by the editor and audit command.
 */
export function getMonogramCoverageInventory() {
  const ids = new Set([...Object.values(SLOT_MONOGRAMS).flat(), ...Object.keys(MONOGRAM_BASE_EFFECTS)]);
  return [...ids].sort().map(id => ({ ...getMonogramCoverage(id),
    slots: Object.entries(SLOT_MONOGRAMS).filter(([, entries]) => entries.includes(id)).map(([slot]) => slot),
  }));
}
