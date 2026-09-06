/**
 * Offhand Ability Detection
 *
 * Offhand items (goblet/horn/trinket/belt) carry proc-ability stats under
 * EasyRPG.Attributes.Abilities.<Ability>.* — this module resolves those tags
 * against the generated DT_PlayerAbilities data to answer:
 *
 * - Which abilities are equipped, and on how many offhands?
 * - Which affinity categories are active for each ability? Base affinities
 *   come from the ability itself; some ability modifiers ADD an affinity when
 *   rolled on an offhand item (AffinityBehaviours — e.g. Electric Dragons'
 *   AdditionalDragons modifier adds Area). Only offhand items count: weapons
 *   can never contribute an affinity tag.
 * - What is the ability's base cooldown? Cooldowns step down with the number
 *   of equipped offhands (Initial = 1, TwoOffhands = 2, ThreeOffhands = 3+;
 *   the game defines no fourth step, so a full 4-offhand loadout uses the
 *   3-offhand value).
 *
 * @module utils/offhandAbilities
 */

import playerAbilitiesGenerated from '../data/playerAbilities.generated.json';
import { STAT_REGISTRY } from './statRegistry.js';

const ABILITIES = playerAbilitiesGenerated.abilities || {};
const ABILITY_TAG_PREFIX = 'EasyRPG.Attributes.Abilities.';

/** Look up a generated ability definition by key (e.g. 'ElectricDragons'). */
export function getAbilityDef(abilityKey) {
  return ABILITIES[abilityKey] || null;
}

function statTags(item) {
  const baseStats = item?.baseStats || item?.model?.baseStats || [];
  return baseStats
    .filter(stat => stat.value !== 0)
    .map(stat => stat.rawTag || STAT_REGISTRY[stat.stat]?.canonical || stat.stat || stat.name)
    .filter(tag => typeof tag === 'string')
    .map(tag => {
      // Shared items carry canonical short paths, save imports full paths.
      if (tag.startsWith(ABILITY_TAG_PREFIX)) return tag;
      const short = tag.replace(/^Abilities\./, '');
      return ABILITIES[short.split('.')[0]] ? `${ABILITY_TAG_PREFIX}${short}` : tag;
    });
}

/**
 * @typedef {Object} EquippedAbility
 * @property {string} key - Ability key ('ElectricDragons')
 * @property {string} name - Display name ('Electric Dragons')
 * @property {string|null} element - 'fire' | 'lightning' | 'arcane'
 * @property {string[]} baseAffinities - Categories from the ability itself
 * @property {Array<{category: string, modifierTag: string}>} addedAffinities -
 *   Categories added by equipped ability modifiers (AffinityBehaviours)
 * @property {string[]} affinities - base + added, deduped
 * @property {number} itemCount - How many equipped offhands carry this ability
 * @property {{initial:number, twoOffhands:number, threeOffhands:number}|null} cooldown
 */

/**
 * Detect proc abilities on the equipped offhand items.
 *
 * @param {Array} equippedItems - Item-model list (extractEquippedItems output)
 * @returns {{abilities: EquippedAbility[], offhandCount: number}}
 */
export function detectEquippedAbilities(equippedItems = []) {
  const offhandItems = equippedItems.filter(item => (item?.slot || item?.slotKey) === 'offhand');

  // abilityKey → { itemCount, modifierTags:Set }
  const found = new Map();
  for (const item of offhandItems) {
    const abilitiesOnItem = new Set();
    const modifierTags = [];
    for (const tag of statTags(item)) {
      if (!tag.startsWith(ABILITY_TAG_PREFIX)) continue;
      const key = tag.slice(ABILITY_TAG_PREFIX.length).split('.')[0];
      if (!ABILITIES[key]) continue;
      abilitiesOnItem.add(key);
      if (tag.includes('.Modifier.')) modifierTags.push(tag);
    }
    for (const key of abilitiesOnItem) {
      if (!found.has(key)) found.set(key, { itemCount: 0, modifierTags: new Set() });
      const entry = found.get(key);
      entry.itemCount += 1;
      for (const tag of modifierTags) entry.modifierTags.add(tag);
    }
  }

  const abilities = [];
  for (const [key, entry] of found) {
    const def = ABILITIES[key];
    const addedAffinities = [];
    for (const [modifierTag, category] of Object.entries(def.affinityBehaviours || {})) {
      if (entry.modifierTags.has(modifierTag)) {
        addedAffinities.push({ category, modifierTag });
      }
    }
    const affinities = [...new Set([
      ...(def.affinities || []),
      ...addedAffinities.map(a => a.category),
    ])];
    abilities.push({
      key,
      name: def.name || key,
      element: def.element || null,
      baseAffinities: def.affinities || [],
      addedAffinities,
      affinities,
      itemCount: entry.itemCount,
      cooldown: def.cooldown || null,
    });
  }

  // Most-equipped ability first — the dominant proc of the build
  abilities.sort((a, b) => b.itemCount - a.itemCount || a.key.localeCompare(b.key));

  return { abilities, offhandCount: offhandItems.length };
}

/**
 * Base cooldown (seconds) for an ability at a given equipped-offhand count.
 * The step function is defined per ability in DT_PlayerAbilities; 3+ offhands
 * share the ThreeOffhands value (no fourth step exists).
 *
 * @param {{cooldown: Object|null}} ability - EquippedAbility or ability def
 * @param {number} offhandCount
 * @returns {number} Base cooldown in seconds (0 when the ability has none)
 */
export function getStepCooldown(ability, offhandCount) {
  const cd = ability?.cooldown;
  if (!cd) return 0;
  if (offhandCount >= 3) return cd.threeOffhands || 0;
  if (offhandCount === 2) return cd.twoOffhands || 0;
  return cd.initial || 0;
}

/**
 * Union of active affinity categories across all equipped abilities.
 * @param {EquippedAbility[]} abilities
 * @returns {string[]} Category tags ('Dragon', 'Orbit', …)
 */
export function unionAffinities(abilities = []) {
  return [...new Set(abilities.flatMap(a => a.affinities))];
}
