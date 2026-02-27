/**
 * Skill Tree Registry
 *
 * Maps skill tree rowNames to known stat effects.
 * Four registries covering weapon stances, crafting/elven tree, cards, and
 * main-tree keystones (manually curated checklist for user input).
 *
 * @module utils/skillTreeRegistry
 */

// =============================================================================
// WEAPON STANCE SKILL REGISTRY
// =============================================================================

/**
 * @typedef {Object} WeaponSkillDef
 * @property {string} rowName - Save file row name
 * @property {string} name - Display name
 * @property {string} type - 'ability' | 'stat' | 'buff' | 'paragon' | 'utility'
 * @property {string} [statId] - Reference to STAT_REGISTRY id (if stat-granting)
 * @property {boolean} [perLevel] - Whether effect scales with level (paragon nodes)
 * @property {string} [weapon] - Weapon type this belongs to
 */

export const WEAPON_SKILL_REGISTRY = {
  // ---------------------------------------------------------------------------
  // SPEAR (14 entries)
  // ---------------------------------------------------------------------------
  'SpearsQ': { rowName: 'SpearsQ', name: 'Spear Q Ability', type: 'ability', weapon: 'spear' },
  'SpearsR': { rowName: 'SpearsR', name: 'Spear R Ability', type: 'ability', weapon: 'spear' },
  'SpearQBaseDamage': { rowName: 'SpearQBaseDamage', name: 'Spear Q Base Damage', type: 'stat', weapon: 'spear' },
  'SpearRBaseCritDmg': { rowName: 'SpearRBaseCritDmg', name: 'Spear R Base Crit Damage', type: 'stat', weapon: 'spear' },
  'SpearMediumDmg': { rowName: 'SpearMediumDmg', name: 'Spear Medium Damage', type: 'stat', statId: 'spearDamage', weapon: 'spear' },
  'SpearMediumCritDmg': { rowName: 'SpearMediumCritDmg', name: 'Spear Medium Crit Damage', type: 'stat', statId: 'spearCritDamage', weapon: 'spear' },
  'SpearMajor': { rowName: 'SpearMajor', name: 'Spear Major', type: 'stat', weapon: 'spear' },
  'SpearCritDamage': { rowName: 'SpearCritDamage', name: 'Spear Crit Damage', type: 'stat', statId: 'spearCritDamage', weapon: 'spear' },
  'SpearsDamage': { rowName: 'SpearsDamage', name: 'Spear Damage', type: 'paragon', statId: 'spearDamage', perLevel: true, weapon: 'spear' },
  'Spear_Damage_Buff': { rowName: 'Spear_Damage_Buff', name: 'Spear Damage Buff', type: 'buff', statId: 'spearDamage', weapon: 'spear' },
  'Spear_Damage_buff_end_game': { rowName: 'Spear_Damage_buff_end_game', name: 'Spear Endgame Damage Buff', type: 'buff', statId: 'spearDamage', weapon: 'spear' },
  'Spear_Crit_Damage_buff': { rowName: 'Spear_Crit_Damage_buff', name: 'Spear Crit Damage Buff', type: 'buff', statId: 'spearCritDamage', weapon: 'spear' },
  'Spear_Crit_Damage_buff_end_game': { rowName: 'Spear_Crit_Damage_buff_end_game', name: 'Spear Endgame Crit Damage Buff', type: 'buff', statId: 'spearCritDamage', weapon: 'spear' },
  'Speark_Roll_Knockback': { rowName: 'Speark_Roll_Knockback', name: 'Spear Roll Knockback', type: 'utility', weapon: 'spear' },

  // ---------------------------------------------------------------------------
  // MAULS (14 entries)
  // ---------------------------------------------------------------------------
  'MaulsQ': { rowName: 'MaulsQ', name: 'Mauls Q Ability', type: 'ability', weapon: 'mauls' },
  'MaulsR': { rowName: 'MaulsR', name: 'Mauls R Ability', type: 'ability', weapon: 'mauls' },
  'MacesQBaseDamage': { rowName: 'MacesQBaseDamage', name: 'Mauls Q Base Damage', type: 'stat', weapon: 'mauls' },
  'MacesRBaseCritDmg': { rowName: 'MacesRBaseCritDmg', name: 'Mauls R Base Crit Damage', type: 'stat', weapon: 'mauls' },
  'MacesMediumDmg': { rowName: 'MacesMediumDmg', name: 'Mauls Medium Damage', type: 'stat', statId: 'maulDamage', weapon: 'mauls' },
  'MacesMediumCritDmg': { rowName: 'MacesMediumCritDmg', name: 'Mauls Medium Crit Damage', type: 'stat', statId: 'maulCritDamage', weapon: 'mauls' },
  'MacesMajor': { rowName: 'MacesMajor', name: 'Mauls Major', type: 'stat', weapon: 'mauls' },
  'MacesDamageBasicBuff': { rowName: 'MacesDamageBasicBuff', name: 'Mauls Basic Damage Buff', type: 'buff', statId: 'maulDamage', weapon: 'mauls' },
  'MacesDamageEndGameBuff': { rowName: 'MacesDamageEndGameBuff', name: 'Mauls Endgame Damage Buff', type: 'buff', statId: 'maulDamage', weapon: 'mauls' },
  'MacesCritBasicBuff': { rowName: 'MacesCritBasicBuff', name: 'Mauls Basic Crit Buff', type: 'buff', statId: 'maulCritDamage', weapon: 'mauls' },
  'MacesCritEndGameBuff': { rowName: 'MacesCritEndGameBuff', name: 'Mauls Endgame Crit Buff', type: 'buff', statId: 'maulCritDamage', weapon: 'mauls' },
  'Mauls_HP_Energy_Regen': { rowName: 'Mauls_HP_Energy_Regen', name: 'Mauls HP/Energy Regen', type: 'utility', weapon: 'mauls' },
  'Mauls.EndGame.Bubble': { rowName: 'Mauls.EndGame.Bubble', name: 'Mauls Endgame Bubble', type: 'utility', weapon: 'mauls' },
  'PolearmDamage': { rowName: 'PolearmDamage', name: 'Polearm Damage (Paragon)', type: 'paragon', statId: 'maulDamage', perLevel: true, weapon: 'mauls' },

  // ---------------------------------------------------------------------------
  // ONE-HAND / SWORD (11 entries)
  // ---------------------------------------------------------------------------
  'SwordsQ': { rowName: 'SwordsQ', name: 'Sword Q Ability', type: 'ability', weapon: 'oneHand' },
  'SwordsR': { rowName: 'SwordsR', name: 'Sword R Ability', type: 'ability', weapon: 'oneHand' },
  'SwordQBaseDamage': { rowName: 'SwordQBaseDamage', name: 'Sword Q Base Damage', type: 'stat', weapon: 'oneHand' },
  'SwordRBaseCritDmg': { rowName: 'SwordRBaseCritDmg', name: 'Sword R Base Crit Damage', type: 'stat', weapon: 'oneHand' },
  'SwordMediumDmg': { rowName: 'SwordMediumDmg', name: 'Sword Medium Damage', type: 'stat', statId: 'swordDamage', weapon: 'oneHand' },
  'SwordMediumCritDmg': { rowName: 'SwordMediumCritDmg', name: 'Sword Medium Crit Damage', type: 'stat', statId: 'swordCritDamage', weapon: 'oneHand' },
  'SwordMajor': { rowName: 'SwordMajor', name: 'Sword Major', type: 'stat', weapon: 'oneHand' },
  'SwordsPreMajorDmgStr': { rowName: 'SwordsPreMajorDmgStr', name: 'Sword Pre-Major Damage/Strength', type: 'stat', weapon: 'oneHand' },
  '1H_Damage_Buff': { rowName: '1H_Damage_Buff', name: '1H Damage Buff', type: 'buff', statId: 'swordDamage', weapon: 'oneHand' },
  '1H_Damage_EndGame_Buff': { rowName: '1H_Damage_EndGame_Buff', name: '1H Endgame Damage Buff', type: 'buff', statId: 'swordDamage', weapon: 'oneHand' },
  '1H_Crit_Damage_EndGame_Buff': { rowName: '1H_Crit_Damage_EndGame_Buff', name: '1H Endgame Crit Damage Buff', type: 'buff', statId: 'swordCritDamage', weapon: 'oneHand' },

  // ---------------------------------------------------------------------------
  // TWO-HAND (11 entries)
  // ---------------------------------------------------------------------------
  'TwoHandsQ': { rowName: 'TwoHandsQ', name: 'Two-Hand Q Ability', type: 'ability', weapon: 'twoHand' },
  'TwoHandsR': { rowName: 'TwoHandsR', name: 'Two-Hand R Ability', type: 'ability', weapon: 'twoHand' },
  'TwoHandedQBaseDamage': { rowName: 'TwoHandedQBaseDamage', name: 'Two-Hand Q Base Damage', type: 'stat', weapon: 'twoHand' },
  'TwoHandedRBaseDamage': { rowName: 'TwoHandedRBaseDamage', name: 'Two-Hand R Base Damage', type: 'stat', weapon: 'twoHand' },
  'TwoHandedMediumDmg': { rowName: 'TwoHandedMediumDmg', name: 'Two-Hand Medium Damage', type: 'stat', statId: 'twohandDamage', weapon: 'twoHand' },
  'TwoHandedMediumCritDmg': { rowName: 'TwoHandedMediumCritDmg', name: 'Two-Hand Medium Crit Damage', type: 'stat', statId: 'twohandCritDamage', weapon: 'twoHand' },
  'TwoHandedMajor': { rowName: 'TwoHandedMajor', name: 'Two-Hand Major', type: 'stat', weapon: 'twoHand' },
  '2H_PreMajor_DmgArmor': { rowName: '2H_PreMajor_DmgArmor', name: 'Two-Hand Pre-Major Damage/Armor', type: 'stat', weapon: 'twoHand' },
  '2H_Dmg_Buff': { rowName: '2H_Dmg_Buff', name: 'Two-Hand Damage Buff', type: 'buff', statId: 'twohandDamage', weapon: 'twoHand' },
  '2H_Crit_Buff': { rowName: '2H_Crit_Buff', name: 'Two-Hand Crit Buff', type: 'buff', statId: 'twohandCritDamage', weapon: 'twoHand' },
  '2H_Dmg_Buff_EndGame': { rowName: '2H_Dmg_Buff_EndGame', name: 'Two-Hand Endgame Damage Buff', type: 'buff', statId: 'twohandDamage', weapon: 'twoHand' },

  // ---------------------------------------------------------------------------
  // ARCHERY (11 entries)
  // ---------------------------------------------------------------------------
  'Archery.ArcaneArrow': { rowName: 'Archery.ArcaneArrow', name: 'Arcane Arrow', type: 'ability', weapon: 'archery' },
  'Archery.RainOfArrows': { rowName: 'Archery.RainOfArrows', name: 'Rain of Arrows', type: 'ability', weapon: 'archery' },
  'Archery.Major': { rowName: 'Archery.Major', name: 'Archery Major', type: 'stat', weapon: 'archery' },
  'Archery.CritChance': { rowName: 'Archery.CritChance', name: 'Archery Crit Chance', type: 'stat', statId: 'archeryCritChance', weapon: 'archery' },
  'Archery.Damage.LEVEL1': { rowName: 'Archery.Damage.LEVEL1', name: 'Archery Damage T1', type: 'stat', statId: 'archeryDamage', weapon: 'archery' },
  'Archery.Damage.LEVEL2': { rowName: 'Archery.Damage.LEVEL2', name: 'Archery Damage T2', type: 'stat', statId: 'archeryDamage', weapon: 'archery' },
  'Archery.CritDamage.LEVEL1': { rowName: 'Archery.CritDamage.LEVEL1', name: 'Archery Crit Damage T1', type: 'stat', statId: 'archeryCritDamage', weapon: 'archery' },
  'Archery.CritDamage.LEVEL2': { rowName: 'Archery.CritDamage.LEVEL2', name: 'Archery Crit Damage T2', type: 'stat', statId: 'archeryCritDamage', weapon: 'archery' },
  'Archery.Buff.Damage.LEVEL1': { rowName: 'Archery.Buff.Damage.LEVEL1', name: 'Archery Damage Buff T1', type: 'buff', statId: 'archeryDamage', weapon: 'archery' },
  'Archery.Buff.Crit.LEVEL1': { rowName: 'Archery.Buff.Crit.LEVEL1', name: 'Archery Crit Buff T1', type: 'buff', statId: 'archeryCritDamage', weapon: 'archery' },
  'Archery.Buff.Crit.LEVEL2': { rowName: 'Archery.Buff.Crit.LEVEL2', name: 'Archery Crit Buff T2', type: 'buff', statId: 'archeryCritDamage', weapon: 'archery' },

  // ---------------------------------------------------------------------------
  // MAGERY (11 entries)
  // ---------------------------------------------------------------------------
  'Magery.Q': { rowName: 'Magery.Q', name: 'Magery Q Ability', type: 'ability', weapon: 'magery' },
  'Magery.R': { rowName: 'Magery.R', name: 'Magery R Ability', type: 'ability', weapon: 'magery' },
  'Magery.Major': { rowName: 'Magery.Major', name: 'Magery Major', type: 'stat', weapon: 'magery' },
  'Magery.CritChance': { rowName: 'Magery.CritChance', name: 'Magery Crit Chance', type: 'stat', statId: 'mageryCritChance', weapon: 'magery' },
  'Magery.Damage.LEVEL1': { rowName: 'Magery.Damage.LEVEL1', name: 'Magery Damage T1', type: 'stat', statId: 'mageryDamage', weapon: 'magery' },
  'Magery.Damage.LEVEL2': { rowName: 'Magery.Damage.LEVEL2', name: 'Magery Damage T2', type: 'stat', statId: 'mageryDamage', weapon: 'magery' },
  'Magery.CritDamage.LEVEL1': { rowName: 'Magery.CritDamage.LEVEL1', name: 'Magery Crit Damage T1', type: 'stat', statId: 'mageryCritDamage', weapon: 'magery' },
  'Magery.CritDamage.LEVEL2': { rowName: 'Magery.CritDamage.LEVEL2', name: 'Magery Crit Damage T2', type: 'stat', statId: 'mageryCritDamage', weapon: 'magery' },
  'Magery.Buff.Damage.LEVEL1': { rowName: 'Magery.Buff.Damage.LEVEL1', name: 'Magery Damage Buff T1', type: 'buff', statId: 'mageryDamage', weapon: 'magery' },
  'Magery.Buff.CritDamage.LEVEL1': { rowName: 'Magery.Buff.CritDamage.LEVEL1', name: 'Magery Crit Damage Buff T1', type: 'buff', statId: 'mageryCritDamage', weapon: 'magery' },
  'Magery.Buff.CritDamage.LEVEL2': { rowName: 'Magery.Buff.CritDamage.LEVEL2', name: 'Magery Crit Damage Buff T2', type: 'buff', statId: 'mageryCritDamage', weapon: 'magery' },

  // ---------------------------------------------------------------------------
  // SCYTHE (11 entries — numeric naming, stats inferred)
  // ---------------------------------------------------------------------------
  'Scythe_1': { rowName: 'Scythe_1', name: 'Scythe Node 1', type: 'stat', weapon: 'scythe' },
  'Scythe_2': { rowName: 'Scythe_2', name: 'Scythe Node 2', type: 'stat', weapon: 'scythe' },
  'Scythe_3': { rowName: 'Scythe_3', name: 'Scythe Node 3', type: 'stat', weapon: 'scythe' },
  'Scythe_4': { rowName: 'Scythe_4', name: 'Scythe Node 4', type: 'stat', weapon: 'scythe' },
  'Scythe_5': { rowName: 'Scythe_5', name: 'Scythe Node 5', type: 'stat', weapon: 'scythe' },
  'Scythe_6': { rowName: 'Scythe_6', name: 'Scythe Node 6', type: 'stat', weapon: 'scythe' },
  'Scythe_7': { rowName: 'Scythe_7', name: 'Scythe Node 7', type: 'stat', weapon: 'scythe' },
  'Scythe_8': { rowName: 'Scythe_8', name: 'Scythe Node 8', type: 'stat', weapon: 'scythe' },
  'Scythe_9': { rowName: 'Scythe_9', name: 'Scythe Node 9', type: 'stat', weapon: 'scythe' },
  'Scythe_11': { rowName: 'Scythe_11', name: 'Scythe Node 11', type: 'stat', weapon: 'scythe' },
  'Scythe_12': { rowName: 'Scythe_12', name: 'Scythe Node 12', type: 'stat', weapon: 'scythe' },

  // ---------------------------------------------------------------------------
  // UNARMED / FISTS (11 entries)
  // ---------------------------------------------------------------------------
  'UnarmedQ': { rowName: 'UnarmedQ', name: 'Unarmed Q Ability', type: 'ability', weapon: 'unarmed' },
  'UnarmedR': { rowName: 'UnarmedR', name: 'Unarmed R Ability', type: 'ability', weapon: 'unarmed' },
  'Unarmed_Crit': { rowName: 'Unarmed_Crit', name: 'Unarmed Crit', type: 'stat', statId: 'unarmedCritDamage', weapon: 'unarmed' },
  'UnarmedBaseCritDamage1': { rowName: 'UnarmedBaseCritDamage1', name: 'Unarmed Base Crit Damage', type: 'stat', statId: 'unarmedCritDamage', weapon: 'unarmed' },
  'UnarmedBaseDamage1': { rowName: 'UnarmedBaseDamage1', name: 'Unarmed Base Damage T1', type: 'stat', statId: 'unarmedDamage', weapon: 'unarmed' },
  'UnarmedBaseDamage2': { rowName: 'UnarmedBaseDamage2', name: 'Unarmed Base Damage T2', type: 'stat', statId: 'unarmedDamage', weapon: 'unarmed' },
  'UnarmedBaseDamage3': { rowName: 'UnarmedBaseDamage3', name: 'Unarmed Base Damage T3', type: 'stat', statId: 'unarmedDamage', weapon: 'unarmed' },
  'UnarmedBaseDamage4': { rowName: 'UnarmedBaseDamage4', name: 'Unarmed Base Damage T4', type: 'stat', statId: 'unarmedDamage', weapon: 'unarmed' },
  'UnarmedBaseDamage5': { rowName: 'UnarmedBaseDamage5', name: 'Unarmed Base Damage T5', type: 'stat', statId: 'unarmedDamage', weapon: 'unarmed' },
  'UnarmedBaseDamage6': { rowName: 'UnarmedBaseDamage6', name: 'Unarmed Base Damage T6', type: 'stat', statId: 'unarmedDamage', weapon: 'unarmed' },
  'UnarmedBaseDamage8': { rowName: 'UnarmedBaseDamage8', name: 'Unarmed Base Damage T8', type: 'stat', statId: 'unarmedDamage', weapon: 'unarmed' },
};


// =============================================================================
// CRAFTING / ELVEN SKILL REGISTRY
// =============================================================================

/**
 * @typedef {Object} CraftingSkillDef
 * @property {string} rowName
 * @property {string} name - Display name
 * @property {string} branch - 'armor' | 'damage' | 'crafting' | 'exp' | 'luck' | 'timeTear' | 'utility'
 * @property {string} [statId] - Reference to STAT_REGISTRY id
 * @property {boolean} [paragon] - Whether this is a repeatable paragon node
 */

export const CRAFTING_SKILL_REGISTRY = {
  // ---------------------------------------------------------------------------
  // ARMOR BRANCH (8 entries)
  // ---------------------------------------------------------------------------
  'Armor_ROOT': { rowName: 'Armor_ROOT', name: 'Armor Root', branch: 'armor' },
  'Armor_Health_Low': { rowName: 'Armor_Health_Low', name: 'Health (Low)', branch: 'armor', statId: 'health' },
  'Armor_Health_Medium': { rowName: 'Armor_Health_Medium', name: 'Health (Medium)', branch: 'armor', statId: 'health' },
  'Armor_Health_High': { rowName: 'Armor_Health_High', name: 'Health (High)', branch: 'armor', statId: 'health' },
  'Armor_Health%': { rowName: 'Armor_Health%', name: 'Health Bonus %', branch: 'armor', statId: 'healthBonus' },
  'Armor_ArmorGems': { rowName: 'Armor_ArmorGems', name: 'Armor Gem Slots', branch: 'armor' },
  'Armor_Add_Stone_Drop': { rowName: 'Armor_Add_Stone_Drop', name: 'Stone Drop Bonus', branch: 'armor' },
  'Armor_LifeSteal_BrancEnd': { rowName: 'Armor_LifeSteal_BrancEnd', name: 'Life Steal (Capstone)', branch: 'armor', statId: 'lifeSteal' },

  // ---------------------------------------------------------------------------
  // DAMAGE BRANCH (13 entries)
  // ---------------------------------------------------------------------------
  'Damage_ROOT': { rowName: 'Damage_ROOT', name: 'Damage Root', branch: 'damage' },
  'Damage_DamageGems': { rowName: 'Damage_DamageGems', name: 'Damage Gem Slots', branch: 'damage' },
  'Damage_Add_Flint_Drop': { rowName: 'Damage_Add_Flint_Drop', name: 'Flint Drop Bonus', branch: 'damage' },
  'Damage_Bonus1_Bot': { rowName: 'Damage_Bonus1_Bot', name: 'Damage Bonus 1 (Bot)', branch: 'damage', statId: 'damage' },
  'Damage_Bonus1_Top': { rowName: 'Damage_Bonus1_Top', name: 'Damage Bonus 1 (Top)', branch: 'damage', statId: 'damage' },
  'Damage_Bonus2_Bot': { rowName: 'Damage_Bonus2_Bot', name: 'Damage Bonus 2 (Bot)', branch: 'damage', statId: 'damage' },
  'Damage_Bonus2_Top': { rowName: 'Damage_Bonus2_Top', name: 'Damage Bonus 2 (Top)', branch: 'damage', statId: 'damage' },
  'Damage_Bonus_Mid': { rowName: 'Damage_Bonus_Mid', name: 'Damage Bonus (Mid)', branch: 'damage', statId: 'damage' },
  'Damage_Bonus_Percent': { rowName: 'Damage_Bonus_Percent', name: 'Damage Bonus %', branch: 'damage', statId: 'damageBonus' },
  'Damage_Bonus_StrengthSingle': { rowName: 'Damage_Bonus_StrengthSingle', name: 'Damage from Strength', branch: 'damage', statId: 'strength' },
  'Damage_Bonus_Agility': { rowName: 'Damage_Bonus_Agility', name: 'Damage from Agility', branch: 'damage', statId: 'agility' },
  'Damage_Bonus_DamageEnd': { rowName: 'Damage_Bonus_DamageEnd', name: 'Endgame Damage Bonus', branch: 'damage', statId: 'damageBonus' },
  'Damage_Bonus_DamageEnd_PARAGON': { rowName: 'Damage_Bonus_DamageEnd_PARAGON', name: 'Endgame Damage (Paragon)', branch: 'damage', statId: 'damageBonus', paragon: true },

  // ---------------------------------------------------------------------------
  // CRAFTING PERKS BRANCH (6 entries)
  // ---------------------------------------------------------------------------
  'Crafting_Perks_ROOT': { rowName: 'Crafting_Perks_ROOT', name: 'Crafting Perks Root', branch: 'crafting' },
  'Crafting_Perks_InvSlots1': { rowName: 'Crafting_Perks_InvSlots1', name: 'Inventory Slots +1', branch: 'crafting' },
  'Crafting_Perks_InvSlots2': { rowName: 'Crafting_Perks_InvSlots2', name: 'Inventory Slots +2', branch: 'crafting' },
  'Crafting_Perks_LessCraftingResurces': { rowName: 'Crafting_Perks_LessCraftingResurces', name: 'Reduced Crafting Resources', branch: 'crafting' },
  'Crafting_Perks_LessOffhandsResurces': { rowName: 'Crafting_Perks_LessOffhandsResurces', name: 'Reduced Offhand Resources', branch: 'crafting' },
  'Crafting_Perks_MoreDisenchantMats': { rowName: 'Crafting_Perks_MoreDisenchantMats', name: 'More Disenchant Materials', branch: 'crafting' },

  // ---------------------------------------------------------------------------
  // EXPERIENCE BRANCH (2 entries)
  // ---------------------------------------------------------------------------
  'Exp_ROOT': { rowName: 'Exp_ROOT', name: 'Experience Root', branch: 'exp' },
  'Exp_Books': { rowName: 'Exp_Books', name: 'Experience from Books', branch: 'exp', statId: 'xpBonus' },

  // ---------------------------------------------------------------------------
  // LUCK BRANCH (6 entries)
  // ---------------------------------------------------------------------------
  'Luck_2': { rowName: 'Luck_2', name: 'Luck Tier 2', branch: 'luck' },
  'LuckMoneyBuff': { rowName: 'LuckMoneyBuff', name: 'Money Luck Buff', branch: 'luck' },
  'LuckCritBuff': { rowName: 'LuckCritBuff', name: 'Crit Luck Buff', branch: 'luck', statId: 'critChance' },
  'Luck.DoubleXP': { rowName: 'Luck.DoubleXP', name: 'Double XP Chance', branch: 'luck' },
  'Luck.FlawlessCrafts': { rowName: 'Luck.FlawlessCrafts', name: 'Flawless Craft Chance', branch: 'luck' },
  'Luck.MineGemsDrop': { rowName: 'Luck.MineGemsDrop', name: 'Mine Gem Drop Rate', branch: 'luck' },

  // ---------------------------------------------------------------------------
  // TIME TEAR (3 entries)
  // ---------------------------------------------------------------------------
  'Time_Tear_Cooldown': { rowName: 'Time_Tear_Cooldown', name: 'Time Tear Cooldown', branch: 'timeTear' },
  'Time_Tear_Chance_Slugs': { rowName: 'Time_Tear_Chance_Slugs', name: 'Time Tear Chance (Slugs)', branch: 'timeTear' },
  'Time_Tear_Chance_Elites': { rowName: 'Time_Tear_Chance_Elites', name: 'Time Tear Chance (Elites)', branch: 'timeTear' },

  // ---------------------------------------------------------------------------
  // UTILITY (2 entries)
  // ---------------------------------------------------------------------------
  'Containers_Cooldown': { rowName: 'Containers_Cooldown', name: 'Container Cooldown', branch: 'utility' },
  'Utility.LootPickupRange': { rowName: 'Utility.LootPickupRange', name: 'Loot Pickup Range', branch: 'utility' },
};


// =============================================================================
// CRYSTAL CARD REGISTRY (skeleton — effects TBD)
// =============================================================================
// TODO: Populate card effects. Each card has base stats at L1, L2, L3.
//       Level 6 doubles the L3 stats and removes the card from further choice.
//       Card effects should be added as user-input affixes until full data is available.

/**
 * @typedef {Object} CardDef
 * @property {string} rowName
 * @property {number} family - Card family number
 * @property {number|null} variant - Variant within family (null if base)
 * @property {string} name - Display name (TBD until populated)
 * @property {number} maxLevel - Maximum card level (6)
 * @property {Array} effects - Stat effects per level (empty until populated)
 */

export const CARD_REGISTRY = {
  'CARD3_2': { rowName: 'CARD3_2', family: 3, variant: 2, name: 'Card 3-2', maxLevel: 6, effects: [] },
  'CARD4_1': { rowName: 'CARD4_1', family: 4, variant: 1, name: 'Card 4-1', maxLevel: 6, effects: [] },
  'CARD4_5': { rowName: 'CARD4_5', family: 4, variant: 5, name: 'Card 4-5', maxLevel: 6, effects: [] },
  'CARD5_1': { rowName: 'CARD5_1', family: 5, variant: 1, name: 'Card 5-1', maxLevel: 6, effects: [] },
  'CARD5_10': { rowName: 'CARD5_10', family: 5, variant: 10, name: 'Card 5-10', maxLevel: 6, effects: [] },
  'CARD6_2': { rowName: 'CARD6_2', family: 6, variant: 2, name: 'Card 6-2', maxLevel: 6, effects: [] },
  'CARD7': { rowName: 'CARD7', family: 7, variant: null, name: 'Card 7', maxLevel: 6, effects: [] },
  'CARD10_2': { rowName: 'CARD10_2', family: 10, variant: 2, name: 'Card 10-2', maxLevel: 6, effects: [] },
  'CARD11': { rowName: 'CARD11', family: 11, variant: null, name: 'Card 11', maxLevel: 6, effects: [] },
  'CARD11_0': { rowName: 'CARD11_0', family: 11, variant: 0, name: 'Card 11-0', maxLevel: 6, effects: [] },
  'CARD11_2': { rowName: 'CARD11_2', family: 11, variant: 2, name: 'Card 11-2', maxLevel: 6, effects: [] },
  'CARD11_4': { rowName: 'CARD11_4', family: 11, variant: 4, name: 'Card 11-4', maxLevel: 6, effects: [] },
  'CARD14_3': { rowName: 'CARD14_3', family: 14, variant: 3, name: 'Card 14-3', maxLevel: 6, effects: [] },
  'CARD16': { rowName: 'CARD16', family: 16, variant: null, name: 'Card 16', maxLevel: 6, effects: [] },
  'CARD16_2': { rowName: 'CARD16_2', family: 16, variant: 2, name: 'Card 16-2', maxLevel: 6, effects: [] },
  'CARD17_4': { rowName: 'CARD17_4', family: 17, variant: 4, name: 'Card 17-4', maxLevel: 6, effects: [] },
};


// =============================================================================
// MAIN TREE KEYSTONES (manually curated checklist for user input)
// =============================================================================
// These are notable keystones from the main passive tree that can't be
// auto-detected from opaque node IDs. Users select which ones they have.

/**
 * @typedef {Object} KeystoneDef
 * @property {string} id - Internal identifier
 * @property {string} name - Display name
 * @property {string} category - 'proximity' | 'mastery' | 'affinity' | 'utility'
 * @property {string} description - What this keystone does
 * @property {string} [statId] - Maps to STAT_REGISTRY id if it grants a flat stat
 * @property {string[]} [overlaps] - Notes overlap sources (e.g. 'monogram')
 */

export const TREE_KEYSTONES = {
  // Proximity multipliers
  closeDistance: {
    id: 'closeDistance',
    name: 'Close Distance',
    category: 'proximity',
    description: 'Double damage within 5m',
    overlaps: ['monogram'],
  },
  farDistance: {
    id: 'farDistance',
    name: 'Far Distance',
    category: 'proximity',
    description: 'Double damage at 20m+',
    overlaps: ['monogram'],
  },

  // Stance mastery
  meleeMasteryDamage: {
    id: 'meleeMasteryDamage',
    name: 'Melee Mastery: Damage',
    category: 'mastery',
    description: 'Increased melee stance damage',
    overlaps: ['monogram'],
  },
  meleeMasteryArmor: {
    id: 'meleeMasteryArmor',
    name: 'Melee Mastery: Armor',
    category: 'mastery',
    description: 'Increased armor while in melee stance',
    overlaps: ['monogram'],
  },
  rangedMasteryDamage: {
    id: 'rangedMasteryDamage',
    name: 'Ranged Mastery: Damage',
    category: 'mastery',
    description: 'Increased ranged stance damage',
    overlaps: ['monogram'],
  },
  rangedMasteryArmor: {
    id: 'rangedMasteryArmor',
    name: 'Ranged Mastery: Armor',
    category: 'mastery',
    description: 'Increased armor while in ranged stance',
    overlaps: ['monogram'],
  },

  // Affinity - CDR
  fireCdr: {
    id: 'fireCdr',
    name: 'Fire Affinity CDR',
    category: 'affinity',
    description: '~35% cooldown reduction (fire)',
  },
  arcaneCdr: {
    id: 'arcaneCdr',
    name: 'Arcane Affinity CDR',
    category: 'affinity',
    description: '~35% cooldown reduction (arcane)',
  },
  lightningCdr: {
    id: 'lightningCdr',
    name: 'Lightning Affinity CDR',
    category: 'affinity',
    description: '~35% cooldown reduction (lightning)',
  },

  // Affinity - Damage
  fireAffinityDamage: {
    id: 'fireAffinityDamage',
    name: 'Fire Affinity Damage',
    category: 'affinity',
    description: '~100% fire damage (additive with other fire sources)',
    statId: 'fireDamageBonus',
  },
  arcaneAffinityDamage: {
    id: 'arcaneAffinityDamage',
    name: 'Arcane Affinity Damage',
    category: 'affinity',
    description: '~100% arcane damage (additive with other arcane sources)',
    statId: 'arcaneDamageBonus',
  },
  lightningAffinityDamage: {
    id: 'lightningAffinityDamage',
    name: 'Lightning Affinity Damage',
    category: 'affinity',
    description: '~100% lightning damage (additive with other lightning sources)',
    statId: 'lightningDamageBonus',
  },

  // Utility
  extraInventorySlots: {
    id: 'extraInventorySlots',
    name: 'Extra Inventory Slots',
    category: 'utility',
    description: 'Additional inventory capacity from skill tree',
  },
  extraPotions: {
    id: 'extraPotions',
    name: 'Extra Potions',
    category: 'utility',
    description: 'Additional potion slots from skill tree',
  },
};


// =============================================================================
// LOOKUP HELPERS
// =============================================================================

/**
 * Get weapon skill definition by rowName
 * @param {string} rowName
 * @returns {WeaponSkillDef|null}
 */
export function getWeaponSkillDef(rowName) {
  return WEAPON_SKILL_REGISTRY[rowName] || null;
}

/**
 * Get crafting skill definition by rowName
 * @param {string} rowName
 * @returns {CraftingSkillDef|null}
 */
export function getCraftingSkillDef(rowName) {
  return CRAFTING_SKILL_REGISTRY[rowName] || null;
}

/**
 * Get card definition by rowName
 * @param {string} rowName
 * @returns {CardDef|null}
 */
export function getCardDef(rowName) {
  return CARD_REGISTRY[rowName] || null;
}

/**
 * Get keystone definition by id
 * @param {string} id
 * @returns {KeystoneDef|null}
 */
export function getKeystoneDef(id) {
  return TREE_KEYSTONES[id] || null;
}

/**
 * Get all keystones as an array
 * @returns {KeystoneDef[]}
 */
export function getAllKeystones() {
  return Object.values(TREE_KEYSTONES);
}

/**
 * Get keystones by category
 * @param {string} category - 'proximity' | 'mastery' | 'affinity' | 'utility'
 * @returns {KeystoneDef[]}
 */
export function getKeystonesByCategory(category) {
  return Object.values(TREE_KEYSTONES).filter(k => k.category === category);
}

/**
 * Check if a weapon skill rowName is a known entry
 * @param {string} rowName
 * @returns {boolean}
 */
export function isKnownWeaponSkill(rowName) {
  return rowName in WEAPON_SKILL_REGISTRY;
}

/**
 * Check if a crafting skill rowName is a known entry
 * @param {string} rowName
 * @returns {boolean}
 */
export function isKnownCraftingSkill(rowName) {
  return rowName in CRAFTING_SKILL_REGISTRY;
}

/**
 * Get all weapon skills for a specific weapon type
 * @param {string} weaponType - One of WEAPON_TYPE values
 * @returns {WeaponSkillDef[]}
 */
export function getWeaponSkillsByType(weaponType) {
  return Object.values(WEAPON_SKILL_REGISTRY).filter(s => s.weapon === weaponType);
}

/**
 * Get all crafting skills for a specific branch
 * @param {string} branch
 * @returns {CraftingSkillDef[]}
 */
export function getCraftingSkillsByBranch(branch) {
  return Object.values(CRAFTING_SKILL_REGISTRY).filter(s => s.branch === branch);
}
