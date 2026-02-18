/**
 * Skill Tree Data Model
 *
 * Defines the internal representation for character skill tree data.
 * Covers 4 distinct skill categories found in save files:
 * - Main passive tree (opaque node IDs)
 * - Weapon stance skills (per-weapon)
 * - Crystal cards
 * - Crafting/Elven tree
 *
 * @module models/SkillTree
 */

/**
 * Skill category constants
 * @readonly
 * @enum {string}
 */
export const SKILL_CATEGORY = {
  MAIN: 'main',
  WEAPON: 'weapon',
  CARD: 'card',
  CRAFTING: 'crafting',
};

/**
 * Weapon type constants (match DataTable naming)
 * @readonly
 * @enum {string}
 */
export const WEAPON_TYPE = {
  SPEAR: 'spear',
  MAULS: 'mauls',
  ONE_HAND: 'oneHand',
  TWO_HAND: 'twoHand',
  ARCHERY: 'archery',
  MAGERY: 'magery',
  SCYTHE: 'scythe',
  UNARMED: 'unarmed',
};

/**
 * Main tree node type constants (inferred from RowName prefix)
 * @readonly
 * @enum {string}
 */
export const MAIN_NODE_TYPE = {
  SMALL: 'small',
  LARGE: 'large',
  DROPDOWN: 'dropdown',
  UNKNOWN: 'unknown',
};

/**
 * A single skill entry parsed from save data
 * @typedef {Object} SkillEntry
 * @property {string} dataTable - Full DataTable path from save
 * @property {string} rowName - Row name identifier
 * @property {number} level - Skill level/rank
 * @property {string} category - One of SKILL_CATEGORY values
 */

/**
 * Weapon stance data with skills and XP
 * @typedef {Object} WeaponStanceData
 * @property {string} type - One of WEAPON_TYPE values
 * @property {SkillEntry[]} skills - Allocated skill nodes
 * @property {number} xp - Weapon proficiency XP
 */

/**
 * Complete skill tree data extracted from a save file
 * @typedef {Object} SkillTreeData
 * @property {SkillEntry[]} mainTree - Main passive tree nodes (opaque IDs)
 * @property {Object<string, WeaponStanceData>} weaponStances - Per-weapon stance data
 * @property {SkillEntry[]} cards - Crystal card entries
 * @property {SkillEntry[]} crafting - Crafting/Elven tree entries
 * @property {SkillTreeMetadata} metadata - Summary counters
 */

/**
 * Metadata extracted alongside skill tree
 * @typedef {Object} SkillTreeMetadata
 * @property {number} skillPoints - Total gained skill points
 * @property {number} elvenCounter - Elven crystal counter
 * @property {number} totalNodes - Total allocated nodes across all categories
 * @property {Object<string, number>} weaponXp - XP per weapon type
 */

/**
 * Creates an empty SkillTreeData with default values
 * @returns {SkillTreeData}
 */
export function createEmptySkillTreeData() {
  return {
    mainTree: [],
    weaponStances: {
      [WEAPON_TYPE.SPEAR]: { type: WEAPON_TYPE.SPEAR, skills: [], xp: 0 },
      [WEAPON_TYPE.MAULS]: { type: WEAPON_TYPE.MAULS, skills: [], xp: 0 },
      [WEAPON_TYPE.ONE_HAND]: { type: WEAPON_TYPE.ONE_HAND, skills: [], xp: 0 },
      [WEAPON_TYPE.TWO_HAND]: { type: WEAPON_TYPE.TWO_HAND, skills: [], xp: 0 },
      [WEAPON_TYPE.ARCHERY]: { type: WEAPON_TYPE.ARCHERY, skills: [], xp: 0 },
      [WEAPON_TYPE.MAGERY]: { type: WEAPON_TYPE.MAGERY, skills: [], xp: 0 },
      [WEAPON_TYPE.SCYTHE]: { type: WEAPON_TYPE.SCYTHE, skills: [], xp: 0 },
      [WEAPON_TYPE.UNARMED]: { type: WEAPON_TYPE.UNARMED, skills: [], xp: 0 },
    },
    cards: [],
    crafting: [],
    metadata: {
      skillPoints: 0,
      elvenCounter: 0,
      totalNodes: 0,
      weaponXp: {},
    },
  };
}

/**
 * Get weapon stance data for a specific weapon type
 * @param {SkillTreeData} data
 * @param {string} weaponType - One of WEAPON_TYPE values
 * @returns {WeaponStanceData|null}
 */
export function getWeaponStance(data, weaponType) {
  return data.weaponStances[weaponType] || null;
}

/**
 * Group card entries by family number
 * Parses CARD5_1 → family 5, CARD11 → family 11
 * @param {SkillTreeData} data
 * @returns {Object<number, SkillEntry[]>} Cards grouped by family
 */
export function getCardsByFamily(data) {
  const families = {};
  for (const card of data.cards) {
    const parsed = parseCardRowName(card.rowName);
    if (parsed) {
      if (!families[parsed.family]) {
        families[parsed.family] = [];
      }
      families[parsed.family].push(card);
    }
  }
  return families;
}

/**
 * Parse a card row name into family and variant
 * @param {string} rowName - e.g. "CARD5_1", "CARD11", "CARD17_4"
 * @returns {{ family: number, variant: number|null }|null}
 */
export function parseCardRowName(rowName) {
  if (!rowName || !rowName.startsWith('CARD')) return null;
  const match = rowName.match(/^CARD(\d+)(?:_(\d+))?$/);
  if (!match) return null;
  return {
    family: parseInt(match[1], 10),
    variant: match[2] != null ? parseInt(match[2], 10) : null,
  };
}

/**
 * Get all skills for a given category
 * @param {SkillTreeData} data
 * @param {string} category - One of SKILL_CATEGORY values
 * @returns {SkillEntry[]}
 */
export function getSkillsByCategory(data, category) {
  switch (category) {
    case SKILL_CATEGORY.MAIN:
      return data.mainTree;
    case SKILL_CATEGORY.CARD:
      return data.cards;
    case SKILL_CATEGORY.CRAFTING:
      return data.crafting;
    case SKILL_CATEGORY.WEAPON:
      return Object.values(data.weaponStances).flatMap(ws => ws.skills);
    default:
      return [];
  }
}

/**
 * Classify a main tree node by its RowName prefix
 * @param {string} rowName - e.g. "UI_SkillTreeNode_Small_624"
 * @returns {string} One of MAIN_NODE_TYPE values
 */
export function classifyMainNode(rowName) {
  if (!rowName) return MAIN_NODE_TYPE.UNKNOWN;
  if (rowName.includes('_Small_') || rowName === 'UI_SkillTreeNode_Small') return MAIN_NODE_TYPE.SMALL;
  if (rowName.includes('_Large_') || rowName === 'UI_SkillTreeNode_Large') return MAIN_NODE_TYPE.LARGE;
  if (rowName.includes('_DropDown_')) return MAIN_NODE_TYPE.DROPDOWN;
  return MAIN_NODE_TYPE.UNKNOWN;
}

/**
 * Count nodes by main tree node type
 * @param {SkillTreeData} data
 * @returns {{ small: number, large: number, dropdown: number, unknown: number }}
 */
export function countMainNodeTypes(data) {
  const counts = { small: 0, large: 0, dropdown: 0, unknown: 0 };
  for (const entry of data.mainTree) {
    const type = classifyMainNode(entry.rowName);
    counts[type]++;
  }
  return counts;
}
