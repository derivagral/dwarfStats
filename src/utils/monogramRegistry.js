/**
 * Monogram Registry
 *
 * Single source of truth for all monogram/modifier definitions.
 * Maps save-file tag names to user-friendly display names.
 *
 * Monograms are special modifiers that can be crafted onto gear at the Codex.
 * Each equipment slot has its own pool of available monograms.
 *
 * Save data format: "EasyRPG.Items.Modifiers.<MonogramId>"
 * This registry stores just the MonogramId portion.
 */

// ============================================================================
// MONOGRAM REGISTRY - ID to Display Name Mappings
// ============================================================================

/**
 * @typedef {Object} MonogramDef
 * @property {string} id - Internal identifier (matches save data suffix)
 * @property {string} name - User-friendly display name
 * @property {string} [category] - Grouping category
 * @property {string} [description] - Detailed description
 * @property {string[]} [aliases] - Alternative save-data names that map to this
 */

export const MONOGRAM_REGISTRY = {
  // ---------------------------------------------------------------------------
  // PHASING / MOBILITY
  // ---------------------------------------------------------------------------
  'AllowPhasing': {
    id: 'AllowPhasing',
    name: 'Phase Walk',
    category: 'mobility',
    description: 'Allows phasing through enemies',
  },
  'Phasing.MovementSpeedBonus': {
    id: 'Phasing.MovementSpeedBonus',
    name: 'Phase Speed',
    category: 'mobility',
    description: 'Movement speed bonus while phasing',
  },
  'Phasing.PhasingTrance.Hp': {
    id: 'Phasing.PhasingTrance.Hp',
    name: 'Phase Trance HP',
    category: 'mobility',
    description: 'HP bonus during phasing trance',
  },
  'Phasing.TranceEffectsPotency.Highest': {
    id: 'Phasing.TranceEffectsPotency.Highest',
    name: 'Trance Potency',
    category: 'mobility',
    description: 'Increased trance effect potency based on highest stat',
  },
  'FasterMount': {
    id: 'FasterMount',
    name: 'Swift Mount',
    category: 'mobility',
    description: 'Increased mount speed',
  },

  // ---------------------------------------------------------------------------
  // BLOODLUST
  // ---------------------------------------------------------------------------
  'Bloodlust.Base': {
    id: 'Bloodlust.Base',
    name: 'Bloodlust',
    category: 'bloodlust',
    description: 'Base bloodlust effect',
  },
  'Bloodlust.Armor%': {
    id: 'Bloodlust.Armor%',
    name: 'Bloodlust Armor',
    category: 'bloodlust',
    description: 'Armor bonus from bloodlust stacks',
  },
  'Bloodlust.Damage%PerStack': {
    id: 'Bloodlust.Damage%PerStack',
    name: 'Bloodlust Damage',
    category: 'bloodlust',
    description: 'Damage per bloodlust stack',
  },
  'Bloodlust.DrawBlood': {
    id: 'Bloodlust.DrawBlood',
    name: 'Draw Blood',
    category: 'bloodlust',
    description: 'Bloodlust blood draw effect',
  },
  'Bloodlust.DrawLife': {
    id: 'Bloodlust.DrawLife',
    name: 'Draw Life',
    category: 'bloodlust',
    description: 'Bloodlust life draw effect',
  },
  'Bloodlust.MoreLife.Highest': {
    id: 'Bloodlust.MoreLife.Highest',
    name: 'Bloodlust Life Bonus',
    category: 'bloodlust',
    description: 'More life from bloodlust based on highest stat',
  },

  // ---------------------------------------------------------------------------
  // COLOSSUS
  // ---------------------------------------------------------------------------
  'Colossus.Base': {
    id: 'Colossus.Base',
    name: 'Colossus',
    category: 'colossus',
    description: 'Base colossus effect',
  },
  'Colossus.CooldownReduceOnEliteKill': {
    id: 'Colossus.CooldownReduceOnEliteKill',
    name: 'Colossus CDR',
    category: 'colossus',
    description: 'Cooldown reduction on elite kill',
  },
  'Colossus.DamageReduction': {
    id: 'Colossus.DamageReduction',
    name: 'Colossus DR',
    category: 'colossus',
    description: 'Damage reduction while Colossus active',
  },
  'Colossus.DoubleAttackSpeed': {
    id: 'Colossus.DoubleAttackSpeed',
    name: 'Colossus Attack Speed',
    category: 'colossus',
    description: 'Double attack speed during Colossus',
  },
  'Colossus.ElementalBonusForHighestStat.Arcane': {
    id: 'Colossus.ElementalBonusForHighestStat.Arcane',
    name: 'Colossus Arcane',
    category: 'colossus',
    description: 'Arcane bonus based on highest stat',
  },
  'Colossus.FreeDash': {
    id: 'Colossus.FreeDash',
    name: 'Colossus Dash',
    category: 'colossus',
    description: 'Free dash during Colossus',
  },
  'Colossus.LifeSteal': {
    id: 'Colossus.LifeSteal',
    name: 'Colossus Lifesteal',
    category: 'colossus',
    description: 'Lifesteal during Colossus',
  },

  // ---------------------------------------------------------------------------
  // SHROUD
  // ---------------------------------------------------------------------------
  'Shroud': {
    id: 'Shroud',
    name: 'Shroud',
    category: 'shroud',
    description: 'Base shroud effect',
  },
  'Shroud.ElementalAug.Arcane': {
    id: 'Shroud.ElementalAug.Arcane',
    name: 'Shroud Arcane',
    category: 'shroud',
    description: 'Arcane augment for shroud',
  },
  'Shroud.ExtraHp': {
    id: 'Shroud.ExtraHp',
    name: 'Shroud HP',
    category: 'shroud',
    description: 'Extra HP while shrouded',
  },
  'Shroud.MaxStacksBonus': {
    id: 'Shroud.MaxStacksBonus',
    name: 'Shroud Stacks',
    category: 'shroud',
    description: 'Increased max shroud stacks',
  },
  'Shroud.OnLose': {
    id: 'Shroud.OnLose',
    name: 'Shroud On Lose',
    category: 'shroud',
    description: 'Effect when shroud is lost',
  },

  // ---------------------------------------------------------------------------
  // VEIL
  // ---------------------------------------------------------------------------
  'Veil': {
    id: 'Veil',
    name: 'Veil',
    category: 'veil',
    description: 'Base veil effect',
  },
  'Veil.OnLose': {
    id: 'Veil.OnLose',
    name: 'Veil On Lose',
    category: 'veil',
    description: 'Effect when veil is lost',
  },

  // ---------------------------------------------------------------------------
  // DAMAGE CIRCLE
  // ---------------------------------------------------------------------------
  'DamageCircle.Base': {
    id: 'DamageCircle.Base',
    name: 'Damage Circle',
    category: 'damageCircle',
    description: 'Base damage circle effect',
  },
  'DamageCircle.BiggerFaster': {
    id: 'DamageCircle.BiggerFaster',
    name: 'Bigger Circle',
    category: 'damageCircle',
    description: 'Larger and faster damage circle',
  },
  'DamageCircle.BossDamageBuff': {
    id: 'DamageCircle.BossDamageBuff',
    name: 'Circle Boss Damage',
    category: 'damageCircle',
    description: 'Increased boss damage in circle',
  },
  'DamageCircle.DamageForStats.Highest': {
    id: 'DamageCircle.DamageForStats.Highest',
    name: 'Circle Stat Damage',
    category: 'damageCircle',
    description: 'Circle damage scales with highest stat',
  },
  'DamageCircle.DamageReduction.Highest': {
    id: 'DamageCircle.DamageReduction.Highest',
    name: 'Circle DR',
    category: 'damageCircle',
    description: 'Damage reduction in circle based on highest stat',
  },
  'DamageCircle.Hp%.Highest': {
    id: 'DamageCircle.Hp%.Highest',
    name: 'Circle HP',
    category: 'damageCircle',
    description: 'HP bonus in circle based on highest stat',
  },

  // ---------------------------------------------------------------------------
  // PARAGON (MELEE / RANGED)
  // ---------------------------------------------------------------------------
  'MeleeParagon.Armor': {
    id: 'MeleeParagon.Armor',
    name: 'Melee Paragon Armor',
    category: 'paragon',
    description: 'Armor bonus for melee paragon',
  },
  'MeleeParagon.BaseDamage': {
    id: 'MeleeParagon.BaseDamage',
    name: 'Melee Paragon Damage',
    category: 'paragon',
    description: 'Base damage for melee paragon',
  },
  'MeleeParagon.MaxHp': {
    id: 'MeleeParagon.MaxHp',
    name: 'Melee Paragon HP',
    category: 'paragon',
    description: 'Max HP for melee paragon',
  },
  'RangedParagon.Armor': {
    id: 'RangedParagon.Armor',
    name: 'Ranged Paragon Armor',
    category: 'paragon',
    description: 'Armor bonus for ranged paragon',
  },
  'RangedParagon.BaseDamage': {
    id: 'RangedParagon.BaseDamage',
    name: 'Ranged Paragon Damage',
    category: 'paragon',
    description: 'Base damage for ranged paragon',
  },
  'RangedParagon.MaxHp': {
    id: 'RangedParagon.MaxHp',
    name: 'Ranged Paragon HP',
    category: 'paragon',
    description: 'Max HP for ranged paragon',
  },

  // ---------------------------------------------------------------------------
  // ELEMENTAL CRIT
  // ---------------------------------------------------------------------------
  'ElementForCritChance.Arcane': {
    id: 'ElementForCritChance.Arcane',
    name: 'Arcane Crit',
    category: 'elemental',
    description: 'Crit chance from arcane damage',
  },
  'ElementForCritChance.Fire': {
    id: 'ElementForCritChance.Fire',
    name: 'Fire Crit',
    category: 'elemental',
    description: 'Crit chance from fire damage',
  },
  'ElementForCritChance.Lightning': {
    id: 'ElementForCritChance.Lightning',
    name: 'Lightning Crit',
    category: 'elemental',
    description: 'Crit chance from lightning damage',
  },
  'ElementForCritChance.MaxHealth': {
    id: 'ElementForCritChance.MaxHealth',
    name: 'Health Crit',
    category: 'elemental',
    description: 'Crit chance from max health',
  },
  'ElementalToHp%.Fire': {
    id: 'ElementalToHp%.Fire',
    name: 'Fire to HP',
    category: 'elemental',
    description: 'Convert fire damage to HP bonus',
  },

  // ---------------------------------------------------------------------------
  // PULSE EXPLOSIONS
  // ---------------------------------------------------------------------------
  'PulseExplosion_Arcane': {
    id: 'PulseExplosion_Arcane',
    name: 'Arcane Pulse',
    category: 'pulse',
    description: 'Periodic arcane explosion',
  },
  'PulseExplosion_Fire': {
    id: 'PulseExplosion_Fire',
    name: 'Fire Pulse',
    category: 'pulse',
    description: 'Periodic fire explosion',
  },
  'PulseExplosion_Lightning': {
    id: 'PulseExplosion_Lightning',
    name: 'Lightning Pulse',
    category: 'pulse',
    description: 'Periodic lightning explosion',
  },

  // ---------------------------------------------------------------------------
  // EXPLODING MINES
  // ---------------------------------------------------------------------------
  'ExplodingArcaneMineNode': {
    id: 'ExplodingArcaneMineNode',
    name: 'Arcane Mine',
    category: 'mines',
    description: 'Drop arcane mines',
  },
  'ExplodingFireMineNode': {
    id: 'ExplodingFireMineNode',
    name: 'Fire Mine',
    category: 'mines',
    description: 'Drop fire mines',
  },
  'ExplodingLightningMineNode': {
    id: 'ExplodingLightningMineNode',
    name: 'Lightning Mine',
    category: 'mines',
    description: 'Drop lightning mines',
  },

  // ---------------------------------------------------------------------------
  // SPAWN EFFECTS
  // ---------------------------------------------------------------------------
  'ChanceToSpawnAnotherElite': {
    id: 'ChanceToSpawnAnotherElite',
    name: 'Elite Spawn',
    category: 'spawn',
    description: 'Chance to spawn additional elite',
  },
  'ChanceToSpawnContainer': {
    id: 'ChanceToSpawnContainer',
    name: 'Container Spawn',
    category: 'spawn',
    description: 'Chance to spawn loot container',
  },
  'ChanceToSpawnArcaneEagle': {
    id: 'ChanceToSpawnArcaneEagle',
    name: 'Arcane Eagle',
    category: 'spawn',
    description: 'Chance to spawn arcane eagle companion',
  },
  'ChanceToSpawnElectricHound': {
    id: 'ChanceToSpawnElectricHound',
    name: 'Electric Hound',
    category: 'spawn',
    description: 'Chance to spawn electric hound companion',
  },
  'ChanceToSpawnFireGolem': {
    id: 'ChanceToSpawnFireGolem',
    name: 'Fire Golem',
    category: 'spawn',
    description: 'Chance to spawn fire golem companion',
  },

  // ---------------------------------------------------------------------------
  // POTION BONUSES
  // ---------------------------------------------------------------------------
  'PotionBonus.Armor%': {
    id: 'PotionBonus.Armor%',
    name: 'Potion Armor',
    category: 'potion',
    description: 'Armor bonus from potions',
  },
  'PotionBonus.AttackSpeed%': {
    id: 'PotionBonus.AttackSpeed%',
    name: 'Potion Attack Speed',
    category: 'potion',
    description: 'Attack speed bonus from potions',
  },
  'PotionBonus.MaxEnergy': {
    id: 'PotionBonus.MaxEnergy',
    name: 'Potion Energy',
    category: 'potion',
    description: 'Max energy bonus from potions',
  },
  'PotionBonus.MaxHp%': {
    id: 'PotionBonus.MaxHp%',
    name: 'Potion HP',
    category: 'potion',
    description: 'Max HP bonus from potions',
  },
  'PotionBonus.MovementSpeed%': {
    id: 'PotionBonus.MovementSpeed%',
    name: 'Potion Speed',
    category: 'potion',
    description: 'Movement speed bonus from potions',
  },
  'PotionSlotForStat.Highest': {
    id: 'PotionSlotForStat.Highest',
    name: 'Potion Stat Slot',
    category: 'potion',
    description: 'Extra potion slot based on highest stat',
  },
  'Damage%ForPotions': {
    id: 'Damage%ForPotions',
    name: 'Damage per Potion',
    category: 'potion',
    description: 'Damage bonus per available potion',
  },
  'ArmorForPotions': {
    id: 'ArmorForPotions',
    name: 'Armor per Potion',
    category: 'potion',
    description: 'Armor bonus per available potion',
  },
  'AttackSpeedForPotions': {
    id: 'AttackSpeedForPotions',
    name: 'AS per Potion',
    category: 'potion',
    description: 'Attack speed per available potion',
  },
  'MaxHpForAvailablePotion': {
    id: 'MaxHpForAvailablePotion',
    name: 'HP per Potion',
    category: 'potion',
    description: 'Max HP per available potion',
  },
  'Damage%NoPotion': {
    id: 'Damage%NoPotion',
    name: 'No Potion Damage',
    category: 'potion',
    description: 'Damage bonus when no potions available',
  },
  'ProcOffhandsOnPotion': {
    id: 'ProcOffhandsOnPotion',
    name: 'Offhand on Potion',
    category: 'potion',
    description: 'Trigger offhand effects when using potion',
  },

  // ---------------------------------------------------------------------------
  // ELITE BUFFS
  // ---------------------------------------------------------------------------
  'EliteBuffs.AttackSpeed%': {
    id: 'EliteBuffs.AttackSpeed%',
    name: 'Elite AS Buff',
    category: 'elite',
    description: 'Attack speed from elite kills',
  },
  'EliteBuffs.Energy': {
    id: 'EliteBuffs.Energy',
    name: 'Elite Energy Buff',
    category: 'elite',
    description: 'Energy from elite kills',
  },
  'EliteBuffs.MaxHp%': {
    id: 'EliteBuffs.MaxHp%',
    name: 'Elite HP Buff',
    category: 'elite',
    description: 'Max HP from elite kills',
  },

  // ---------------------------------------------------------------------------
  // DAMAGE BONUSES
  // ---------------------------------------------------------------------------
  'DamageForStat.Highest': {
    id: 'DamageForStat.Highest',
    name: 'Stat Damage',
    category: 'damage',
    description: 'Damage based on highest stat',
  },
  'DamageForStat2.Highest': {
    id: 'DamageForStat2.Highest',
    name: 'Stat Damage II',
    category: 'damage',
    description: 'Additional damage based on highest stat',
  },
  'Damage%ForStat2.Highest': {
    id: 'Damage%ForStat2.Highest',
    name: 'Stat Damage %',
    category: 'damage',
    description: 'Percent damage based on highest stat',
  },
  'HighestStatForDamage': {
    id: 'HighestStatForDamage',
    name: 'Highest Stat Damage',
    category: 'damage',
    description: 'Use highest stat for damage calculation',
  },
  'DamageBonusAnd51Damage': {
    id: 'DamageBonusAnd51Damage',
    name: 'Flat Damage Bonus',
    category: 'damage',
    description: 'Damage bonus plus flat 51 damage',
  },
  'DamageGainNoEnergy': {
    id: 'DamageGainNoEnergy',
    name: 'No Energy Damage',
    category: 'damage',
    description: 'Damage bonus when at zero energy',
  },
  'GainDamageForHPLoseArmor': {
    id: 'GainDamageForHPLoseArmor',
    name: 'Glass Cannon',
    category: 'damage',
    description: 'Trade armor for damage and HP',
  },
  'DistanceProcsDamage': {
    id: 'DistanceProcsDamage',
    name: 'Distance Damage',
    category: 'damage',
    description: 'Damage procs based on distance traveled',
  },
  'DistanceProcsDamage_Near': {
    id: 'DistanceProcsDamage_Near',
    name: 'Close Range Damage',
    category: 'damage',
    description: 'Damage procs for nearby enemies',
  },
  'ProcsTake100EnergyHighDamage': {
    id: 'ProcsTake100EnergyHighDamage',
    name: 'Energy Burst',
    category: 'damage',
    description: 'High damage proc that costs 100 energy',
  },
  'BonusDamage%ForEssence': {
    id: 'BonusDamage%ForEssence',
    name: 'Essence Damage',
    category: 'damage',
    description: 'Damage bonus based on essence',
  },

  // ---------------------------------------------------------------------------
  // CRIT BONUSES
  // ---------------------------------------------------------------------------
  'CritDamageForArmor': {
    id: 'CritDamageForArmor',
    name: 'Armor to Crit Damage',
    category: 'crit',
    description: 'Convert armor to crit damage',
  },
  'CritChanceForEnergyRegen': {
    id: 'CritChanceForEnergyRegen',
    name: 'Energy Regen Crit',
    category: 'crit',
    description: 'Crit chance based on energy regen',
  },
  'GainCritChanceForHighest': {
    id: 'GainCritChanceForHighest',
    name: 'Stat Crit Chance',
    category: 'crit',
    description: 'Crit chance based on highest stat',
  },
  'BonusCritDamage%ForEssence': {
    id: 'BonusCritDamage%ForEssence',
    name: 'Essence Crit Damage',
    category: 'crit',
    description: 'Crit damage based on essence',
  },

  // ---------------------------------------------------------------------------
  // DEFENSE / SURVIVABILITY
  // ---------------------------------------------------------------------------
  'DamageReduction': {
    id: 'DamageReduction',
    name: 'Damage Reduction',
    category: 'defense',
    description: 'Flat damage reduction',
  },
  'DamageReduction%ForStat.Highest': {
    id: 'DamageReduction%ForStat.Highest',
    name: 'Stat DR',
    category: 'defense',
    description: 'Damage reduction based on highest stat',
  },
  'Health%ForHighest': {
    id: 'Health%ForHighest',
    name: 'Stat HP Bonus',
    category: 'defense',
    description: 'HP bonus based on highest stat',
  },
  'MaxHp%ForStat.Highest': {
    id: 'MaxHp%ForStat.Highest',
    name: 'Max HP Scaling',
    category: 'defense',
    description: 'Max HP scales with highest stat',
  },
  'ExtraHp%': {
    id: 'ExtraHp%',
    name: 'Bonus HP %',
    category: 'defense',
    description: 'Flat percent HP bonus',
  },
  'Juggernaut': {
    id: 'Juggernaut',
    name: 'Juggernaut',
    category: 'defense',
    description: 'Juggernaut defensive effect',
  },
  'ExtraArmor': {
    id: 'ExtraArmor',
    name: 'Bonus Armor',
    category: 'defense',
    description: 'Flat armor bonus',
  },

  // ---------------------------------------------------------------------------
  // LIFESTEAL / SUSTAIN
  // ---------------------------------------------------------------------------
  'ExtraLifeSteal': {
    id: 'ExtraLifeSteal',
    name: 'Bonus Lifesteal',
    category: 'sustain',
    description: 'Additional lifesteal',
  },
  'LifeStealToEnergySteal': {
    id: 'LifeStealToEnergySteal',
    name: 'Energy Steal',
    category: 'sustain',
    description: 'Convert lifesteal to energy steal',
  },

  // ---------------------------------------------------------------------------
  // STAT BONUSES
  // ---------------------------------------------------------------------------
  'ExtraStrength': {
    id: 'ExtraStrength',
    name: 'Bonus Strength',
    category: 'stats',
    description: 'Flat strength bonus',
  },
  'ExtraWisdom': {
    id: 'ExtraWisdom',
    name: 'Bonus Wisdom',
    category: 'stats',
    description: 'Flat wisdom bonus',
  },
  'ExtraEndurance': {
    id: 'ExtraEndurance',
    name: 'Bonus Endurance',
    category: 'stats',
    description: 'Flat endurance bonus',
  },
  'ExtraStamina': {
    id: 'ExtraStamina',
    name: 'Bonus Stamina',
    category: 'stats',
    description: 'Flat stamina bonus',
  },
  'GainStatIfNoOffHand.Luck': {
    id: 'GainStatIfNoOffHand.Luck',
    name: 'No Offhand Luck',
    category: 'stats',
    description: 'Luck bonus when not using offhand',
  },

  // ---------------------------------------------------------------------------
  // INVENTORY / SLOTS
  // ---------------------------------------------------------------------------
  'ExtraInventorySlotForAttackSpeed': {
    id: 'ExtraInventorySlotForAttackSpeed',
    name: 'AS Inventory Slot',
    category: 'inventory',
    description: 'Extra inventory slot that gives attack speed',
  },
  'ExtraInventorySlotForCritDamage': {
    id: 'ExtraInventorySlotForCritDamage',
    name: 'Crit Inventory Slot',
    category: 'inventory',
    description: 'Extra inventory slot that gives crit damage',
  },

  // ---------------------------------------------------------------------------
  // BOOTS SPECIFIC
  // ---------------------------------------------------------------------------
  'BootsMoveSpeed4': {
    id: 'BootsMoveSpeed4',
    name: 'Swift Boots',
    category: 'boots',
    description: '+4 movement speed',
  },
  'BootsExtraEnergy3': {
    id: 'BootsExtraEnergy3',
    name: 'Energy Boots',
    category: 'boots',
    description: '+3 max energy',
  },
  'BootsExtraEnergyRegen4': {
    id: 'BootsExtraEnergyRegen4',
    name: 'Regen Boots',
    category: 'boots',
    description: '+4 energy regen',
  },

  // ---------------------------------------------------------------------------
  // ENERGY
  // ---------------------------------------------------------------------------
  'DoubleEnergy': {
    id: 'DoubleEnergy',
    name: 'Double Energy',
    category: 'energy',
    description: 'Double max energy',
  },
  'ExtraEnergyAddDamage': {
    id: 'ExtraEnergyAddDamage',
    name: 'Energy to Damage',
    category: 'energy',
    description: 'Convert extra energy to damage',
  },
  'EnergyConsumptionReduceHalf': {
    id: 'EnergyConsumptionReduceHalf',
    name: 'Energy Efficiency',
    category: 'energy',
    description: 'Reduce energy consumption by 50%',
  },

  // ---------------------------------------------------------------------------
  // SECONDARY BUILD
  // ---------------------------------------------------------------------------
  'SecondaryBuild.ChargedSecondaryDamageForStat.Highest': {
    id: 'SecondaryBuild.ChargedSecondaryDamageForStat.Highest',
    name: 'Charged Secondary',
    category: 'secondary',
    description: 'Charged secondary damage scales with highest stat',
  },
  'SecondaryBuild.DoubleChargedDamage': {
    id: 'SecondaryBuild.DoubleChargedDamage',
    name: 'Double Charged',
    category: 'secondary',
    description: 'Double damage for charged attacks',
  },
  'SecondaryBuild.DoubleEnergyMoreDamage': {
    id: 'SecondaryBuild.DoubleEnergyMoreDamage',
    name: 'Energy Overcharge',
    category: 'secondary',
    description: 'Spend double energy for more damage',
  },

  // ---------------------------------------------------------------------------
  // FELLOWSHIP / MULTIPLAYER
  // ---------------------------------------------------------------------------
  'FellowshipBubbleShare': {
    id: 'FellowshipBubbleShare',
    name: 'Share Bubble',
    category: 'fellowship',
    description: 'Share protective bubble with allies',
  },
  'FellowshipChargeAllGlyphs': {
    id: 'FellowshipChargeAllGlyphs',
    name: 'Charge All Glyphs',
    category: 'fellowship',
    description: 'Charge all glyphs in fellowship',
  },
  'FellowshipRuptureBossBuff': {
    id: 'FellowshipRuptureBossBuff',
    name: 'Rupture Boss Buff',
    category: 'fellowship',
    description: 'Buff fellowship on rupture boss kill',
  },
  'CompleteRuptureFellowsGetXP': {
    id: 'CompleteRuptureFellowsGetXP',
    name: 'Rupture XP Share',
    category: 'fellowship',
    description: 'Fellowship gets XP on rupture complete',
  },
  'DoubleFellowshipXp': {
    id: 'DoubleFellowshipXp',
    name: 'Double Fellowship XP',
    category: 'fellowship',
    description: 'Double XP for fellowship',
  },

  // ---------------------------------------------------------------------------
  // GLYPHS / RUNES
  // ---------------------------------------------------------------------------
  'Gain2ChargedGlyphRunes': {
    id: 'Gain2ChargedGlyphRunes',
    name: 'Charged Glyphs',
    category: 'glyphs',
    description: 'Start with 2 charged glyph runes',
  },

  // ---------------------------------------------------------------------------
  // MISC UTILITY
  // ---------------------------------------------------------------------------
  'DarkEssence': {
    id: 'DarkEssence',
    name: 'Dark Essence',
    category: 'utility',
    description: 'Dark essence effect',
  },
  'PainAmplifier': {
    id: 'PainAmplifier',
    name: 'Pain Amplifier',
    category: 'utility',
    description: 'Amplify damage taken and dealt',
  },
  'DoubleBuffLength': {
    id: 'DoubleBuffLength',
    name: 'Extended Buffs',
    category: 'utility',
    description: 'Double buff duration',
  },
  'ChanceForSnails': {
    id: 'ChanceForSnails',
    name: 'Snail Chance',
    category: 'utility',
    description: 'Chance to spawn snails',
  },
  'LongerSnailBuff': {
    id: 'LongerSnailBuff',
    name: 'Extended Snail Buff',
    category: 'utility',
    description: 'Longer duration snail buffs',
  },
  'LargeStonesInContainers': {
    id: 'LargeStonesInContainers',
    name: 'Large Stones',
    category: 'utility',
    description: 'Find large stones in containers',
  },
  'ChanceForGoldOnKill': {
    id: 'ChanceForGoldOnKill',
    name: 'Gold on Kill',
    category: 'utility',
    description: 'Chance to drop gold on kill',
  },
  'GoldOnDailyComplete': {
    id: 'GoldOnDailyComplete',
    name: 'Daily Gold',
    category: 'utility',
    description: 'Bonus gold on daily completion',
  },
  'SharedImbunedBeetles': {
    id: 'SharedImbunedBeetles',
    name: 'Shared Imbued Beetles',
    category: 'utility',
    description: 'Share imbued beetle effects',
  },
  'SharedInfusedBeetles': {
    id: 'SharedInfusedBeetles',
    name: 'Shared Infused Beetles',
    category: 'utility',
    description: 'Share infused beetle effects',
  },
};

// ============================================================================
// SLOT TO MONOGRAM MAPPINGS
// ============================================================================

/**
 * Monograms available for each equipment slot
 * Derived from "Learned X Modifiers Codex Recipes" in save data
 */
export const SLOT_MONOGRAMS = {
  head: [
    'AllowPhasing', 'ChanceToSpawnContainer', 'RangedParagon.Armor',
    'ExtraInventorySlotForAttackSpeed', 'ElementForCritChance.Arcane',
    'DamageCircle.Base', 'RangedParagon.MaxHp', 'ChanceToSpawnAnotherElite',
    'Colossus.Base', 'Bloodlust.Base', 'LifeStealToEnergySteal',
    'ElementForCritChance.Lightning', 'ElementForCritChance.MaxHealth',
    'ChanceForSnails', 'MeleeParagon.Armor', 'MeleeParagon.MaxHp',
    'ExtraEnergyAddDamage', 'CritDamageForArmor', 'MeleeParagon.BaseDamage',
    'Juggernaut', 'ElementForCritChance.Fire', 'RangedParagon.BaseDamage',
    'ExtraInventorySlotForCritDamage', 'Gain2ChargedGlyphRunes', 'Shroud',
  ],
  amulet: [
    'DamageCircle.Hp%.Highest', 'DistanceProcsDamage', 'ChanceToSpawnAnotherElite',
    'DistanceProcsDamage_Near', 'DarkEssence', 'EliteBuffs.AttackSpeed%',
    'EliteBuffs.Energy', 'HighestStatForDamage', 'DamageGainNoEnergy',
    'Bloodlust.DrawLife', 'SecondaryBuild.DoubleEnergyMoreDamage',
    'Bloodlust.Damage%PerStack', 'Damage%ForPotions', 'PotionSlotForStat.Highest',
    'ExtraLifeSteal', 'Colossus.CooldownReduceOnEliteKill', 'DamageBonusAnd51Damage',
    'Health%ForHighest', 'ChanceToSpawnContainer', 'Shroud.ExtraHp',
  ],
  bracer: [
    'Colossus.DoubleAttackSpeed', 'CritChanceForEnergyRegen',
    'ExplodingLightningMineNode', 'ExplodingFireMineNode',
    'Damage%ForStat2.Highest', 'SecondaryBuild.ChargedSecondaryDamageForStat.Highest',
    'GoldOnDailyComplete', 'Damage%NoPotion', 'Bloodlust.DrawBlood',
    'ChanceToSpawnContainer', 'LongerSnailBuff', 'PulseExplosion_Lightning',
    'LargeStonesInContainers', 'CritDamageForArmor', 'ProcOffhandsOnPotion',
    'Phasing.TranceEffectsPotency.Highest', 'PulseExplosion_Fire',
    'ExplodingArcaneMineNode', 'DoubleBuffLength', 'ChanceToSpawnAnotherElite',
    'PulseExplosion_Arcane', 'GainDamageForHPLoseArmor', 'Shroud.MaxStacksBonus',
  ],
  boots: [
    'Phasing.MovementSpeedBonus', 'PotionBonus.MaxHp%', 'ChanceToSpawnAnotherElite',
    'GainCritChanceForHighest', 'Veil.OnLose', 'BonusCritDamage%ForEssence',
    'BootsMoveSpeed4', 'BootsExtraEnergy3', 'PotionBonus.Armor%',
    'Colossus.FreeDash', 'DamageCircle.BiggerFaster', 'PotionBonus.MovementSpeed%',
    'PotionBonus.AttackSpeed%', 'Shroud.OnLose', 'ChanceToSpawnContainer',
    'FasterMount', 'DamageForStat2.Highest', 'PotionBonus.MaxEnergy',
    'BootsExtraEnergyRegen4',
  ],
  pants: [
    'ChanceToSpawnAnotherElite', 'Gain2ChargedGlyphRunes', 'EliteBuffs.MaxHp%',
    'Shroud.ElementalAug.Arcane', 'ExtraHp%',
  ],
  relic: [
    'Veil', 'EnergyConsumptionReduceHalf', 'FellowshipChargeAllGlyphs',
    'Bloodlust.Armor%', 'FellowshipRuptureBossBuff', 'PainAmplifier',
    'ChanceToSpawnElectricHound', 'Colossus.DamageReduction',
  ],
};

// ============================================================================
// LOOKUP HELPERS
// ============================================================================

/**
 * Get monogram definition by ID
 * @param {string} id - Monogram ID (with or without prefix)
 * @returns {MonogramDef|null}
 */
export function getMonogramById(id) {
  if (!id) return null;

  // Strip common prefixes
  let cleanId = id;
  if (id.startsWith('EasyRPG.Items.Modifiers.')) {
    cleanId = id.replace('EasyRPG.Items.Modifiers.', '');
  }

  return MONOGRAM_REGISTRY[cleanId] || null;
}

/**
 * Get display name for a monogram
 * @param {string} id - Monogram ID
 * @returns {string} Display name or cleaned ID
 */
export function getMonogramName(id) {
  const def = getMonogramById(id);
  if (def) return def.name;

  // Fallback: clean up the ID for display
  let cleanId = id;
  if (id.startsWith('EasyRPG.Items.Modifiers.')) {
    cleanId = id.replace('EasyRPG.Items.Modifiers.', '');
  }

  // Convert camelCase/dots to spaces
  return cleanId
    .replace(/\./g, ' ')
    .replace(/([A-Z])/g, ' $1')
    .replace(/([%])/g, '%')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Get monograms available for a slot
 * @param {string} slot - Equipment slot
 * @returns {MonogramDef[]}
 */
export function getMonogramsForSlot(slot) {
  const ids = SLOT_MONOGRAMS[slot.toLowerCase()] || [];
  return ids
    .map(id => MONOGRAM_REGISTRY[id])
    .filter(Boolean);
}

/**
 * Get all unique monogram categories
 * @returns {string[]}
 */
export function getMonogramCategories() {
  const categories = new Set();
  for (const def of Object.values(MONOGRAM_REGISTRY)) {
    if (def.category) {
      categories.add(def.category);
    }
  }
  return Array.from(categories).sort();
}

/**
 * Get monograms by category
 * @param {string} category - Category name
 * @returns {MonogramDef[]}
 */
export function getMonogramsByCategory(category) {
  return Object.values(MONOGRAM_REGISTRY)
    .filter(def => def.category === category);
}

/**
 * Check if a monogram ID is known
 * @param {string} id - Monogram ID
 * @returns {boolean}
 */
export function isKnownMonogram(id) {
  return getMonogramById(id) !== null;
}

/**
 * Parse monogram tag from full gameplay tag path
 * @param {string} fullTag - Full tag like "EasyRPG.Items.Modifiers.Bloodlust.Base"
 * @returns {{id: string, def: MonogramDef|null}}
 */
export function parseMonogramTag(fullTag) {
  if (!fullTag) return { id: '', def: null };

  const prefix = 'EasyRPG.Items.Modifiers.';
  const id = fullTag.startsWith(prefix)
    ? fullTag.slice(prefix.length)
    : fullTag;

  return {
    id,
    def: MONOGRAM_REGISTRY[id] || null,
  };
}

/**
 * Get all monogram IDs
 * @returns {string[]}
 */
export function getAllMonogramIds() {
  return Object.keys(MONOGRAM_REGISTRY);
}
