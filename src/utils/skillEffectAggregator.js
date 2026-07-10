/**
 * Skill Effect Aggregator
 *
 * Converts a parsed skill tree (extractSkillTree) into flat stat
 * contributions using generated game data:
 * - Main passive tree: health effects mapped from generated UI node IDs
 * - Crystal cards: per-level {tag, value} effects × card level
 * - Weapon stance skills: per-level effects × skill level (covers paragon
 *   nodes, which scale linearly to their game max level)
 * - Weapon skill buffs: force-enabled at max stacks (temporal buff state is
 *   not stored in saves; per-stack customization is a post-launch concern)
 *
 * Crafting/elven tree is intentionally NOT handled here yet.
 *
 * Output values are raw save-format decimals (0.05 = 5%), matching item
 * baseStats, so useDerivedStats can aggregate them through the same path.
 *
 * @module utils/skillEffectAggregator
 */

import cardsGenerated from '../data/cards.generated.json';
import weaponSkillsGenerated from '../data/weaponSkills.generated.json';
import mainTreeHealthGenerated from '../data/mainTreeHealth.generated.json';
import mainTreeAffinityGenerated from '../data/mainTreeAffinity.generated.json';
import { findStatForAttribute } from './statRegistry.js';

const GENERATED_CARDS = cardsGenerated.cards || {};
const GENERATED_WEAPON_SKILLS = weaponSkillsGenerated.weaponSkills || {};
const MAIN_TREE_HEALTH_EFFECTS = mainTreeHealthGenerated.effectsByRow || {};
const MAIN_TREE_AFFINITY_EFFECTS = mainTreeAffinityGenerated.effectsByRow || {};
const MAIN_TREE_AFFINITY_NAMES = mainTreeAffinityGenerated.namesByRow || {};

export function hasMainTreeHealthEffect(rowName) {
  return !!MAIN_TREE_HEALTH_EFFECTS[rowName];
}

export function hasMainTreeAffinityEffect(rowName) {
  return !!MAIN_TREE_AFFINITY_EFFECTS[rowName];
}

// UE row names (FNames) are case-insensitive: saves contain e.g.
// "Spear_Crit_Damage_buff" while the DataTable row is "Spear_Crit_Damage_Buff".
// Index both maps by lowercase for tolerant lookup.
function lowerIndex(map) {
  const idx = {};
  for (const [key, value] of Object.entries(map)) idx[key.toLowerCase()] = value;
  return idx;
}
const CARDS_LOWER = lowerIndex(GENERATED_CARDS);
const WEAPON_SKILLS_LOWER = lowerIndex(GENERATED_WEAPON_SKILLS);

function lookupCard(rowName) {
  return GENERATED_CARDS[rowName] ?? CARDS_LOWER[rowName?.toLowerCase()] ?? null;
}

function lookupWeaponSkill(rowName) {
  return GENERATED_WEAPON_SKILLS[rowName] ?? WEAPON_SKILLS_LOWER[rowName?.toLowerCase()] ?? null;
}

// Only stat-granting tags flow into the calc engine. Cards/skills can also
// grant modifier tags (e.g. EasyRPG.Items.Modifiers.AdditionalPotionSlots.1)
// — those are behavior grants, not aggregatable stats. Offhand affinity
// bonuses live under their own EasyRPG.OffhandCategories.* prefix.
const ATTR_PREFIX = 'EasyRPG.Attributes.';
const OFFHAND_CATEGORY_PREFIX = 'EasyRPG.OffhandCategories.';

/**
 * @typedef {Object} SkillContribution
 * @property {string} tag - Full game attribute tag
 * @property {string|null} statId - Resolved STAT_REGISTRY id (null if unknown)
 * @property {number} value - Total contribution (per-level value × level/stacks)
 * @property {string} source - Human-readable origin ("Card 3-2 (L6)")
 * @property {'mainTree'|'card'|'weaponSkill'|'buff'} kind
 */

function pushEffects(contributions, effects, multiplier, source, kind) {
  for (const eff of effects ?? []) {
    if (!eff.tag?.startsWith(ATTR_PREFIX) && !eff.tag?.startsWith(OFFHAND_CATEGORY_PREFIX)) continue;
    if (!eff.value) continue;
    contributions.push({
      tag: eff.tag,
      statId: findStatForAttribute(eff.tag)?.id ?? null,
      value: eff.value * multiplier,
      source,
      kind,
    });
  }
}

/**
 * Aggregate all skill-based stat contributions from a parsed skill tree.
 *
 * @param {Object|null} skillTree - Result of extractSkillTree(saveData)
 * @param {Object} [options]
 * @param {boolean} [options.includeBuffs=true] - Force-enable weapon skill
 *   buffs at max stacks
 * @returns {SkillContribution[]}
 */
export function aggregateSkillEffects(skillTree, options = {}) {
  const { includeBuffs = true } = options;
  const contributions = [];
  if (!skillTree) return contributions;

  // --- Main passive tree: generated node IDs → health + affinity effects --
  // The save stores opaque UI_SkillTreeNode_* row names. The compact maps are
  // generated from DT_GENERATED_SkillTree_Main: MaxHealth/MaxHealth% effects
  // plus OffhandCategories affinity damage%/cooldown nodes (which carry
  // display names like "Sky Rush" for readable breakdowns).
  for (const skill of skillTree.mainTree ?? []) {
    const level = skill.level || 1;
    const healthEffects = MAIN_TREE_HEALTH_EFFECTS[skill.rowName];
    if (healthEffects) {
      pushEffects(contributions, healthEffects, level, `${skill.rowName} (L${level})`, 'mainTree');
    }
    const affinityEffects = MAIN_TREE_AFFINITY_EFFECTS[skill.rowName];
    if (affinityEffects) {
      const label = MAIN_TREE_AFFINITY_NAMES[skill.rowName] || skill.rowName;
      pushEffects(contributions, affinityEffects, level, `${label} (L${level})`, 'mainTree');
    }
  }

  // --- Crystal cards: effects scale linearly with card level -------------
  for (const card of skillTree.cards ?? []) {
    const gen = lookupCard(card.rowName);
    const level = card.level || 0;
    if (!gen || level <= 0) continue;
    pushEffects(contributions, gen.effects, level, `${card.rowName} (L${level})`, 'card');
  }

  // --- Weapon stance skills: effects scale with skill level --------------
  for (const stance of Object.values(skillTree.weaponStances ?? {})) {
    for (const skill of stance.skills ?? []) {
      const gen = lookupWeaponSkill(skill.rowName);
      if (!gen) continue;
      const level = skill.level || 1;
      pushEffects(contributions, gen.effects, level, `${skill.rowName} (L${level})`, 'weaponSkill');

      // Buffs: no save-side state, so force-on at max stacks
      if (includeBuffs && gen.buff) {
        const stacks = Math.max(1, gen.buff.maxStack || 1);
        const label = gen.buff.name || skill.rowName;
        pushEffects(contributions, gen.buff.effects, stacks, `${label} (buff ×${stacks})`, 'buff');
      }
    }
  }

  return contributions;
}

/**
 * Whether the skill tree has any weapon skill data. Used by useDerivedStats
 * to decide between real paragon effects and the legacy +1%/mastery-level
 * approximation (still needed for shared builds, which carry no skill tree).
 *
 * @param {Object|null} skillTree
 * @returns {boolean}
 */
export function hasWeaponSkillData(skillTree) {
  if (!skillTree) return false;
  return Object.values(skillTree.weaponStances ?? {})
    .some(stance => (stance.skills ?? []).length > 0);
}
