import { findStatForAttribute } from './statRegistry.js';

const SKILL_KEY_TO_STANCE = {
  SpearSkill: 'spear',
  MaulsSkill: 'maul',
  OneHandSkill: 'sword',
  TwoHandSkill: 'twohand',
  BowSkill: 'bow',
  MagerySkill: 'magery',
  UnarmedSkill: 'fist',
  ScytheSkill: 'scythe',
};

const STANCE_DEFS = {
  spear: {
    id: 'spear',
    name: 'Spear',
    skillKey: 'SpearSkill',
    damageStatId: 'spearDamage',
    keystoneAbility: 'Bloodlust',
    keystoneMonogramId: 'Bloodlust.Base',
    appliesGlobally: true,
    monogramFamily: 'melee',
  },
  maul: {
    id: 'maul',
    name: 'Maul',
    skillKey: 'MaulsSkill',
    damageStatId: 'maulDamage',
    keystoneAbility: 'Divine Protection',
    appliesGlobally: false,
    monogramFamily: 'melee',
  },
  sword: {
    id: 'sword',
    name: 'One-Handed',
    skillKey: 'OneHandSkill',
    damageStatId: 'swordDamage',
    keystoneAbility: 'Shroud',
    keystoneMonogramId: 'Shroud',
    appliesGlobally: true,
    monogramFamily: 'melee',
  },
  twohand: {
    id: 'twohand',
    name: 'Two-Handed',
    skillKey: 'TwoHandSkill',
    damageStatId: 'twohandDamage',
    keystoneAbility: 'Colossus',
    keystoneMonogramId: 'Colossus.Base',
    appliesGlobally: true,
    monogramFamily: 'melee',
  },
  bow: {
    id: 'bow',
    name: 'Bow',
    skillKey: 'BowSkill',
    damageStatId: 'archeryDamage',
    keystoneAbility: 'Phantom Archers',
    appliesGlobally: false,
    monogramFamily: 'ranged',
  },
  magery: {
    id: 'magery',
    name: 'Magery',
    skillKey: 'MagerySkill',
    damageStatId: 'mageryDamage',
    keystoneAbility: 'Phasing',
    keystoneMonogramId: 'AllowPhasing',
    appliesGlobally: true,
    monogramFamily: 'ranged',
  },
  fist: {
    id: 'fist',
    name: 'Fist',
    skillKey: 'UnarmedSkill',
    damageStatId: 'unarmedDamage',
    keystoneAbility: 'Juggernaut',
    keystoneMonogramId: 'Juggernaut',
    appliesGlobally: true,
    monogramFamily: 'ranged',
  },
  scythe: {
    id: 'scythe',
    name: 'Scythe',
    skillKey: 'ScytheSkill',
    damageStatId: 'scytheDamage',
    keystoneAbility: 'Minion Mastery',
    appliesGlobally: false,
    monogramFamily: 'ranged',
  },
};

export const STANCE_KEYSTONE_BREAKPOINT = 5000;
export const STANCE_MASTERY_STEP = 350;

function findHostPlayerStruct(saveData) {
  return saveData?.root?.properties?.HostPlayerData_0?.Struct?.Struct || null;
}

export function inferWeaponStance(equippedItems = []) {
  const weapon = equippedItems.find(item => item?.slot === 'weapon');
  const rowName = weapon?.rowName?.toLowerCase() || '';

  if (!rowName) return null;

  // Historical naming/grouping rules from game data:
  // - Axes are 2H stance, swords are 1H stance
  // - Polearms route to maul stance (shares maul damage tree)
  // - Some legacy staff variants route to maul, while regular staff/wand routes to magery
  if (rowName.includes('weapon_2h') || rowName.includes('weapon_twohand') || rowName.includes('weapon_axe')) return 'twohand';
  if (rowName.includes('weapon_1h') || rowName.includes('weapon_sword')) return 'sword';
  if (rowName.includes('weapon_spear')) return 'spear';
  if (rowName.includes('weapon_maul') || rowName.includes('weapon_polearm') || rowName.includes('weapon_staff_maul') || rowName.includes('weapon_staff_legacy')) return 'maul';
  if (rowName.includes('weapon_bow')) return 'bow';
  if (rowName.includes('weapon_magery') || rowName.includes('weapon_staff') || rowName.includes('weapon_wand')) return 'magery';
  if (rowName.includes('weapon_fist') || rowName.includes('weapon_unarmed')) return 'fist';
  if (rowName.includes('weapon_scythe')) return 'scythe';

  return null;
}

function parseStanceSkillMap(hostPlayerStruct) {
  const result = {};
  if (!hostPlayerStruct) return result;

  for (const [key, value] of Object.entries(hostPlayerStruct)) {
    const skillKey = Object.keys(SKILL_KEY_TO_STANCE).find(prefix => key.startsWith(prefix));
    if (!skillKey) continue;

    const stanceId = SKILL_KEY_TO_STANCE[skillKey];
    const totalSkill = Number(value?.Int64 || 0);
    const keystoneUnlocked = totalSkill >= STANCE_KEYSTONE_BREAKPOINT;
    const mastery = keystoneUnlocked
      ? Math.max(0, Math.floor((totalSkill - STANCE_KEYSTONE_BREAKPOINT) / STANCE_MASTERY_STEP))
      : 0;

    result[stanceId] = {
      ...STANCE_DEFS[stanceId],
      totalSkill,
      keystoneUnlocked,
      mastery,
    };
  }

  return result;
}

export function parseStanceContext(saveData, equippedItems = []) {
  const hostPlayerStruct = findHostPlayerStruct(saveData);
  const stances = parseStanceSkillMap(hostPlayerStruct);
  const activeStanceId = inferWeaponStance(equippedItems);
  const activeStance = activeStanceId ? stances[activeStanceId] || { ...STANCE_DEFS[activeStanceId], totalSkill: 0, mastery: 0, keystoneUnlocked: false } : null;

  return {
    stances,
    activeStanceId,
    activeStance,
  };
}

/**
 * Parse allocated attribute points from HostPlayerData.
 * The game stores level-up stat allocations in Attributes_21_* as an array
 * of STR_Attribute structs (STR_ is a UE struct prefix, not "Strength").
 *
 * Each entry contains:
 *   - GameplayTag with TagName = "EasyRPG.Attributes.Characteristics.<Stat>"
 *   - Value (Float) = total allocated points
 *
 * @param {Object} saveData - Parsed save JSON
 * @returns {Object} Map of { statId: { value, sourceName, rawTag } }
 */
export function parseAllocatedAttributes(saveData) {
  const hostPlayerStruct = findHostPlayerStruct(saveData);
  if (!hostPlayerStruct) return {};

  // Find Attributes_21_* key
  const attrKey = Object.keys(hostPlayerStruct).find(k => k.startsWith('Attributes_21_'));
  if (!attrKey) return {};

  const entries = hostPlayerStruct[attrKey]?.Array?.Struct?.value;
  if (!Array.isArray(entries)) return {};

  const result = {};

  for (const entry of entries) {
    const structData = entry?.Struct;
    if (!structData) continue;

    // Find the GameplayTag key (contains the attribute name)
    const tagKey = Object.keys(structData).find(k => k.startsWith('GameplayTag_'));
    // Find the Value key (contains the numeric value)
    const valueKey = Object.keys(structData).find(k => k.startsWith('Value_'));

    if (!tagKey || !valueKey) continue;

    const rawTag = structData[tagKey]?.Struct?.Struct?.TagName_0?.Name;
    const value = structData[valueKey]?.Float;

    if (!rawTag || typeof value !== 'number' || value === 0) continue;

    // Resolve to a known stat ID via the registry
    const statDef = findStatForAttribute(rawTag);
    const statId = statDef?.id;
    if (!statId) continue;

    // Accumulate in case multiple entries resolve to the same stat
    if (result[statId]) {
      result[statId].value += value;
    } else {
      result[statId] = {
        value,
        sourceName: 'Allocated Points',
      };
    }
  }

  return result;
}

export { STANCE_DEFS };
