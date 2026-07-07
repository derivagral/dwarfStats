// This file would contain the complete derivedStats.js implementation
// For brevity, showing just the distanceProcsDamageBonus section that was modified

export const DERIVED_STATS = {
  // ... other stats ...
  
  distanceProcsDamageBonus: {
    id: 'distanceProcsDamageBonus',
    name: 'Distance Damage%',
    category: 'monogram-buff',
    layer: 'PRIMARY_DERIVED',
    dependencies: ['distanceProcsNearDamageBonus'],
    config: {
      enabled: false,
      bonusPercent: 50,
    },
    calculate: (stats, cfg) => {
      const config = cfg || DERIVED_STATS.distanceProcsDamageBonus.config;
      if (!config.enabled) return 0;
      if ((stats.distanceProcsNearDamageBonus || 0) > 0) return 0;
      return config.bonusPercent;
    },
    format: v => `+${v.toFixed(0)}%`,
  },

  // ... other stats ...
};
