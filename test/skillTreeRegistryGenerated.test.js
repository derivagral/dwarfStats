import { describe, it, expect } from 'vitest';
import {
  WEAPON_SKILL_REGISTRY,
  CARD_REGISTRY,
  getWeaponSkillDef,
  getCardDef,
} from '../src/utils/skillTreeRegistry.js';

describe('skillTreeRegistry generated-data merge', () => {
  describe('cards', () => {
    it('populates real effects for curated cards', () => {
      const def = getCardDef('CARD3_2');
      expect(def.name).toBe('Card 3-2'); // curated name wins
      expect(def.effects).toEqual([
        { tag: 'EasyRPG.Attributes.Base.MaxHealth%', value: 0.1 },
      ]);
      expect(def.maxLevel).toBe(6);
      expect(def.generated).toBe(true);
    });

    it('resolves cards missing from the curated registry', () => {
      expect(CARD_REGISTRY['CARD2']).toBeUndefined();
      const def = getCardDef('CARD2');
      expect(def).not.toBeNull();
      expect(def.name).toBe('Card 2');
      expect(def.family).toBe(2);
      expect(def.variant).toBeNull();
      expect(def.effects).toEqual([
        { tag: 'EasyRPG.Attributes.Base.Damage', value: 20.0 },
      ]);
    });

    it('every generated card carries at least one effect', () => {
      // All 81 rows in the extracted table have BonusAttributes
      const sample = ['CARD1', 'CARD10_0', 'CARD17_5', 'CARD5_12', 'CARD9_0'];
      for (const rowName of sample) {
        const def = getCardDef(rowName);
        expect(def, rowName).not.toBeNull();
        expect(def.effects.length, rowName).toBeGreaterThan(0);
      }
    });

    it('returns null for unknown card ids', () => {
      expect(getCardDef('CARD999_9')).toBeNull();
    });
  });

  describe('weapon skills', () => {
    it('merges per-level effects into curated paragon nodes', () => {
      const def = getWeaponSkillDef('SpearsDamage');
      expect(def.type).toBe('paragon'); // curated field preserved
      expect(def.gameMaxLevel).toBe(5000);
      const spearPct = def.effects.find(e => e.tag === 'EasyRPG.Attributes.DamageSystem.Damage.Spear%');
      expect(spearPct?.value).toBe(0.01);
      // Paragon rider effects the curated registry didn't know about
      expect(def.effects.length).toBeGreaterThan(1);
    });

    it('joins buff magnitudes from the status-effect lexicon', () => {
      const def = getWeaponSkillDef('Spear_Damage_Buff');
      expect(def.buff).toBeDefined();
      expect(def.buff.name).toBe('Mark of the Sojutsuist');
      expect(def.buff.duration).toBe(10);
      expect(def.buff.effects[0].tag).toBe('EasyRPG.Attributes.DamageSystem.Damage.Spear%');
      expect(def.buff.effects[0].value).toBe(0.15);
    });

    it('creates generated defs for rows missing from the curated registry', () => {
      // TwoHandDamage (2H paragon node) exists in game data but not the
      // curated registry
      expect(WEAPON_SKILL_REGISTRY['TwoHandDamage']).toBeUndefined();
      const def = getWeaponSkillDef('TwoHandDamage');
      expect(def).not.toBeNull();
      expect(def.generated).toBe(true);
      expect(def.weapon).toBe('twoHand');
      expect(Array.isArray(def.effects)).toBe(true);
    });

    it('leaves unknown rows null', () => {
      expect(getWeaponSkillDef('NotARealSkillRow')).toBeNull();
    });
  });
});
