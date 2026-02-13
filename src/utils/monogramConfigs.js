/**
 * Monogram Calculation Configs
 *
 * Maps monogram IDs to their calculation engine configs.
 * When a monogram is applied, these configs override the default
 * calculation parameters in DERIVED_STATS.
 *
 * Structure:
 * - derivedStatId: Which derived stat this monogram affects (legacy single-stat format)
 * - effects: Array of { derivedStatId, config } for multi-stat monograms
 * - displayName: Human-readable name for UI display
 *
 * @module utils/monogramConfigs
 */

export const MONOGRAM_CALC_CONFIGS = {
  // ===========================================================================
  // PHASING (Helmet Monogram - 50 stacks)
  // Effects: 1% damage, 0.5% boss damage per stack
  // ===========================================================================
  'Phasing.TranceEffectsPotency.Highest': {
    displayName: 'Phasing',
    effects: [
      { derivedStatId: 'phasingStacks', config: { enabled: true, maxStacks: 50, currentStacks: 50 } },
    ],
  },
  'AllowPhasing': {
    displayName: 'Phasing',
    effects: [
      { derivedStatId: 'phasingStacks', config: { enabled: true, maxStacks: 50, currentStacks: 50 } },
    ],
  },

  // ===========================================================================
  // BLOODLUST (Helmet Monogram - 100 stacks)
  // Effects: 5% crit damage, 3% attack speed, 1% movement speed per stack
  // ===========================================================================
  'Bloodlust.Base': {
    displayName: 'Bloodlust',
    effects: [
      { derivedStatId: 'bloodlustStacks', config: { enabled: true, maxStacks: 100, currentStacks: 100 } },
    ],
  },
  'Bloodlust.Damage%PerStack': {
    displayName: 'Bloodlust Damage',
    derivedStatId: 'monogramValueFromStrength',
    config: {
      sourceStat: 'bloodlustStacks',
      ratio: 1,
      baseValue: 2, // Extra 2% damage per stack
    },
  },

  // ===========================================================================
  // DARK ESSENCE (Amulet Monogram - 500 stacks)
  // At 500 stacks: Essence = highestStat * 1.25
  // ===========================================================================
  'DarkEssence': {
    displayName: 'Dark Essence',
    effects: [
      { derivedStatId: 'darkEssenceStacks', config: { enabled: true, maxStacks: 500, currentStacks: 500 } },
    ],
  },

  // ===========================================================================
  // BLOODLUST LIFE (Amulet Monogram - 100 stacks)
  // Effects: 1% life bonus per stack
  // ===========================================================================
  'Bloodlust.DrawLife': {
    displayName: 'Bloodlust Life',
    effects: [
      { derivedStatId: 'lifeBuffStacks', config: { enabled: true, maxStacks: 100, currentStacks: 100 } },
    ],
  },
  'Bloodlust.MoreLife.Highest': {
    displayName: 'Bloodlust Life',
    description: '0.1% life per stack per 50 highest attribute',
    effects: [
      { derivedStatId: 'bloodlustLifeBonus', config: { enabled: true, lifePerStackPer50: 0.1 } },
    ],
  },

  // ===========================================================================
  // ESSENCE → CRIT CHAIN
  // 1% crit per 20 essence
  // ===========================================================================
  'BonusCritDamage%ForEssence': {
    displayName: 'Crit from Essence',
    effects: [
      { derivedStatId: 'critChanceFromEssence', config: { enabled: true, essencePerCrit: 20 } },
    ],
  },
  'GainCritChanceForHighest': {
    displayName: 'Crit from Stats',
    effects: [
      { derivedStatId: 'critChanceFromEssence', config: { enabled: true, essencePerCrit: 20 } },
    ],
  },

  // ===========================================================================
  // ELEMENT FOR CRIT CHANCE (Helmet Monogram)
  // 3% fire/arcane/lightning per 1% crit over 100%
  // ===========================================================================
  'ElementForCritChance.Fire': {
    displayName: 'Fire from Crit',
    effects: [
      { derivedStatId: 'elementFromCritChance', config: { enabled: true, elementType: 'fire', critThreshold: 100, elementPerCrit: 3 } },
    ],
  },
  'ElementForCritChance.Lightning': {
    displayName: 'Lightning from Crit',
    effects: [
      { derivedStatId: 'elementFromCritChance', config: { enabled: true, elementType: 'lightning', critThreshold: 100, elementPerCrit: 3 } },
    ],
  },
  'ElementForCritChance.Arcane': {
    displayName: 'Arcane from Crit',
    effects: [
      { derivedStatId: 'elementFromCritChance', config: { enabled: true, elementType: 'arcane', critThreshold: 100, elementPerCrit: 3 } },
    ],
  },

  // ===========================================================================
  // LIFE FROM ELEMENT (Ring Monogram)
  // 2% life per 30% of a particular element
  // ===========================================================================
  'ElementalToHp%.Fire': {
    displayName: 'Life from Fire',
    effects: [
      { derivedStatId: 'lifeFromElement', config: { enabled: true, elementPer: 30, lifeBonus: 2 } },
    ],
  },

  // ===========================================================================
  // GAIN DAMAGE FOR HP LOSE ARMOR (Bracer Monogram)
  // 1% of total life as flat damage
  // ===========================================================================
  'GainDamageForHPLoseArmor': {
    displayName: 'Damage from Life',
    effects: [
      { derivedStatId: 'damageFromLife', config: { enabled: true, lifePercent: 1 } },
    ],
  },

  // ===========================================================================
  // SHROUD (1H Monogram - 50 stacks max)
  // Effects: 3% life per stack
  // ===========================================================================
  'Shroud.ExtraHp': {
    displayName: 'Shroud HP',
    description: '+3% life per shroud stack (50 stacks max = 150%)',
    effects: [
      { derivedStatId: 'shroudStacks', config: { enabled: true, maxStacks: 50, currentStacks: 50 } },
    ],
  },

  // ===========================================================================
  // DAMAGE CIRCLE / UNHOLY VOID (Amulet + upcoming Helmet)
  // 2% life bonus per 50 of highest attribute
  // ===========================================================================
  'DamageCircle.Hp%.Highest': {
    displayName: 'Circle Life Bonus',
    description: '+2% life per 50 of highest attribute while in circle',
    effects: [
      { derivedStatId: 'damageCircleLifeBonus', config: { enabled: true, lifePerInterval: 2, statInterval: 50 } },
    ],
  },

  // ===========================================================================
  // DISTANCE PROCS (Amulet - exclusive pair, own additive bucket)
  // 50% damage each, NOT regular damageBonus
  // ===========================================================================
  'DistanceProcsDamage': {
    displayName: 'Distance Procs',
    description: '+50% damage (own additive bucket, exclusive with Near)',
    effects: [
      { derivedStatId: 'distanceProcsDamageBonus', config: { enabled: true, bonusPercent: 50 } },
    ],
  },
  'DistanceProcsDamage_Near': {
    displayName: 'Distance Procs (Near)',
    description: '+50% damage (own additive bucket, exclusive with Far)',
    effects: [
      { derivedStatId: 'distanceProcsNearDamageBonus', config: { enabled: true, bonusPercent: 50 } },
    ],
  },

  // ===========================================================================
  // ELITE BUFFS (Amulet - assume capped stacks for calcs)
  // ===========================================================================
  'EliteBuffs.AttackSpeed%': {
    displayName: 'Elite AS Buff',
    description: 'Attack speed from elite kills (assume capped)',
    effects: [
      { derivedStatId: 'eliteAttackSpeedBonus', config: { enabled: true, attackSpeedPerStack: 3, maxStacks: 10, currentStacks: 10 } },
    ],
  },
  'EliteBuffs.Energy': {
    displayName: 'Elite Energy Buff',
    description: 'Energy from elite kills (assume capped)',
    effects: [
      { derivedStatId: 'eliteEnergyBonus', config: { enabled: true, energyPerStack: 10, maxStacks: 10, currentStacks: 10 } },
    ],
  },

  // ===========================================================================
  // EXTRA LIFESTEAL (Amulet - simple additive)
  // ===========================================================================
  'ExtraLifeSteal': {
    displayName: 'Extra Lifesteal',
    description: '+10% lifesteal',
    effects: [
      { derivedStatId: 'extraLifestealBonus', config: { enabled: true, lifestealPercent: 10 } },
    ],
  },

  // ===========================================================================
  // FLAT DAMAGE MONOGRAMS (Amulet)
  // ===========================================================================
  'DamageBonusAnd51Damage': {
    displayName: 'Flat Damage Bonus',
    description: '+300 flat damage (drawback: incoming damage deals 50% HP)',
    effects: [
      { derivedStatId: 'flatDamageMonogramBonus', config: { enabled: true, flatDamage: 300 } },
    ],
  },
  'DamageGainNoEnergy': {
    displayName: 'No Energy Damage',
    description: '+300 flat damage (drawback: sets energy to 0)',
    effects: [
      { derivedStatId: 'noEnergyDamageBonus', config: { enabled: true, flatDamage: 300 } },
    ],
  },

  // ===========================================================================
  // HIGHEST STAT FOR DAMAGE (Amulet)
  // 1% damage bonus per 50 of highest stat
  // ===========================================================================
  'HighestStatForDamage': {
    displayName: 'Highest Stat Damage',
    description: '+1% damage per 50 of highest stat',
    effects: [
      { derivedStatId: 'highestStatDamageBonus', config: { enabled: true, damagePerInterval: 1, statInterval: 50 } },
    ],
  },

  // ===========================================================================
  // SPAWN CHANCES (Amulet - display only, no calc chain)
  // ===========================================================================
  'ChanceToSpawnAnotherElite': {
    displayName: 'Elite Spawn Chance',
    description: '10% per instance to spawn another elite (cap 40%)',
    effects: [
      { derivedStatId: 'eliteSpawnChance', config: { enabled: true, chancePerInstance: 10, maxChance: 40 } },
    ],
  },
  'ChanceToSpawnContainer': {
    displayName: 'Container Spawn Chance',
    description: '10% per instance to spawn a container (cap 100%)',
    effects: [
      { derivedStatId: 'containerSpawnChance', config: { enabled: true, chancePerInstance: 10, maxChance: 100 } },
    ],
  },

  // ===========================================================================
  // CRIT DAMAGE FROM ARMOR (Helmet Monogram)
  // 1% crit damage per 500 total armor
  // ===========================================================================
  'CritDamageForArmor': {
    displayName: 'Crit from Armor',
    description: '+1% crit damage per 500 total armor',
    effects: [
      { derivedStatId: 'critDamageFromArmor', config: { enabled: true, critDamagePerInterval: 1, armorInterval: 500 } },
    ],
  },

  // ===========================================================================
  // ELEMENT FOR CRIT CHANCE → LIFE (Helmet Monogram)
  // 1% life bonus per 1% crit over 100%
  // ===========================================================================
  'ElementForCritChance.MaxHealth': {
    displayName: 'Life from Crit',
    description: '+1% life per 1% crit over 100%',
    effects: [
      { derivedStatId: 'lifeBonusFromCritChance', config: { enabled: true, critThreshold: 100, lifePerCrit: 1 } },
    ],
  },

  // ===========================================================================
  // ENERGY TO DAMAGE (Helmet Monogram)
  // 2 flat damage per energy over base 100
  // ===========================================================================
  'ExtraEnergyAddDamage': {
    displayName: 'Energy to Damage',
    description: '+2 flat damage per energy over base 100',
    effects: [
      { derivedStatId: 'energyDamageBonus', config: { enabled: true, baseEnergy: 100, damagePerEnergy: 2 } },
    ],
  },

  // ===========================================================================
  // INVENTORY SLOT BONUSES (Helmet Monograms)
  // ===========================================================================
  'ExtraInventorySlotForAttackSpeed': {
    displayName: 'Boss Damage (Inv Slot)',
    description: '+1% boss damage per extra inventory slot',
    effects: [
      { derivedStatId: 'invSlotBossDamageBonus', config: { enabled: true, bonusPerSlot: 1 } },
    ],
  },
  'ExtraInventorySlotForCritDamage': {
    displayName: 'Crit Damage (Inv Slot)',
    description: '+5% crit damage per extra inventory slot',
    effects: [
      { derivedStatId: 'invSlotCritDamageBonus', config: { enabled: true, bonusPerSlot: 5 } },
    ],
  },

  // ===========================================================================
  // JUGGERNAUT (Helmet - Fist Pinnacle, single instance)
  // +40% MS, +25% crit chance, 2x crit damage multiplier
  // ===========================================================================
  'Juggernaut': {
    displayName: 'Juggernaut',
    description: '+40% MS, +25% crit, 2x crit damage (fist pinnacle, single instance)',
    effects: [
      { derivedStatId: 'juggernautMoveSpeed', config: { enabled: true, moveSpeedBonus: 40 } },
      { derivedStatId: 'juggernautCritChance', config: { enabled: true, critChanceBonus: 25 } },
      { derivedStatId: 'juggernautCritDamage', config: { enabled: true, critDamageMultiplier: 2 } },
    ],
  },

  // ===========================================================================
  // LIFESTEAL TO ENERGY STEAL (Helmet - drawback)
  // ===========================================================================
  'LifeStealToEnergySteal': {
    displayName: 'Energy Steal',
    description: 'Converts lifesteal to energy steal (drawback)',
    effects: [
      { derivedStatId: 'lifestealToEnergySteal', config: { enabled: true } },
    ],
  },

  // ===========================================================================
  // PARAGON (Helmet - Melee & Ranged stances)
  // Per level: 15 armor, 2 flat damage, 10 flat HP
  // Level from stance XP (out of scope), configurable
  // ===========================================================================
  'MeleeParagon.Armor': {
    displayName: 'Melee Paragon Armor',
    description: '+15 armor per paragon level (maul/spear/sword/2h)',
    effects: [
      { derivedStatId: 'paragonLevel', config: { enabled: true } },
      { derivedStatId: 'paragonArmorBonus', config: { armorPerLevel: 15 } },
    ],
  },
  'MeleeParagon.BaseDamage': {
    displayName: 'Melee Paragon Damage',
    description: '+2 flat damage per paragon level (maul/spear/sword/2h)',
    effects: [
      { derivedStatId: 'paragonLevel', config: { enabled: true } },
      { derivedStatId: 'paragonDamageBonus', config: { damagePerLevel: 2 } },
    ],
  },
  'MeleeParagon.MaxHp': {
    displayName: 'Melee Paragon HP',
    description: '+10 flat HP per paragon level (maul/spear/sword/2h)',
    effects: [
      { derivedStatId: 'paragonLevel', config: { enabled: true } },
      { derivedStatId: 'paragonHpBonus', config: { hpPerLevel: 10 } },
    ],
  },
  'RangedParagon.Armor': {
    displayName: 'Ranged Paragon Armor',
    description: '+15 armor per paragon level (bow/magery/scythe/fist)',
    effects: [
      { derivedStatId: 'paragonLevel', config: { enabled: true } },
      { derivedStatId: 'paragonArmorBonus', config: { armorPerLevel: 15 } },
    ],
  },
  'RangedParagon.BaseDamage': {
    displayName: 'Ranged Paragon Damage',
    description: '+2 flat damage per paragon level (bow/magery/scythe/fist)',
    effects: [
      { derivedStatId: 'paragonLevel', config: { enabled: true } },
      { derivedStatId: 'paragonDamageBonus', config: { damagePerLevel: 2 } },
    ],
  },
  'RangedParagon.MaxHp': {
    displayName: 'Ranged Paragon HP',
    description: '+10 flat HP per paragon level (bow/magery/scythe/fist)',
    effects: [
      { derivedStatId: 'paragonLevel', config: { enabled: true } },
      { derivedStatId: 'paragonHpBonus', config: { hpPerLevel: 10 } },
    ],
  },

  // ===========================================================================
  // SHROUD BASE (Helmet - 1H stance enabler)
  // 5% damageBonus + 1% flatDamageBonus (separate multiplier) per stack, 50 max
  // ===========================================================================
  'Shroud': {
    displayName: 'Shroud',
    description: '+5% damage + 1% flat damage (separate mult.) per stack (50 max)',
    effects: [
      { derivedStatId: 'shroudStacks', config: { enabled: true, maxStacks: 50, currentStacks: 50 } },
      { derivedStatId: 'shroudDamageBonus', config: { damagePerStack: 5 } },
      { derivedStatId: 'shroudFlatDamageBonus', config: { flatDamagePerStack: 1 } },
    ],
  },

  // ===========================================================================
  // SNAIL SPAWN (Helmet - display only)
  // ===========================================================================
  'ChanceForSnails': {
    displayName: 'Snail Spawn',
    description: '10% per instance to spawn snails',
    effects: [
      { derivedStatId: 'snailSpawnChance', config: { enabled: true, chancePerInstance: 10 } },
    ],
  },

  // ===========================================================================
  // CHARGED GLYPH RUNES (Helmet - TBD, triple secondary charge rate)
  // ===========================================================================
  'Gain2ChargedGlyphRunes': {
    displayName: 'Charged Glyphs',
    description: 'Triple secondary charge rate (TBD)',
    effects: [],
  },

  // ===========================================================================
  // COLOSSUS BASE (Helmet - 2H capstone)
  // 50% CDR, 50% IAS, 5% duration, 30s cooldown
  // ===========================================================================
  'Colossus.Base': {
    displayName: 'Colossus',
    description: '2H capstone: 50% CDR, 50% IAS, 5% duration, 30s CD',
    effects: [],
  },

  // ===========================================================================
  // DAMAGE CIRCLE BASE (Helmet - Unholy Void)
  // Disables regular attacks/skills, 100% damage weapon hit in AOE
  // ===========================================================================
  'DamageCircle.Base': {
    displayName: 'Unholy Void',
    description: 'Disables attacks/skills, 100% damage weapon hit in AOE',
    effects: [],
  },

  // ===========================================================================
  // COLOSSUS CDR (Amulet - 2H stance, minimal calc impact)
  // ===========================================================================
  'Colossus.CooldownReduceOnEliteKill': {
    displayName: 'Colossus CDR',
    description: 'Cooldown reduction on elite kill (2H stance)',
    effects: [],
  },

  // ===========================================================================
  // SECONDARY BUILD (Amulet - deferred, interactions TBD)
  // ===========================================================================
  'SecondaryBuild.DoubleEnergyMoreDamage': {
    displayName: 'Energy Overcharge',
    description: 'Secondary costs double energy, deals more damage (TBD)',
    effects: [],
  },

  // ===========================================================================
  // RING MONOGRAMS - Stat Scalers
  // ===========================================================================
  'DamageForStat.Highest': {
    displayName: 'Damage from Stats',
    derivedStatId: 'monogramValueFromStrength',
    config: {
      sourceStat: 'highestAttribute',
      ratio: 100,
      baseValue: 5,
    },
  },
  'BonusDamage%ForEssence': {
    displayName: 'Damage from Essence',
    effects: [],
  },
  'MaxHp%ForStat.Highest': {
    displayName: 'HP from Stats',
    effects: [],
  },
  'DamageReduction%ForStat.Highest': {
    displayName: 'DR from Stats',
    effects: [],
  },
  'Colossus.ElementalBonusForHighestStat.Arcane': {
    displayName: 'Arcane from Stats (Colossus)',
    effects: [],
  },

  // ===========================================================================
  // OTHER MONOGRAM CONFIGS
  // ===========================================================================
  'Health%ForHighest': {
    displayName: 'Health from Stats',
    derivedStatId: 'chainedHealthBonus',
    config: {
      sourceStat: 'totalVitality',
      ratio: 50,
      baseValue: 1,
    },
  },
  'Colossus.DamageReduction': {
    displayName: 'Colossus DR',
    derivedStatId: null,
  },
  'DamageCircle.DamageForStats.Highest': {
    displayName: 'Circle Damage from HP',
    derivedStatId: 'damageFromHealth',
    config: {
      sourceStat: 'totalHealth',
      percentage: 1,
    },
  },
  'PotionSlotForStat.Highest': {
    displayName: 'Potion Slots from Stats',
    derivedStatId: 'potionSlotsFromAttributes',
    config: {
      ratio: 50,  // 1 potion slot per 50 of highest stat
    },
  },
  'Damage%ForPotions': {
    displayName: 'Damage from Potions',
    derivedStatId: 'statBonusFromPotions',
    config: {
      sourceStat: 'potionSlotsFromAttributes',
      ratio: 1,
      baseValue: 5,  // 5% damage per available potion slot
    },
  },
};

/**
 * Get effect summary text for a monogram
 * @param {string} monoId - Monogram ID
 * @returns {string|null} Human-readable effect description
 */
export function getMonogramEffectSummary(monoId) {
  const config = MONOGRAM_CALC_CONFIGS[monoId];
  if (!config) return null;

  if (config.displayName) {
    if (config.description) {
      return `${config.displayName}: ${config.description}`;
    }
    return config.displayName;
  }

  return null;
}

/**
 * Get all monogram IDs that trigger a specific derived stat
 * @param {string} derivedStatId - The derived stat ID
 * @returns {string[]} Array of monogram IDs
 */
export function getMonogramsForDerivedStat(derivedStatId) {
  const result = [];

  for (const [monoId, config] of Object.entries(MONOGRAM_CALC_CONFIGS)) {
    if (config.derivedStatId === derivedStatId) {
      result.push(monoId);
    }
    if (config.effects) {
      for (const effect of config.effects) {
        if (effect.derivedStatId === derivedStatId) {
          result.push(monoId);
          break;
        }
      }
    }
  }

  return result;
}

export default MONOGRAM_CALC_CONFIGS;
