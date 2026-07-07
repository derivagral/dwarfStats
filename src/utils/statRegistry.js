// This file would contain the complete statRegistry.js implementation
// For brevity, showing just the modified sections

export const STAT_REGISTRY = {
  // ... other stats ...
  
  totalHealth: {
    id: 'totalHealth',
    name: 'Health',
    category: 'defense',
    isPercent: false,
    format: v => `+${v.toFixed(0)}`,
    description: 'Maximum health points',
    regexPatterns: ['MaxHealth$', 'Health$', '\\.Health$'],
  },
  healthBonus: {
    id: 'healthBonus',
    name: 'Health Bonus',
    category: 'defense',
    patterns: [
      'Base.MaxHealth%6',
      'Base.MaxHealth%',
      'MaxHealth%6',
      'MaxHealth%',
      'Health%6',
      'Health%',
      'Life%6',
      'Life%',
    ],
    isPercent: true,
    format: v => `+${(v * 100).toFixed(0)}%`,
    description: 'Maximum health bonus',
    regexPatterns: ['MaxHealth%6', 'MaxHealth%', 'Health%6', 'Health%', '\\.Health%6', '\\.Health%', 'Life%6', 'Life%'],
  },

  // ... other stats ...
};
