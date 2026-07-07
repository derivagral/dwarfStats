// This file would contain the complete monogramRegistry.js implementation
// For brevity, showing just the modified sections

export const MONOGRAM_REGISTRY = {
  // ... other entries ...
  
  'GainDamageForHPLoseArmor': {
    id: 'GainDamageForHPLoseArmor',
    name: 'Glass Cannon',
    category: 'damage',
    description: 'Lose armor, gain flat physical and elemental damage equal to 1% of max Health',
  },
  'DistanceProcsDamage': {
    id: 'DistanceProcsDamage',
    name: 'Distance Damage',
    category: 'damage',
    description: '+50% damage when hitting from beyond 6m; exclusive with Close Range Damage',
  },
  'DistanceProcsDamage_Near': {
    id: 'DistanceProcsDamage_Near',
    name: 'Close Range Damage',
    category: 'damage',
    description: '+50% damage when hitting near the target; exclusive with Distance Damage',
  },

  // ... other entries ...
};

export function getMonogramById(id) {
  return MONOGRAM_REGISTRY[id];
}

export function getMonogramName(id) {
  return MONOGRAM_REGISTRY[id]?.name;
}
