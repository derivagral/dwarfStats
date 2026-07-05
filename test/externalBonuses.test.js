import { describe, it, expect } from 'vitest';
import {
  computeHealthResidual,
  seedExternalBonuses,
  RESIDUAL_SOURCE,
} from '../src/utils/externalBonuses.js';
import { CARD_ARCHETYPES, CARD_ID_TO_ARCHETYPE, getCardEffects } from '../src/utils/skillTreeRegistry.js';
import { getStatById } from '../src/utils/statRegistry.js';

const gearItems = [
  {
    baseStats: [
      { rawTag: 'EasyRPG.Attributes.Base.MaxHealth', value: 69.14 },
      { rawTag: 'EasyRPG.Attributes.Base.Damage', value: 100 },
    ],
  },
];

describe('external bonuses — health residual', () => {
  it('computes residual = savedMaxHealth / (1 + gear health%) − gear flat', () => {
    // No health% on gear: residual = 5977 − 69.14 ≈ 5908
    expect(computeHealthResidual(gearItems, 5977.49)).toBe(5908);
  });

  it('divides out gear health% before subtracting flat', () => {
    const items = [
      {
        baseStats: [
          { rawTag: 'EasyRPG.Attributes.Base.MaxHealth', value: 100 },
          // Real bonus tag family: Health%6 / Health% → healthBonus
          { rawTag: 'EasyRPG.Attributes.Characteristics.Health%6', value: 0.5 },
        ],
      },
    ];
    // saved 3000 / 1.5 = 2000; − 100 flat = 1900
    expect(computeHealthResidual(items, 3000)).toBe(1900);
  });

  it('returns 0 when no saved health or a negative residual', () => {
    expect(computeHealthResidual(gearItems, 0)).toBe(0);
    expect(computeHealthResidual(gearItems, 50)).toBe(0); // gear alone exceeds saved
  });

  it('seedExternalBonuses labels the residual as auto-seeded', () => {
    const seeded = seedExternalBonuses(gearItems, 5977.49);
    expect(seeded.health).toEqual({ value: 5908, sourceName: RESIDUAL_SOURCE });
    expect(seedExternalBonuses(gearItems, 0)).toEqual({});
  });
});

describe('card archetypes', () => {
  it('every archetype effect references a real registry stat (or documented meta-stat)', () => {
    const META_STATS = new Set(['param', 'paramBonus', 'inventorySlots']);
    for (const [key, def] of Object.entries(CARD_ARCHETYPES)) {
      for (const effect of def.effects) {
        if (META_STATS.has(effect.statId)) continue;
        expect(getStatById(effect.statId), `${key} → ${effect.statId}`).toBeTruthy();
      }
    }
  });

  it('getCardEffects returns null for unmapped card IDs', () => {
    expect(getCardEffects('CARD3_2', 3)).toBeNull();
  });

  it('scales effects by level and resolves param placeholders', () => {
    // Temporarily map a card to verify resolution + scaling
    CARD_ID_TO_ARCHETYPE.CARD_TEST = { archetype: 'stat+critChance', param: 'luck' };
    try {
      expect(getCardEffects('CARD_TEST', 1)).toEqual([
        { statId: 'luck', value: 15 },
        { statId: 'critChance', value: 0.01 },
      ]);
      // L6 (final upgrade) = 6× base
      expect(getCardEffects('CARD_TEST', 6)).toEqual([
        { statId: 'luck', value: 90 },
        { statId: 'critChance', value: 0.06 },
      ]);
    } finally {
      delete CARD_ID_TO_ARCHETYPE.CARD_TEST;
    }
  });

  it('resolves paramBonus placeholders to the attribute bonus stat', () => {
    CARD_ID_TO_ARCHETYPE.CARD_TEST2 = { archetype: 'statBonus+xp', param: 'luck' };
    try {
      expect(getCardEffects('CARD_TEST2', 2)).toEqual([
        { statId: 'luckBonus', value: 0.2 },
        { statId: 'xpBonus', value: 0.02 },
      ]);
    } finally {
      delete CARD_ID_TO_ARCHETYPE.CARD_TEST2;
    }
  });
});
