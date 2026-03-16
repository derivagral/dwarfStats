import { describe, it, expect, beforeAll } from 'vitest';
import { extractSkillTree } from '../src/utils/skillTreeParser.js';
import {
  getWeaponSkillDef,
  getCraftingSkillDef,
  TREE_KEYSTONES,
} from '../src/utils/skillTreeRegistry.js';
import fs from 'fs';
import path from 'path';

/**
 * Tests for skill tree store logic.
 * Since useSkillTreeStore is a React hook, we test the core computation
 * logic that the hook's useMemo depends on, using the same algorithm.
 */

let skillsFixture;
let skillTreeData;

beforeAll(() => {
  const fixturePath = path.join(import.meta.dirname, 'fixtures', 'dr-character-skills.json');
  skillsFixture = JSON.parse(fs.readFileSync(fixturePath, 'utf8'));
  skillTreeData = extractSkillTree(skillsFixture);
});

// Replicate the effectiveSkillStats computation from useSkillTreeStore
function computeEffectiveStats(skillTreeData, skillOverrides, skillValues, keystoneSelections) {
  const stats = {};

  const isEnabled = (rowName) => {
    const override = skillOverrides[rowName];
    if (override && override.enabled !== undefined) return override.enabled;
    return true;
  };

  const getLevel = (rowName, saveLevel) => {
    const override = skillOverrides[rowName];
    if (override && override.level !== undefined) return override.level;
    return saveLevel;
  };

  const addStat = (statId, value, sourceName) => {
    if (!statId || !value) return;
    if (!stats[statId]) stats[statId] = { total: 0, sources: [] };
    stats[statId].total += value;
    stats[statId].sources.push({ itemName: sourceName, slot: 'skillTree', value });
  };

  // Weapon skills
  for (const stanceData of Object.values(skillTreeData.weaponStances)) {
    for (const skill of stanceData.skills) {
      if (!isEnabled(skill.rowName)) continue;
      const def = getWeaponSkillDef(skill.rowName);
      if (!def || !def.statId) continue;
      const userValue = skillValues[skill.rowName];
      if (userValue === undefined || userValue === 0) continue;
      const level = getLevel(skill.rowName, skill.level);
      const value = def.perLevel ? userValue * level : userValue;
      addStat(def.statId, value, def.name);
    }
  }

  // Crafting skills
  for (const skill of skillTreeData.crafting) {
    if (!isEnabled(skill.rowName)) continue;
    const def = getCraftingSkillDef(skill.rowName);
    if (!def || !def.statId) continue;
    const userValue = skillValues[skill.rowName];
    if (userValue === undefined || userValue === 0) continue;
    const level = getLevel(skill.rowName, skill.level);
    const value = def.paragon ? userValue * level : userValue;
    addStat(def.statId, value, def.name);
  }

  // Keystones
  for (const [keystoneId, selected] of Object.entries(keystoneSelections)) {
    if (!selected) continue;
    const keystone = TREE_KEYSTONES[keystoneId];
    if (!keystone || !keystone.statId) continue;
    const userValue = skillValues[keystoneId];
    if (userValue === undefined || userValue === 0) continue;
    addStat(keystone.statId, userValue, keystone.name);
  }

  return stats;
}

// Replicate skillConfigOverrides computation
function computeConfigOverrides(keystoneSelections, skillValues) {
  const overrides = {};

  const affinityDamageKeystones = ['fireAffinityDamage', 'arcaneAffinityDamage', 'lightningAffinityDamage'];
  let totalAffinityDamage = 0;
  for (const id of affinityDamageKeystones) {
    if (keystoneSelections[id]) {
      totalAffinityDamage += skillValues[id] || 1.0;
    }
  }
  if (totalAffinityDamage > 0) {
    overrides.edpsAD = { affinityDamage: totalAffinityDamage };
  }

  if (keystoneSelections.closeDistance) {
    overrides.edpsEMulti = { ...(overrides.edpsEMulti || {}), closeDistanceKeystone: true };
  }
  if (keystoneSelections.farDistance) {
    overrides.edpsEMulti = { ...(overrides.edpsEMulti || {}), farDistanceKeystone: true };
  }

  return overrides;
}

describe('useSkillTreeStore logic', () => {
  describe('effectiveSkillStats', () => {
    it('returns empty stats when no values are entered', () => {
      const stats = computeEffectiveStats(skillTreeData, {}, {}, {});
      expect(Object.keys(stats)).toHaveLength(0);
    });

    it('aggregates weapon skill stat with user value', () => {
      // SpearMediumDmg has statId: 'spearDamage'
      const skillValues = { 'SpearMediumDmg': 0.15 };
      const stats = computeEffectiveStats(skillTreeData, {}, skillValues, {});

      expect(stats.spearDamage).toBeDefined();
      expect(stats.spearDamage.total).toBeCloseTo(0.15);
      expect(stats.spearDamage.sources).toHaveLength(1);
      expect(stats.spearDamage.sources[0].slot).toBe('skillTree');
    });

    it('multiplies paragon skill value by level', () => {
      // SpearsDamage is paragon, perLevel=true, fixture level=5
      const skillValues = { 'SpearsDamage': 0.01 }; // 1% per level
      const stats = computeEffectiveStats(skillTreeData, {}, skillValues, {});

      expect(stats.spearDamage).toBeDefined();
      expect(stats.spearDamage.total).toBeCloseTo(0.05); // 1% * 5 levels
    });

    it('respects level override for paragon skills', () => {
      const skillValues = { 'SpearsDamage': 0.01 };
      const skillOverrides = { 'SpearsDamage': { level: 100 } };
      const stats = computeEffectiveStats(skillTreeData, skillOverrides, skillValues, {});

      expect(stats.spearDamage.total).toBeCloseTo(1.0); // 1% * 100 levels
    });

    it('excludes disabled skills', () => {
      const skillValues = { 'SpearMediumDmg': 0.15 };
      const skillOverrides = { 'SpearMediumDmg': { enabled: false } };
      const stats = computeEffectiveStats(skillTreeData, skillOverrides, skillValues, {});

      expect(stats.spearDamage).toBeUndefined();
    });

    it('aggregates multiple skills to same statId', () => {
      // SpearMediumDmg and Spear_Damage_Buff both map to spearDamage
      const skillValues = {
        'SpearMediumDmg': 0.10,
        'Spear_Damage_Buff': 0.20,
      };
      const stats = computeEffectiveStats(skillTreeData, {}, skillValues, {});

      expect(stats.spearDamage.total).toBeCloseTo(0.30);
      expect(stats.spearDamage.sources).toHaveLength(2);
    });

    it('aggregates crafting skill with user value', () => {
      // Armor_Health_Low has statId: 'health'
      const skillValues = { 'Armor_Health_Low': 0.05 };
      const stats = computeEffectiveStats(skillTreeData, {}, skillValues, {});

      expect(stats.health).toBeDefined();
      expect(stats.health.total).toBeCloseTo(0.05);
    });

    it('aggregates keystone stat with user value', () => {
      // fireAffinityDamage has statId: 'fireDamageBonus'
      const keystoneSelections = { fireAffinityDamage: true };
      const skillValues = { fireAffinityDamage: 1.0 };
      const stats = computeEffectiveStats(skillTreeData, {}, skillValues, keystoneSelections);

      expect(stats.fireDamageBonus).toBeDefined();
      expect(stats.fireDamageBonus.total).toBeCloseTo(1.0);
    });

    it('ignores unchecked keystones', () => {
      const keystoneSelections = { fireAffinityDamage: false };
      const skillValues = { fireAffinityDamage: 1.0 };
      const stats = computeEffectiveStats(skillTreeData, {}, skillValues, keystoneSelections);

      expect(stats.fireDamageBonus).toBeUndefined();
    });
  });

  describe('skillConfigOverrides', () => {
    it('returns empty overrides when no keystones selected', () => {
      const overrides = computeConfigOverrides({}, {});
      expect(Object.keys(overrides)).toHaveLength(0);
    });

    it('sets affinityDamage for single affinity keystone', () => {
      const overrides = computeConfigOverrides({ fireAffinityDamage: true }, {});
      expect(overrides.edpsAD).toBeDefined();
      expect(overrides.edpsAD.affinityDamage).toBe(1.0); // default
    });

    it('sums affinityDamage for multiple affinities with custom values', () => {
      const keystoneSelections = {
        fireAffinityDamage: true,
        arcaneAffinityDamage: true,
      };
      const skillValues = {
        fireAffinityDamage: 0.8,
        arcaneAffinityDamage: 1.2,
      };
      const overrides = computeConfigOverrides(keystoneSelections, skillValues);
      expect(overrides.edpsAD.affinityDamage).toBeCloseTo(2.0);
    });

    it('sets distance keystone flags', () => {
      const overrides = computeConfigOverrides({ closeDistance: true }, {});
      expect(overrides.edpsEMulti).toBeDefined();
      expect(overrides.edpsEMulti.closeDistanceKeystone).toBe(true);
    });

    it('sets both distance keystones', () => {
      const overrides = computeConfigOverrides(
        { closeDistance: true, farDistance: true },
        {},
      );
      expect(overrides.edpsEMulti.closeDistanceKeystone).toBe(true);
      expect(overrides.edpsEMulti.farDistanceKeystone).toBe(true);
    });
  });

  describe('fixture data integrity', () => {
    it('fixture has weapon skills with known statIds', () => {
      let skillsWithStatId = 0;
      for (const stanceData of Object.values(skillTreeData.weaponStances)) {
        for (const skill of stanceData.skills) {
          const def = getWeaponSkillDef(skill.rowName);
          if (def?.statId) skillsWithStatId++;
        }
      }
      // At least some weapon skills should have statIds
      expect(skillsWithStatId).toBeGreaterThan(10);
    });

    it('fixture has crafting skills with known statIds', () => {
      let skillsWithStatId = 0;
      for (const skill of skillTreeData.crafting) {
        const def = getCraftingSkillDef(skill.rowName);
        if (def?.statId) skillsWithStatId++;
      }
      expect(skillsWithStatId).toBeGreaterThan(3);
    });

    it('PolearmDamage paragon has high level in fixture', () => {
      const maulsSkills = skillTreeData.weaponStances.mauls.skills;
      const paragon = maulsSkills.find(s => s.rowName === 'PolearmDamage');
      expect(paragon).toBeDefined();
      expect(paragon.level).toBe(732);
    });
  });
});
