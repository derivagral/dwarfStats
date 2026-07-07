import { describe, it, expect, beforeAll } from 'vitest';
import fs from 'fs';
import path from 'path';
import { extractSkillTree } from '../src/utils/skillTreeParser.js';
import { aggregateSkillEffects, hasWeaponSkillData } from '../src/utils/skillEffectAggregator.js';

let skillTree;

beforeAll(() => {
  const fixturePath = path.join(import.meta.dirname, 'fixtures', 'dr-character-skills.json');
  const fixture = JSON.parse(fs.readFileSync(fixturePath, 'utf8'));
  skillTree = extractSkillTree(fixture);
});

describe('skillEffectAggregator', () => {
  it('returns empty for missing/empty trees', () => {
    expect(aggregateSkillEffects(null)).toEqual([]);
    expect(hasWeaponSkillData(null)).toBe(false);
  });

  it('detects weapon skill data in the fixture', () => {
    expect(hasWeaponSkillData(skillTree)).toBe(true);
  });

  describe('cards', () => {
    it('scales card effects by card level', () => {
      const contributions = aggregateSkillEffects(skillTree);
      // Fixture: CARD3_2 at level 2 → MaxHealth% 0.1 × 2
      const card = contributions.find(
        c => c.kind === 'card' && c.source.startsWith('CARD3_2'),
      );
      expect(card).toBeDefined();
      expect(card.tag).toBe('EasyRPG.Attributes.Base.MaxHealth%');
      expect(card.value).toBeCloseTo(0.2);
      expect(card.statId).toBe('healthBonus'); // percent — not flat health
    });

    it('handles max-level (L6) cards', () => {
      const contributions = aggregateSkillEffects(skillTree);
      // Fixture: CARD5_1 at level 6 → Luck 15×6, CritDamage 0.1×6
      const luck = contributions.find(
        c => c.source.startsWith('CARD5_1') && c.tag.endsWith('Characteristics.Luck'),
      );
      const critDmg = contributions.find(
        c => c.source.startsWith('CARD5_1') && c.tag.endsWith('Base.CriticalDamage'),
      );
      expect(luck?.value).toBeCloseTo(90);
      expect(critDmg?.value).toBeCloseTo(0.6);
    });

    it('skips non-attribute grant tags (modifier grants)', () => {
      const contributions = aggregateSkillEffects(skillTree);
      expect(contributions.every(c => c.tag.startsWith('EasyRPG.Attributes.'))).toBe(true);
    });
  });

  describe('weapon skills', () => {
    it('scales paragon node effects by level (PolearmDamage L732, mauls)', () => {
      const contributions = aggregateSkillEffects(skillTree);
      const polearm = contributions.filter(c => c.source.startsWith('PolearmDamage'));
      expect(polearm.length).toBeGreaterThan(0);

      const dmg = polearm.find(c => c.tag.endsWith('Damage.PoleArm%'));
      expect(dmg.value).toBeCloseTo(7.32); // 0.01 × 732
      expect(dmg.statId).toBe('maulDamage'); // PoleArm = mauls

      const armor = polearm.find(c => c.tag.endsWith('Base.Armor'));
      expect(armor.value).toBeCloseTo(366); // 0.5 × 732

      const regen = polearm.find(c => c.tag.endsWith('HealthRegeneration%'));
      expect(regen.value).toBeCloseTo(0.732); // 0.001 × 732
    });

    it('resolves spear paragon to spearDamage', () => {
      const contributions = aggregateSkillEffects(skillTree);
      const spear = contributions.find(
        c => c.source.startsWith('SpearsDamage') && c.tag.endsWith('Damage.Spear%'),
      );
      expect(spear.value).toBeCloseTo(0.05); // 0.01 × 5
      expect(spear.statId).toBe('spearDamage');
    });

    it('matches save row names case-insensitively', () => {
      // Save row "Spear_Crit_Damage_buff" vs table row "Spear_Crit_Damage_Buff"
      const contributions = aggregateSkillEffects(skillTree);
      const passive = contributions.find(
        c => c.kind === 'weaponSkill' && c.source.startsWith('Spear_Crit_Damage_buff'),
      );
      expect(passive).toBeDefined();
      expect(passive.value).toBeCloseTo(0.1); // Spear% 0.1 × L1

      // Its status-effect buff ("Spartan Spirit") joins despite the case
      // mismatch between the skill and status tables
      const spartan = contributions.find(
        c => c.kind === 'buff' && c.source.startsWith('Spartan Spirit'),
      );
      expect(spartan).toBeDefined();
      expect(spartan.value).toBeCloseTo(0.1);
    });
  });

  describe('buffs (force-enabled at max stacks)', () => {
    it('includes weapon buff magnitudes', () => {
      const contributions = aggregateSkillEffects(skillTree);
      // Spear_Damage_Buff → "Mark of the Sojutsuist": +15% Spear% ×1 stack
      const mark = contributions.find(
        c => c.kind === 'buff' && c.source.startsWith('Mark of the Sojutsuist'),
      );
      expect(mark).toBeDefined();
      expect(mark.tag).toBe('EasyRPG.Attributes.DamageSystem.Damage.Spear%');
      expect(mark.value).toBeCloseTo(0.15);
    });

    it('can be disabled via options', () => {
      const withBuffs = aggregateSkillEffects(skillTree);
      const withoutBuffs = aggregateSkillEffects(skillTree, { includeBuffs: false });
      expect(withoutBuffs.some(c => c.kind === 'buff')).toBe(false);
      expect(withBuffs.filter(c => c.kind !== 'buff').length).toBe(withoutBuffs.length);
    });
  });
});
