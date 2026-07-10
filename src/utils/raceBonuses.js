/**
 * Racial Bonuses
 *
 * Each race (Human/Orc/Dwarf/Undead) has 6 racial skills that unlock at fixed
 * character-level thresholds — 10/25/50/100/150/200 (threshold unlocks, NOT
 * per-level scaling; RACE_LEVEL_CAP=200 is simply the last unlock). Grants
 * per race follow one shape:
 *   L10  two weapon-stance damage%          L100 3 affinity cooldown bonuses
 *   L25  three offhand affinity damage%     L150 two StanceMultiplier bonuses
 *   L50  stance crit chance/damage          L200 the same 3 affinities, bigger
 *
 * Race is detected from the save (parseCharacterRace → E_CharacterRace enum
 * index); the generated table maps index → name + skills.
 *
 * @module utils/raceBonuses
 */

import racesGenerated from '../data/races.generated.json';
import { findStatForAttribute } from './statRegistry.js';

const RACES = racesGenerated.races || {};

// EasyRPG.StanceMultiplier.* ("<Stance> Damage Augmentation") has no registry
// stat; provisionally routed additively into the matching stance damage%
// bucket. The racial L10/L150 stance pairings line up per race (e.g. Dwarf:
// Magery+PoleArm damage% then Mauls+Magery multipliers), confirming the
// stance identity — only the additive-vs-multiplicative application is
// unconfirmed. Note the game's TwoHanded stance is Axes.
const STANCE_MULTIPLIER_STATS = {
  'EasyRPG.StanceMultiplier.Swords': 'swordDamage',
  'EasyRPG.StanceMultiplier.Axes': 'twohandDamage',
  'EasyRPG.StanceMultiplier.Magery': 'mageryDamage',
  'EasyRPG.StanceMultiplier.Archery': 'archeryDamage',
  'EasyRPG.StanceMultiplier.Mauls': 'maulDamage',
  'EasyRPG.StanceMultiplier.Spear': 'spearDamage',
  'EasyRPG.StanceMultiplier.Fists': 'unarmedDamage',
  'EasyRPG.StanceMultiplier.Scythe': 'scytheDamage',
};

/** @returns {Object|null} Generated race definition for an enum index. */
export function getRaceDef(raceIndex) {
  if (raceIndex === null || raceIndex === undefined) return null;
  return RACES[raceIndex] ?? null;
}

/** @returns {string|null} Display name ('Dwarf') for a race enum index. */
export function getRaceName(raceIndex) {
  return getRaceDef(raceIndex)?.name ?? null;
}

/**
 * @typedef {Object} RaceContribution
 * @property {string} tag - Full game attribute tag
 * @property {string|null} statId - Resolved STAT_REGISTRY id
 * @property {number} value - Contribution (raw decimal, 0.1 = 10%)
 * @property {string} source - Human-readable origin ("Runes of Power (Dwarf L25)")
 * @property {'race'} kind
 */

/**
 * Flat stat contributions from the racial skills unlocked at the character's
 * level. Same raw-decimal convention as item baseStats / skill contributions.
 *
 * @param {number|null} raceIndex - E_CharacterRace enum index from the save
 * @param {number} characterLevel
 * @returns {RaceContribution[]}
 */
export function getRacialContributions(raceIndex, characterLevel) {
  const def = getRaceDef(raceIndex);
  const level = Number(characterLevel) || 0;
  if (!def || level <= 0) return [];

  const contributions = [];
  for (const skill of def.racialSkills ?? []) {
    if (level < (skill.requiredLevel || 0)) continue;
    for (const eff of skill.effects ?? []) {
      if (!eff.tag || !eff.value) continue;
      const statId = STANCE_MULTIPLIER_STATS[eff.tag]
        ?? findStatForAttribute(eff.tag)?.id
        ?? null;
      if (!statId) continue;
      contributions.push({
        tag: eff.tag,
        statId,
        value: eff.value,
        source: `${skill.name} (${def.name} L${skill.requiredLevel})`,
        kind: 'race',
      });
    }
  }
  return contributions;
}
