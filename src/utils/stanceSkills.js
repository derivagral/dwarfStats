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
  if (rowName.includes('weapon_maul')) return 'maul';
  if (rowName.includes('weapon_spear')) return 'spear';
  if (rowName.includes('weapon_1h') || rowName.includes('weapon_sword') || rowName.includes('weapon_axe')) return 'sword';
  if (rowName.includes('weapon_2h') || rowName.includes('weapon_twohand')) return 'twohand';
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

export { STANCE_DEFS };
