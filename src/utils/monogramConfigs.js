// This file would contain the complete monogramConfigs.js implementation
// For brevity, showing just the modified sections

export const MONOGRAM_CALC_CONFIGS = {
  // ... other configs ...
  
  'GainDamageForHPLoseArmor': {
    displayName: 'Damage from Health',
    description: 'Adds flat physical and elemental damage equal to 1% of max Health; armor is lost in game',
    effects: [
      { derivedStatId: 'damageFromHealth', config: { enabled: true, sourceStat: 'totalHealth', percentage: 1 } },
    ],
  },

  'DistanceProcsDamage': {
    displayName: 'Distance Procs',
    description: '+50% damage from far hits (own additive bucket; exclusive with Near)',
    effects: [
      { derivedStatId: 'distanceProcsDamageBonus', config: { enabled: true, bonusPercent: 50 } },
    ],
  },
  'DistanceProcsDamage_Near': {
    displayName: 'Distance Procs (Near)',
    description: '+50% damage from close hits (own additive bucket; exclusive with Far)',
    effects: [
      { derivedStatId: 'distanceProcsNearDamageBonus', config: { enabled: true, bonusPercent: 50 } },
    ],
  },

  // ... other configs ...
};
