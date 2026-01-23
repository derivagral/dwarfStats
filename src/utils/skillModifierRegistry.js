/**
 * Skill Modifier Registry
 *
 * Single source of truth for weapon skill modifier definitions.
 * Maps save-file tag names to user-friendly display names.
 *
 * Skill modifiers are special affixes that can be applied to weapons.
 * They modify specific skill abilities. Each skill has its own pool of modifiers.
 *
 * Save data format: "EasyRPG.Attributes.Abilities.<SkillName>.Modifier.<ModifierName>"
 * This registry stores the SkillName and ModifierName portions.
 */

// ============================================================================
// SKILL DEFINITIONS
// ============================================================================

/**
 * @typedef {Object} SkillDef
 * @property {string} id - Internal identifier (matches save data skill name)
 * @property {string} name - User-friendly display name
 * @property {string} [category] - Element/type category (fire, lightning, arcane)
 */

export const SKILLS = {
  ArcaneApocalypse: { id: 'ArcaneApocalypse', name: 'Arcane Apocalypse', category: 'arcane' },
  ArcaneCrackedSeed: { id: 'ArcaneCrackedSeed', name: 'Cracked Seed', category: 'arcane' },
  ArcaneOrb: { id: 'ArcaneOrb', name: 'Arcane Orb', category: 'arcane' },
  ArcaneTotem: { id: 'ArcaneTotem', name: 'Arcane Totem', category: 'arcane' },
  BloodDragons: { id: 'BloodDragons', name: 'Blood Dragons', category: 'arcane' },
  BurningShield: { id: 'BurningShield', name: 'Burning Shield', category: 'fire' },
  CarnageOfFire: { id: 'CarnageOfFire', name: 'Carnage of Fire', category: 'fire' },
  ChainLightning: { id: 'ChainLightning', name: 'Chain Lightning', category: 'lightning' },
  DelusionOfZelkors: { id: 'DelusionOfZelkors', name: 'Delusion of Zelkors', category: 'arcane' },
  DragonFlame: { id: 'DragonFlame', name: 'Dragon Flame', category: 'fire' },
  ElectricDragons: { id: 'ElectricDragons', name: 'Electric Dragons', category: 'lightning' },
  EnemyDeath: { id: 'EnemyDeath', name: 'Enemy Death', category: 'arcane' },
  EyeOfTheStorm: { id: 'EyeOfTheStorm', name: 'Eye of the Storm', category: 'lightning' },
  FerocityOfWolves: { id: 'FerocityOfWolves', name: 'Ferocity of Wolves', category: 'arcane' },
  FieryTotem: { id: 'FieryTotem', name: 'Fiery Totem', category: 'fire' },
  FireAtom: { id: 'FireAtom', name: 'Fire Atom', category: 'fire' },
  FireBeam: { id: 'FireBeam', name: 'Fire Beam', category: 'fire' },
  FlameShowerMeteor: { id: 'FlameShowerMeteor', name: 'Flame Shower Meteor', category: 'fire' },
  LightningPlasma: { id: 'LightningPlasma', name: 'Lightning Plasma', category: 'lightning' },
  LightningTotem: { id: 'LightningTotem', name: 'Lightning Totem', category: 'lightning' },
  PoisonCloud: { id: 'PoisonCloud', name: 'Poison Cloud', category: 'arcane' },
  Spark: { id: 'Spark', name: 'Spark', category: 'lightning' },
  SpinningBlade: { id: 'SpinningBlade', name: 'Spinning Blade', category: 'arcane' },
  StarBlades: { id: 'StarBlades', name: 'Star Blades', category: 'arcane' },
  StaticCharge: { id: 'StaticCharge', name: 'Static Charge', category: 'lightning' },
  Vortex: { id: 'Vortex', name: 'Vortex', category: 'arcane' },
};

// ============================================================================
// SKILL MODIFIER REGISTRY
// ============================================================================

/**
 * @typedef {Object} SkillModifierDef
 * @property {string} id - Full modifier ID (SkillName.Modifier.ModifierName)
 * @property {string} skillId - Parent skill ID
 * @property {string} modifierId - Just the modifier part
 * @property {string} name - User-friendly display name
 * @property {string} [description] - Detailed description
 */

export const SKILL_MODIFIER_REGISTRY = {
  // ---------------------------------------------------------------------------
  // ARCANE APOCALYPSE
  // ---------------------------------------------------------------------------
  'ArcaneApocalypse.Modifier.AftermathExplosion': {
    id: 'ArcaneApocalypse.Modifier.AftermathExplosion',
    skillId: 'ArcaneApocalypse',
    modifierId: 'AftermathExplosion',
    name: 'Aftermath Explosion',
    description: 'Causes aftermath explosions',
  },
  'ArcaneApocalypse.Modifier.BuffStack': {
    id: 'ArcaneApocalypse.Modifier.BuffStack',
    skillId: 'ArcaneApocalypse',
    modifierId: 'BuffStack',
    name: 'Buff Stack',
    description: 'Increases buff stacks',
  },

  // ---------------------------------------------------------------------------
  // ARCANE CRACKED SEED
  // ---------------------------------------------------------------------------
  'ArcaneCrackedSeed.Modifier.Darts': {
    id: 'ArcaneCrackedSeed.Modifier.Darts',
    skillId: 'ArcaneCrackedSeed',
    modifierId: 'Darts',
    name: 'Darts',
    description: 'Fires additional darts',
  },
  'ArcaneCrackedSeed.Modifier.Flowers': {
    id: 'ArcaneCrackedSeed.Modifier.Flowers',
    skillId: 'ArcaneCrackedSeed',
    modifierId: 'Flowers',
    name: 'Flowers',
    description: 'Spawns flowers',
  },
  'ArcaneCrackedSeed.Modifier.TentacleExplosion': {
    id: 'ArcaneCrackedSeed.Modifier.TentacleExplosion',
    skillId: 'ArcaneCrackedSeed',
    modifierId: 'TentacleExplosion',
    name: 'Tentacle Explosion',
    description: 'Tentacles explode on death',
  },

  // ---------------------------------------------------------------------------
  // ARCANE ORB
  // ---------------------------------------------------------------------------
  'ArcaneOrb.Modifier.ChaosOrb': {
    id: 'ArcaneOrb.Modifier.ChaosOrb',
    skillId: 'ArcaneOrb',
    modifierId: 'ChaosOrb',
    name: 'Chaos Orb',
    description: 'Transforms into chaos orb',
  },

  // ---------------------------------------------------------------------------
  // ARCANE TOTEM
  // ---------------------------------------------------------------------------
  'ArcaneTotem.Modifier.AdditionalFlames': {
    id: 'ArcaneTotem.Modifier.AdditionalFlames',
    skillId: 'ArcaneTotem',
    modifierId: 'AdditionalFlames',
    name: 'Additional Flames',
    description: 'Totem shoots additional flames',
  },
  'ArcaneTotem.Modifier.ArcaneExplosion': {
    id: 'ArcaneTotem.Modifier.ArcaneExplosion',
    skillId: 'ArcaneTotem',
    modifierId: 'ArcaneExplosion',
    name: 'Arcane Explosion',
    description: 'Totem explodes on expiration',
  },
  'ArcaneTotem.Modifier.ExtraTotem': {
    id: 'ArcaneTotem.Modifier.ExtraTotem',
    skillId: 'ArcaneTotem',
    modifierId: 'ExtraTotem',
    name: 'Extra Totem',
    description: 'Summons additional totem',
  },

  // ---------------------------------------------------------------------------
  // BLOOD DRAGONS
  // ---------------------------------------------------------------------------
  'BloodDragons.Modifier.BonusSizeDamage': {
    id: 'BloodDragons.Modifier.BonusSizeDamage',
    skillId: 'BloodDragons',
    modifierId: 'BonusSizeDamage',
    name: 'Size Damage',
    description: 'Bonus damage based on dragon size',
  },
  'BloodDragons.Modifier.ExplosionChance': {
    id: 'BloodDragons.Modifier.ExplosionChance',
    skillId: 'BloodDragons',
    modifierId: 'ExplosionChance',
    name: 'Explosion Chance',
    description: 'Chance for dragons to explode',
  },
  'BloodDragons.Modifier.SpawnOnHit': {
    id: 'BloodDragons.Modifier.SpawnOnHit',
    skillId: 'BloodDragons',
    modifierId: 'SpawnOnHit',
    name: 'Spawn on Hit',
    description: 'Spawn dragons when hitting enemies',
  },

  // ---------------------------------------------------------------------------
  // BURNING SHIELD
  // ---------------------------------------------------------------------------
  'BurningShield.Modifier.BruningDragonsRadius': {
    id: 'BurningShield.Modifier.BruningDragonsRadius',
    skillId: 'BurningShield',
    modifierId: 'BruningDragonsRadius',
    name: 'Dragons Radius',
    description: 'Increased burning dragons radius',
  },
  'BurningShield.Modifier.StackBuff': {
    id: 'BurningShield.Modifier.StackBuff',
    skillId: 'BurningShield',
    modifierId: 'StackBuff',
    name: 'Stack Buff',
    description: 'Buff from shield stacks',
  },

  // ---------------------------------------------------------------------------
  // CARNAGE OF FIRE
  // ---------------------------------------------------------------------------
  'CarnageOfFire.Modifier.LavaSpike': {
    id: 'CarnageOfFire.Modifier.LavaSpike',
    skillId: 'CarnageOfFire',
    modifierId: 'LavaSpike',
    name: 'Lava Spike',
    description: 'Creates lava spikes',
  },
  'CarnageOfFire.Modifier.Radius': {
    id: 'CarnageOfFire.Modifier.Radius',
    skillId: 'CarnageOfFire',
    modifierId: 'Radius',
    name: 'Radius',
    description: 'Increased effect radius',
  },
  'CarnageOfFire.Modifier.Scortch': {
    id: 'CarnageOfFire.Modifier.Scortch',
    skillId: 'CarnageOfFire',
    modifierId: 'Scortch',
    name: 'Scorch',
    description: 'Scorches the ground',
  },

  // ---------------------------------------------------------------------------
  // CHAIN LIGHTNING
  // ---------------------------------------------------------------------------
  'ChainLightning.Modifier.AdditionalJumps': {
    id: 'ChainLightning.Modifier.AdditionalJumps',
    skillId: 'ChainLightning',
    modifierId: 'AdditionalJumps',
    name: 'Additional Jumps',
    description: 'Lightning chains to more targets',
  },
  'ChainLightning.Modifier.BonusDamage': {
    id: 'ChainLightning.Modifier.BonusDamage',
    skillId: 'ChainLightning',
    modifierId: 'BonusDamage',
    name: 'Bonus Damage',
    description: 'Increased chain lightning damage',
  },
  'ChainLightning.Modifier.Overload': {
    id: 'ChainLightning.Modifier.Overload',
    skillId: 'ChainLightning',
    modifierId: 'Overload',
    name: 'Overload',
    description: 'Overload effect on final target',
  },

  // ---------------------------------------------------------------------------
  // DELUSION OF ZELKORS
  // ---------------------------------------------------------------------------
  'DelusionOfZelkors.Modifier.AdditionalCasts': {
    id: 'DelusionOfZelkors.Modifier.AdditionalCasts',
    skillId: 'DelusionOfZelkors',
    modifierId: 'AdditionalCasts',
    name: 'Additional Casts',
    description: 'Mages cast additional spells',
  },
  'DelusionOfZelkors.Modifier.AdditionalMages': {
    id: 'DelusionOfZelkors.Modifier.AdditionalMages',
    skillId: 'DelusionOfZelkors',
    modifierId: 'AdditionalMages',
    name: 'Additional Mages',
    description: 'Summons more mages',
  },
  'DelusionOfZelkors.Modifier.FireSpikeTicks': {
    id: 'DelusionOfZelkors.Modifier.FireSpikeTicks',
    skillId: 'DelusionOfZelkors',
    modifierId: 'FireSpikeTicks',
    name: 'Fire Spike Ticks',
    description: 'Fire spikes tick more often',
  },

  // ---------------------------------------------------------------------------
  // DRAGON FLAME
  // ---------------------------------------------------------------------------
  'DragonFlame.Modifier.AdditionalFlame': {
    id: 'DragonFlame.Modifier.AdditionalFlame',
    skillId: 'DragonFlame',
    modifierId: 'AdditionalFlame',
    name: 'Additional Flame',
    description: 'Breathes additional flames',
  },
  'DragonFlame.Modifier.BonusRadius': {
    id: 'DragonFlame.Modifier.BonusRadius',
    skillId: 'DragonFlame',
    modifierId: 'BonusRadius',
    name: 'Bonus Radius',
    description: 'Increased flame radius',
  },
  'DragonFlame.Modifier.BonusTickTime': {
    id: 'DragonFlame.Modifier.BonusTickTime',
    skillId: 'DragonFlame',
    modifierId: 'BonusTickTime',
    name: 'Bonus Tick Time',
    description: 'Flames last longer',
  },

  // ---------------------------------------------------------------------------
  // ELECTRIC DRAGONS
  // ---------------------------------------------------------------------------
  'ElectricDragons.Modifier.AdditionalDragons': {
    id: 'ElectricDragons.Modifier.AdditionalDragons',
    skillId: 'ElectricDragons',
    modifierId: 'AdditionalDragons',
    name: 'Additional Dragons',
    description: 'Summons more dragons',
  },
  'ElectricDragons.Modifier.ElectricMeteors': {
    id: 'ElectricDragons.Modifier.ElectricMeteors',
    skillId: 'ElectricDragons',
    modifierId: 'ElectricMeteors',
    name: 'Electric Meteors',
    description: 'Dragons call down electric meteors',
  },

  // ---------------------------------------------------------------------------
  // ENEMY DEATH
  // ---------------------------------------------------------------------------
  'EnemyDeath.Modifier.ArcaneSpikeTicks': {
    id: 'EnemyDeath.Modifier.ArcaneSpikeTicks',
    skillId: 'EnemyDeath',
    modifierId: 'ArcaneSpikeTicks',
    name: 'Arcane Spike Ticks',
    description: 'Arcane spikes tick more often',
  },
  'EnemyDeath.Modifier.LifetimeBuff': {
    id: 'EnemyDeath.Modifier.LifetimeBuff',
    skillId: 'EnemyDeath',
    modifierId: 'LifetimeBuff',
    name: 'Lifetime Buff',
    description: 'Buffs last longer',
  },
  'EnemyDeath.Modifier.VesselBuff': {
    id: 'EnemyDeath.Modifier.VesselBuff',
    skillId: 'EnemyDeath',
    modifierId: 'VesselBuff',
    name: 'Vessel Buff',
    description: 'Buffs the death vessel',
  },

  // ---------------------------------------------------------------------------
  // EYE OF THE STORM
  // ---------------------------------------------------------------------------
  'EyeOfTheStorm.Modifier.Cloud': {
    id: 'EyeOfTheStorm.Modifier.Cloud',
    skillId: 'EyeOfTheStorm',
    modifierId: 'Cloud',
    name: 'Cloud',
    description: 'Creates storm cloud',
  },

  // ---------------------------------------------------------------------------
  // FEROCITY OF WOLVES
  // ---------------------------------------------------------------------------
  'FerocityOfWolves.Modifier.AdditionalWolves': {
    id: 'FerocityOfWolves.Modifier.AdditionalWolves',
    skillId: 'FerocityOfWolves',
    modifierId: 'AdditionalWolves',
    name: 'Additional Wolves',
    description: 'Summons more wolves',
  },
  'FerocityOfWolves.Modifier.Bats': {
    id: 'FerocityOfWolves.Modifier.Bats',
    skillId: 'FerocityOfWolves',
    modifierId: 'Bats',
    name: 'Bats',
    description: 'Wolves are accompanied by bats',
  },
  'FerocityOfWolves.Modifier.BearsDamageBonus': {
    id: 'FerocityOfWolves.Modifier.BearsDamageBonus',
    skillId: 'FerocityOfWolves',
    modifierId: 'BearsDamageBonus',
    name: 'Bears Damage Bonus',
    description: 'Summons bears with bonus damage',
  },

  // ---------------------------------------------------------------------------
  // FIERY TOTEM
  // ---------------------------------------------------------------------------
  'FieryTotem.Modifier.DamageBonus': {
    id: 'FieryTotem.Modifier.DamageBonus',
    skillId: 'FieryTotem',
    modifierId: 'DamageBonus',
    name: 'Damage Bonus',
    description: 'Totem deals more damage',
  },
  'FieryTotem.Modifier.ExplodeOnOverlap': {
    id: 'FieryTotem.Modifier.ExplodeOnOverlap',
    skillId: 'FieryTotem',
    modifierId: 'ExplodeOnOverlap',
    name: 'Explode on Overlap',
    description: 'Totem explodes when enemies overlap',
  },
  'FieryTotem.Modifier.FireVortex': {
    id: 'FieryTotem.Modifier.FireVortex',
    skillId: 'FieryTotem',
    modifierId: 'FireVortex',
    name: 'Fire Vortex',
    description: 'Creates fire vortex around totem',
  },
  'FieryTotem.Modifier.FireWall': {
    id: 'FieryTotem.Modifier.FireWall',
    skillId: 'FieryTotem',
    modifierId: 'FireWall',
    name: 'Fire Wall',
    description: 'Creates fire walls',
  },

  // ---------------------------------------------------------------------------
  // FIRE ATOM
  // ---------------------------------------------------------------------------
  'FireAtom.Modifier.ChargeLonger': {
    id: 'FireAtom.Modifier.ChargeLonger',
    skillId: 'FireAtom',
    modifierId: 'ChargeLonger',
    name: 'Charge Longer',
    description: 'Can charge for longer',
  },
  'FireAtom.Modifier.Explode': {
    id: 'FireAtom.Modifier.Explode',
    skillId: 'FireAtom',
    modifierId: 'Explode',
    name: 'Explode',
    description: 'Atom explodes on impact',
  },
  'FireAtom.Modifier.MiniOrbs': {
    id: 'FireAtom.Modifier.MiniOrbs',
    skillId: 'FireAtom',
    modifierId: 'MiniOrbs',
    name: 'Mini Orbs',
    description: 'Releases mini orbs',
  },

  // ---------------------------------------------------------------------------
  // FIRE BEAM
  // ---------------------------------------------------------------------------
  'FireBeam.Modifier.AdditionalBeam': {
    id: 'FireBeam.Modifier.AdditionalBeam',
    skillId: 'FireBeam',
    modifierId: 'AdditionalBeam',
    name: 'Additional Beam',
    description: 'Fires additional beam',
  },
  'FireBeam.Modifier.ExpandedBeam': {
    id: 'FireBeam.Modifier.ExpandedBeam',
    skillId: 'FireBeam',
    modifierId: 'ExpandedBeam',
    name: 'Expanded Beam',
    description: 'Beam is wider',
  },

  // ---------------------------------------------------------------------------
  // FLAME SHOWER METEOR
  // ---------------------------------------------------------------------------
  'FlameShowerMeteor.Modifier.Damage': {
    id: 'FlameShowerMeteor.Modifier.Damage',
    skillId: 'FlameShowerMeteor',
    modifierId: 'Damage',
    name: 'Damage',
    description: 'Increased meteor damage',
  },
  'FlameShowerMeteor.Modifier.LavaRainTicks': {
    id: 'FlameShowerMeteor.Modifier.LavaRainTicks',
    skillId: 'FlameShowerMeteor',
    modifierId: 'LavaRainTicks',
    name: 'Lava Rain Ticks',
    description: 'Lava rain ticks more often',
  },
  'FlameShowerMeteor.Modifier.Ticks': {
    id: 'FlameShowerMeteor.Modifier.Ticks',
    skillId: 'FlameShowerMeteor',
    modifierId: 'Ticks',
    name: 'Ticks',
    description: 'More damage ticks',
  },

  // ---------------------------------------------------------------------------
  // LIGHTNING PLASMA
  // ---------------------------------------------------------------------------
  'LightningPlasma.Modifier.AdditionalBeam': {
    id: 'LightningPlasma.Modifier.AdditionalBeam',
    skillId: 'LightningPlasma',
    modifierId: 'AdditionalBeam',
    name: 'Additional Beam',
    description: 'Fires additional beam',
  },
  'LightningPlasma.Modifier.GrowLarger': {
    id: 'LightningPlasma.Modifier.GrowLarger',
    skillId: 'LightningPlasma',
    modifierId: 'GrowLarger',
    name: 'Grow Larger',
    description: 'Plasma grows larger over time',
  },
  'LightningPlasma.Modifier.Ticks': {
    id: 'LightningPlasma.Modifier.Ticks',
    skillId: 'LightningPlasma',
    modifierId: 'Ticks',
    name: 'Ticks',
    description: 'More damage ticks',
  },

  // ---------------------------------------------------------------------------
  // LIGHTNING TOTEM
  // ---------------------------------------------------------------------------
  'LightningTotem.Modifier.AdditionalStrike': {
    id: 'LightningTotem.Modifier.AdditionalStrike',
    skillId: 'LightningTotem',
    modifierId: 'AdditionalStrike',
    name: 'Additional Strike',
    description: 'Totem strikes additional targets',
  },
  'LightningTotem.Modifier.LargerRadius': {
    id: 'LightningTotem.Modifier.LargerRadius',
    skillId: 'LightningTotem',
    modifierId: 'LargerRadius',
    name: 'Larger Radius',
    description: 'Increased strike radius',
  },
  'LightningTotem.Modifier.TimedExplosions': {
    id: 'LightningTotem.Modifier.TimedExplosions',
    skillId: 'LightningTotem',
    modifierId: 'TimedExplosions',
    name: 'Timed Explosions',
    description: 'Periodic explosions',
  },

  // ---------------------------------------------------------------------------
  // POISON CLOUD
  // ---------------------------------------------------------------------------
  'PoisonCloud.Modifier.ChemicalExplosion': {
    id: 'PoisonCloud.Modifier.ChemicalExplosion',
    skillId: 'PoisonCloud',
    modifierId: 'ChemicalExplosion',
    name: 'Chemical Explosion',
    description: 'Cloud explodes chemically',
  },
  'PoisonCloud.Modifier.Lifetime': {
    id: 'PoisonCloud.Modifier.Lifetime',
    skillId: 'PoisonCloud',
    modifierId: 'Lifetime',
    name: 'Lifetime',
    description: 'Cloud lasts longer',
  },
  'PoisonCloud.Modifier.Radius': {
    id: 'PoisonCloud.Modifier.Radius',
    skillId: 'PoisonCloud',
    modifierId: 'Radius',
    name: 'Radius',
    description: 'Increased cloud radius',
  },

  // ---------------------------------------------------------------------------
  // SPARK
  // ---------------------------------------------------------------------------
  'Spark.Modifier.PlasmaSphere': {
    id: 'Spark.Modifier.PlasmaSphere',
    skillId: 'Spark',
    modifierId: 'PlasmaSphere',
    name: 'Plasma Sphere',
    description: 'Creates plasma sphere',
  },
  'Spark.Modifier.Split': {
    id: 'Spark.Modifier.Split',
    skillId: 'Spark',
    modifierId: 'Split',
    name: 'Split',
    description: 'Spark splits into multiple',
  },

  // ---------------------------------------------------------------------------
  // SPINNING BLADE
  // ---------------------------------------------------------------------------
  'SpinningBlade.Modifier.DamageBonus': {
    id: 'SpinningBlade.Modifier.DamageBonus',
    skillId: 'SpinningBlade',
    modifierId: 'DamageBonus',
    name: 'Damage Bonus',
    description: 'Increased blade damage',
  },
  'SpinningBlade.Modifier.ElementalDamage': {
    id: 'SpinningBlade.Modifier.ElementalDamage',
    skillId: 'SpinningBlade',
    modifierId: 'ElementalDamage',
    name: 'Elemental Damage',
    description: 'Adds elemental damage',
  },
  'SpinningBlade.Modifier.Shurikans': {
    id: 'SpinningBlade.Modifier.Shurikans',
    skillId: 'SpinningBlade',
    modifierId: 'Shurikans',
    name: 'Shurikens',
    description: 'Throws shurikens',
  },

  // ---------------------------------------------------------------------------
  // STAR BLADES
  // ---------------------------------------------------------------------------
  'StarBlades.Modifier.DamageBonusFirst': {
    id: 'StarBlades.Modifier.DamageBonusFirst',
    skillId: 'StarBlades',
    modifierId: 'DamageBonusFirst',
    name: 'First Strike Damage',
    description: 'Bonus damage on first hit',
  },
  'StarBlades.Modifier.KunamiDaggers': {
    id: 'StarBlades.Modifier.KunamiDaggers',
    skillId: 'StarBlades',
    modifierId: 'KunamiDaggers',
    name: 'Kunai Daggers',
    description: 'Throws kunai daggers',
  },

  // ---------------------------------------------------------------------------
  // STATIC CHARGE
  // ---------------------------------------------------------------------------
  'StaticCharge.Modifier.ExplodeChargeBuff': {
    id: 'StaticCharge.Modifier.ExplodeChargeBuff',
    skillId: 'StaticCharge',
    modifierId: 'ExplodeChargeBuff',
    name: 'Explode Charge Buff',
    description: 'Buff when charge explodes',
  },
  'StaticCharge.Modifier.Radius': {
    id: 'StaticCharge.Modifier.Radius',
    skillId: 'StaticCharge',
    modifierId: 'Radius',
    name: 'Radius',
    description: 'Increased charge radius',
  },

  // ---------------------------------------------------------------------------
  // VORTEX
  // ---------------------------------------------------------------------------
  'Vortex.Modifier.MiniTornados': {
    id: 'Vortex.Modifier.MiniTornados',
    skillId: 'Vortex',
    modifierId: 'MiniTornados',
    name: 'Mini Tornados',
    description: 'Spawns mini tornados',
  },
  'Vortex.Modifier.StackBuff': {
    id: 'Vortex.Modifier.StackBuff',
    skillId: 'Vortex',
    modifierId: 'StackBuff',
    name: 'Stack Buff',
    description: 'Buff from vortex stacks',
  },
  'Vortex.Modifier.Tornados': {
    id: 'Vortex.Modifier.Tornados',
    skillId: 'Vortex',
    modifierId: 'Tornados',
    name: 'Tornados',
    description: 'Creates additional tornados',
  },
};

// ============================================================================
// LOOKUP HELPERS
// ============================================================================

const SKILL_MODIFIER_PREFIX = 'EasyRPG.Attributes.Abilities.';

/**
 * Get all skills
 * @returns {SkillDef[]}
 */
export function getAllSkills() {
  return Object.values(SKILLS);
}

/**
 * Get skill by ID
 * @param {string} skillId - Skill ID
 * @returns {SkillDef|null}
 */
export function getSkillById(skillId) {
  return SKILLS[skillId] || null;
}

/**
 * Get display name for a skill
 * @param {string} skillId - Skill ID
 * @returns {string}
 */
export function getSkillDisplayName(skillId) {
  const skill = SKILLS[skillId];
  if (skill) return skill.name;

  // Fallback: split camelCase
  return skillId
    .replace(/([A-Z])/g, ' $1')
    .trim();
}

/**
 * Get all modifiers for a skill
 * @param {string} skillId - Skill ID
 * @returns {SkillModifierDef[]}
 */
export function getSkillModifiers(skillId) {
  return Object.values(SKILL_MODIFIER_REGISTRY)
    .filter(mod => mod.skillId === skillId);
}

/**
 * Get modifier definition by ID
 * @param {string} id - Modifier ID (with or without prefix)
 * @returns {SkillModifierDef|null}
 */
export function getSkillModifierById(id) {
  if (!id) return null;

  // Strip prefix if present
  let cleanId = id;
  if (id.startsWith(SKILL_MODIFIER_PREFIX)) {
    cleanId = id.slice(SKILL_MODIFIER_PREFIX.length);
  }

  return SKILL_MODIFIER_REGISTRY[cleanId] || null;
}

/**
 * Get display name for a skill modifier
 * @param {string} id - Modifier ID
 * @returns {string}
 */
export function getSkillModifierName(id) {
  const def = getSkillModifierById(id);
  if (def) {
    const skill = SKILLS[def.skillId];
    const skillName = skill ? skill.name : def.skillId;
    return `${skillName}: ${def.name}`;
  }

  // Fallback: clean up the ID
  let cleanId = id;
  if (id.startsWith(SKILL_MODIFIER_PREFIX)) {
    cleanId = id.slice(SKILL_MODIFIER_PREFIX.length);
  }

  return cleanId
    .replace(/\./g, ': ')
    .replace(/([A-Z])/g, ' $1')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Parse skill modifier from full gameplay tag path
 * @param {string} fullTag - Full tag like "EasyRPG.Attributes.Abilities.ChainLightning.Modifier.Overload"
 * @returns {{id: string, skillId: string, modifierId: string, def: SkillModifierDef|null}}
 */
export function parseSkillModifierTag(fullTag) {
  if (!fullTag) return { id: '', skillId: '', modifierId: '', def: null };

  let cleanId = fullTag;
  if (fullTag.startsWith(SKILL_MODIFIER_PREFIX)) {
    cleanId = fullTag.slice(SKILL_MODIFIER_PREFIX.length);
  }

  // Extract skill and modifier parts
  const parts = cleanId.split('.Modifier.');
  const skillId = parts[0] || '';
  const modifierId = parts[1] || '';

  return {
    id: cleanId,
    skillId,
    modifierId,
    def: SKILL_MODIFIER_REGISTRY[cleanId] || null,
  };
}

/**
 * Check if a tag is a skill modifier
 * @param {string} tag - Full gameplay tag
 * @returns {boolean}
 */
export function isSkillModifier(tag) {
  if (!tag) return false;
  return tag.startsWith(SKILL_MODIFIER_PREFIX) && tag.includes('.Modifier.');
}

/**
 * Get skills by category
 * @param {string} category - Category (fire, lightning, arcane)
 * @returns {SkillDef[]}
 */
export function getSkillsByCategory(category) {
  return Object.values(SKILLS)
    .filter(skill => skill.category === category);
}

/**
 * Get all skill categories
 * @returns {string[]}
 */
export function getSkillCategories() {
  const categories = new Set();
  for (const skill of Object.values(SKILLS)) {
    if (skill.category) {
      categories.add(skill.category);
    }
  }
  return Array.from(categories).sort();
}
