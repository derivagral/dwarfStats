/**
 * Skill Tree Parser
 *
 * Extracts CharacterSkills data from raw UE5 save JSON.
 * Categorizes skills by DataTable type and extracts adjacent metadata
 * (weapon XP, skill points, elven counter).
 *
 * @module utils/skillTreeParser
 */

import {
  createEmptySkillTreeData,
  SKILL_CATEGORY,
  WEAPON_TYPE,
} from '../models/SkillTree.js';

// DataTable discriminators for categorization
const MAIN_TREE_TABLE = 'DT_GENERATED_SkillTree_Main';
const CARD_TABLE = 'DT_Crystal_Cards_Skills';
const CRAFTING_TABLE = 'DT_Skills_Crafting';

// Weapon DataTable suffix → WEAPON_TYPE mapping
const WEAPON_TABLE_MAP = {
  'DT_Skills_Spear': WEAPON_TYPE.SPEAR,
  'DT_Skills_Mauls': WEAPON_TYPE.MAULS,
  'DT_Skills_OneHand': WEAPON_TYPE.ONE_HAND,
  'DT_Skills_TwoHand': WEAPON_TYPE.TWO_HAND,
  'DT_Skills_Archery': WEAPON_TYPE.ARCHERY,
  'DT_Skills_Magery': WEAPON_TYPE.MAGERY,
  'DT_Skills_Scythe': WEAPON_TYPE.SCYTHE,
  'DT_Skills_Unarmed': WEAPON_TYPE.UNARMED,
};

// Weapon XP field prefix → WEAPON_TYPE mapping
const WEAPON_XP_MAP = {
  'SpearSkill': WEAPON_TYPE.SPEAR,
  'MaulsSkill': WEAPON_TYPE.MAULS,
  'OneHandSkill': WEAPON_TYPE.ONE_HAND,
  'TwoHandSkill': WEAPON_TYPE.TWO_HAND,
  'BowSkill': WEAPON_TYPE.ARCHERY,
  'MagerySkill': WEAPON_TYPE.MAGERY,
  'ScytheSkill': WEAPON_TYPE.SCYTHE,
  'UnarmedSkill': WEAPON_TYPE.UNARMED,
};

/**
 * Find a field value by key prefix in an object.
 * UE5 save keys have random hex suffixes like "CharacterSkills_77_BB3A9A18..."
 * @param {Object} obj
 * @param {string} prefix
 * @returns {[string, *]|null} [key, value] tuple or null
 */
function findByPrefix(obj, prefix) {
  if (!obj || typeof obj !== 'object') return null;
  for (const [key, value] of Object.entries(obj)) {
    if (key.startsWith(prefix)) {
      return [key, value];
    }
  }
  return null;
}

/**
 * Find all fields matching a prefix (for weapon XP counters)
 * @param {Object} obj
 * @param {string} prefix
 * @returns {Array<[string, *]>}
 */
function findAllByPrefix(obj, prefix) {
  if (!obj || typeof obj !== 'object') return [];
  return Object.entries(obj).filter(([key]) => key.startsWith(prefix));
}

/**
 * Categorize a skill by its DataTable path
 * @param {string} dataTablePath - Full DataTable Object path
 * @returns {{ category: string, weaponType: string|null }}
 */
export function categorizeSkill(dataTablePath) {
  if (!dataTablePath) return { category: SKILL_CATEGORY.MAIN, weaponType: null };

  if (dataTablePath.includes(MAIN_TREE_TABLE)) {
    return { category: SKILL_CATEGORY.MAIN, weaponType: null };
  }

  if (dataTablePath.includes(CARD_TABLE)) {
    return { category: SKILL_CATEGORY.CARD, weaponType: null };
  }

  if (dataTablePath.includes(CRAFTING_TABLE)) {
    return { category: SKILL_CATEGORY.CRAFTING, weaponType: null };
  }

  // Check weapon tables
  for (const [tableKey, weaponType] of Object.entries(WEAPON_TABLE_MAP)) {
    if (dataTablePath.includes(tableKey)) {
      return { category: SKILL_CATEGORY.WEAPON, weaponType };
    }
  }

  // Unknown DataTable — default to main
  return { category: SKILL_CATEGORY.MAIN, weaponType: null };
}

/**
 * Extract a single skill entry from a raw STR_Skill struct
 * @param {Object} rawStruct - The Struct contents of one skill array entry
 * @returns {{ dataTable: string, rowName: string, level: number }|null}
 */
function parseSkillEntry(rawStruct) {
  if (!rawStruct || typeof rawStruct !== 'object') return null;

  let dataTable = '';
  let rowName = '';
  let level = 0;

  for (const [key, value] of Object.entries(rawStruct)) {
    // Handle field — contains DataTableRowHandle
    if (key.startsWith('Handle')) {
      dataTable = value?.Struct?.Struct?.DataTable_0?.Object || '';
      rowName = value?.Struct?.Struct?.RowName_0?.Name || '';
    }
    // Level field
    else if (key.startsWith('Level')) {
      level = value?.Int ?? 0;
    }
  }

  if (!rowName) return null;

  return { dataTable, rowName, level };
}

/**
 * Extract skill tree data from parsed save JSON
 * @param {Object} saveData - Full parsed save data
 * @returns {import('../models/SkillTree.js').SkillTreeData}
 */
export function extractSkillTree(saveData) {
  const result = createEmptySkillTreeData();

  if (!saveData || typeof saveData !== 'object') return result;

  // DFS to find CharacterSkills and metadata in the HostPlayerData struct
  let hostPlayerStruct = null;

  function findHostPlayer(node) {
    if (!node || typeof node !== 'object' || hostPlayerStruct) return;

    for (const [key, value] of Object.entries(node)) {
      if (hostPlayerStruct) return;

      if (key.startsWith('HostPlayerData')) {
        hostPlayerStruct = value?.Struct?.Struct || null;
        return;
      }

      if (typeof value === 'object') {
        findHostPlayer(value);
      }
    }
  }

  findHostPlayer(saveData);

  if (!hostPlayerStruct) return result;

  // Find CharacterSkills array
  const skillsEntry = findByPrefix(hostPlayerStruct, 'CharacterSkills');
  if (skillsEntry) {
    const skillsArray = skillsEntry[1]?.Array?.Struct?.value;
    if (Array.isArray(skillsArray)) {
      for (const wrapper of skillsArray) {
        const raw = wrapper?.Struct;
        if (!raw) continue;

        const entry = parseSkillEntry(raw);
        if (!entry) continue;

        const { category, weaponType } = categorizeSkill(entry.dataTable);
        const skillEntry = { ...entry, category };

        switch (category) {
          case SKILL_CATEGORY.MAIN:
            result.mainTree.push(skillEntry);
            break;
          case SKILL_CATEGORY.CARD:
            result.cards.push(skillEntry);
            break;
          case SKILL_CATEGORY.CRAFTING:
            result.crafting.push(skillEntry);
            break;
          case SKILL_CATEGORY.WEAPON:
            if (weaponType && result.weaponStances[weaponType]) {
              result.weaponStances[weaponType].skills.push(skillEntry);
            }
            break;
        }
      }
    }
  }

  // Extract metadata from adjacent fields
  extractMetadata(hostPlayerStruct, result);

  // Compute total
  result.metadata.totalNodes =
    result.mainTree.length +
    result.cards.length +
    result.crafting.length +
    Object.values(result.weaponStances).reduce((sum, ws) => sum + ws.skills.length, 0);

  return result;
}

/**
 * Extract metadata counters from the HostPlayerData struct
 * @param {Object} hostPlayerStruct
 * @param {import('../models/SkillTree.js').SkillTreeData} result
 */
function extractMetadata(hostPlayerStruct, result) {
  // Weapon XP counters (Int64 values)
  for (const [prefix, weaponType] of Object.entries(WEAPON_XP_MAP)) {
    const matches = findAllByPrefix(hostPlayerStruct, prefix);
    for (const [, value] of matches) {
      const xp = value?.Int64 ?? value?.Int ?? 0;
      result.weaponStances[weaponType].xp = xp;
      result.metadata.weaponXp[weaponType] = xp;
    }
  }

  // Gained skill points
  const skillPtsEntry = findByPrefix(hostPlayerStruct, 'GainedSkillPoints');
  if (skillPtsEntry) {
    result.metadata.skillPoints = skillPtsEntry[1]?.Int ?? skillPtsEntry[1]?.Int64 ?? 0;
  }

  // Elven counter
  const elvenEntry = findByPrefix(hostPlayerStruct, 'ElvenCounter');
  if (elvenEntry) {
    result.metadata.elvenCounter = elvenEntry[1]?.Int ?? elvenEntry[1]?.Int64 ?? 0;
  }
}
