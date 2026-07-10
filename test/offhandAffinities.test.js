import { describe, it, expect, beforeAll } from 'vitest';
import fs from 'fs';
import path from 'path';

import { findStatForAttribute, STAT_REGISTRY, OFFHAND_AFFINITY_CATEGORIES } from '../src/utils/statRegistry.js';
import { detectEquippedAbilities, getStepCooldown, unionAffinities, getAbilityDef } from '../src/utils/offhandAbilities.js';
import { aggregateSkillEffects, hasMainTreeAffinityEffect } from '../src/utils/skillEffectAggregator.js';
import { extractSkillTree } from '../src/utils/skillTreeParser.js';
import { extractEquippedItems } from '../src/utils/equipmentParser.js';
import { calculateDerivedStats, resolveAffinityBonuses, DERIVED_STATS } from '../src/utils/derivedStats.js';
import { parseCharacterRace, parseCharacterLevel, RACE_LEVEL_CAP } from '../src/utils/healthParser.js';
import { resolveStatId } from '../src/hooks/useDerivedStats.js';

// The dr-full-inventory fixture is an Electric Dragons build: all four
// offhands proc ElectricDragons and the main tree has Dragon/Orbit/Area
// affinity nodes allocated.
let saveFixture;
let equippedItems;

beforeAll(() => {
  const fixturePath = path.join(import.meta.dirname, 'fixtures', 'dr-full-inventory.json');
  saveFixture = JSON.parse(fs.readFileSync(fixturePath, 'utf8'));
  equippedItems = extractEquippedItems(saveFixture);
});

// =============================================================================
// Stat registry: affinity tags classify to their own stats
// =============================================================================

describe('offhand affinity stat registration', () => {
  it('registers damage + cooldown stats for all 12 categories', () => {
    for (const { key } of OFFHAND_AFFINITY_CATEGORIES) {
      expect(STAT_REGISTRY[`${key}AffinityDamage`]).toBeDefined();
      expect(STAT_REGISTRY[`${key}AffinityCooldown`]).toBeDefined();
    }
    expect(OFFHAND_AFFINITY_CATEGORIES).toHaveLength(12);
  });

  it('classifies OffhandCategories tags to affinity stats, not the physical damage bucket', () => {
    // Regression: the loose 'Damage%' regex on damageBonus used to swallow these
    expect(findStatForAttribute('EasyRPG.OffhandCategories.Dragon.Damage%Bonus')?.id)
      .toBe('dragonAffinityDamage');
    expect(findStatForAttribute('EasyRPG.OffhandCategories.Dragon.CooldownBonus')?.id)
      .toBe('dragonAffinityCooldown');
    expect(findStatForAttribute('EasyRPG.OffhandCategories.Charging.Damage%Bonus')?.id)
      .toBe('chargingAffinityDamage');
  });

  it('does not disturb existing damage/cooldown classification', () => {
    expect(findStatForAttribute('EasyRPG.Attributes.Base.Damage%6')?.id).toBe('damageBonus');
    expect(findStatForAttribute('EasyRPG.Attributes.CooldownReduction%')?.id).toBe('cooldownReduction');
  });

  it('resolveStatId (item aggregation path) resolves affinity tags', () => {
    expect(resolveStatId('EasyRPG.OffhandCategories.Orbit.Damage%Bonus')).toBe('orbitAffinityDamage');
    expect(resolveStatId('EasyRPG.OffhandCategories.Area.CooldownBonus')).toBe('areaAffinityCooldown');
  });

  it('displays Charging as Momentum', () => {
    expect(STAT_REGISTRY.chargingAffinityDamage.name).toBe('Momentum Affinity Damage');
  });
});

// =============================================================================
// Generated player abilities
// =============================================================================

describe('playerAbilities generated data', () => {
  it('ElectricDragons is Dragon + Orbit, lightning element', () => {
    const def = getAbilityDef('ElectricDragons');
    expect(def).toBeTruthy();
    expect(def.affinities).toEqual(['Dragon', 'Orbit']);
    expect(def.element).toBe('lightning');
    expect(def.baseDamageMultiplier).toBe(2);
  });

  it('ElectricDragons AdditionalDragons modifier adds Area affinity', () => {
    const def = getAbilityDef('ElectricDragons');
    expect(def.affinityBehaviours).toEqual({
      'EasyRPG.Attributes.Abilities.ElectricDragons.Modifier.AdditionalDragons': 'Area',
    });
  });

  it('carries the offhand-count cooldown step function', () => {
    const def = getAbilityDef('ElectricDragons');
    expect(def.cooldown).toEqual({ initial: 8.07, twoOffhands: 6.6, threeOffhands: 5.13 });
  });

  it('normalizes BurningShield despite its .ProcChance identifier tag', () => {
    const def = getAbilityDef('BurningShield');
    expect(def).toBeTruthy();
    expect(def.affinities).toEqual(['Orbit']);
  });
});

// =============================================================================
// Equipped offhand ability detection (Electric Dragons save)
// =============================================================================

describe('detectEquippedAbilities', () => {
  it('detects ElectricDragons on all four offhands', () => {
    const { abilities, offhandCount } = detectEquippedAbilities(equippedItems);
    expect(offhandCount).toBe(4);
    expect(abilities).toHaveLength(1);
    expect(abilities[0].key).toBe('ElectricDragons');
    expect(abilities[0].itemCount).toBe(4);
  });

  it('activates Area via the AdditionalDragons modifier on the equipped items', () => {
    const { abilities } = detectEquippedAbilities(equippedItems);
    const ed = abilities[0];
    expect(ed.baseAffinities).toEqual(['Dragon', 'Orbit']);
    expect(ed.addedAffinities).toEqual([{
      category: 'Area',
      modifierTag: 'EasyRPG.Attributes.Abilities.ElectricDragons.Modifier.AdditionalDragons',
    }]);
    expect(ed.affinities.sort()).toEqual(['Area', 'Dragon', 'Orbit']);
    expect(unionAffinities(abilities).sort()).toEqual(['Area', 'Dragon', 'Orbit']);
  });

  it('never derives affinities from the weapon slot', () => {
    // Weapons can't carry affinity tags — only offhand items are scanned
    const weaponOnly = equippedItems.filter(item => item.slot === 'weapon');
    const { abilities, offhandCount } = detectEquippedAbilities(weaponOnly);
    expect(abilities).toHaveLength(0);
    expect(offhandCount).toBe(0);
  });

  it('steps the cooldown down by offhand count, flooring at 3+', () => {
    const ed = getAbilityDef('ElectricDragons');
    expect(getStepCooldown(ed, 1)).toBe(8.07);
    expect(getStepCooldown(ed, 2)).toBe(6.6);
    expect(getStepCooldown(ed, 3)).toBe(5.13);
    expect(getStepCooldown(ed, 4)).toBe(5.13); // full loadout uses the 3-offhand value
    expect(getStepCooldown({ cooldown: null }, 4)).toBe(0);
  });
});

// =============================================================================
// Main-tree affinity node aggregation
// =============================================================================

describe('main-tree affinity aggregation', () => {
  it('knows the generated affinity nodes', () => {
    // "Sky Rush" — 7% Sky cooldown
    expect(hasMainTreeAffinityEffect('UI_SkillTreeNode_Large_57')).toBe(true);
    expect(hasMainTreeAffinityEffect('UI_SkillTreeNode_Start')).toBe(false);
  });

  it('aggregates allocated affinity nodes from the ED save into affinity stats', () => {
    const skillTree = extractSkillTree(saveFixture);
    const contributions = aggregateSkillEffects(skillTree);
    const affinity = contributions.filter(c => c.tag.startsWith('EasyRPG.OffhandCategories.'));
    expect(affinity.length).toBeGreaterThan(0);

    const totals = {};
    for (const c of affinity) {
      expect(c.statId).toBeTruthy(); // every affinity tag resolves to a stat
      expect(c.kind).toBe('mainTree');
      totals[c.statId] = (totals[c.statId] || 0) + c.value;
    }
    // The build runs Electric Dragons: Dragon/Orbit/Area investment is expected
    expect(totals.dragonAffinityDamage).toBeGreaterThan(0);
    expect(totals.orbitAffinityDamage).toBeGreaterThan(0);
    expect(totals.dragonAffinityCooldown).toBeGreaterThan(0);
  });

  it('labels contributions with node display names', () => {
    const skillTree = extractSkillTree(saveFixture);
    const contributions = aggregateSkillEffects(skillTree);
    const dragonForce = contributions.find(c => c.source.startsWith('Dragon Force'));
    expect(dragonForce).toBeTruthy();
    expect(dragonForce.statId).toBe('dragonAffinityDamage');
  });
});

// =============================================================================
// Derived stats: eDPS elemental bucket + offhand cooldown
// =============================================================================

describe('affinity routing in derived stats', () => {
  it('resolveAffinityBonuses sums only active categories', () => {
    const stats = {
      dragonAffinityDamage: 0.30,
      orbitAffinityDamage: 0.16,
      areaAffinityDamage: 0.05,
      skyAffinityDamage: 0.99, // inactive — must not count
      dragonAffinityCooldown: 0.08,
    };
    const { damage, cooldown, perCategory } = resolveAffinityBonuses(stats, ['Dragon', 'Orbit', 'Area']);
    expect(damage).toBeCloseTo(0.51, 10);
    expect(cooldown).toBeCloseTo(0.08, 10);
    expect(perCategory.map(c => c.category)).toEqual(['Dragon', 'Orbit', 'Area']);
  });

  it('accepts lowercase keys as well as category tags', () => {
    const stats = { dragonAffinityDamage: 0.1 };
    expect(resolveAffinityBonuses(stats, ['dragon']).damage).toBeCloseTo(0.1, 10);
  });

  it('edpsElemAdditive includes routed affinity damage', () => {
    const base = {
      damageMultiplier: 0.5,
      dragonAffinityDamage: 0.30,
      orbitAffinityDamage: 0.16,
    };
    const withoutAffinity = calculateDerivedStats(base, {});
    const withAffinity = calculateDerivedStats(base, {
      edpsElemAdditive: { ...DERIVED_STATS.edpsElemAdditive.config, activeAffinities: ['Dragon', 'Orbit'] },
    });
    expect(withAffinity.edpsElemAdditive - withoutAffinity.edpsElemAdditive).toBeCloseTo(0.46, 10);
  });

  it('offhandCooldownReduction adds affinity CDR to the item value (additive)', () => {
    const base = {
      cooldownReduction: 0.10,
      dragonAffinityCooldown: 0.08,
      areaAffinityCooldown: 0.07,
    };
    const values = calculateDerivedStats(base, {
      offhandCooldownReduction: { activeAffinities: ['Dragon', 'Area'] },
    });
    expect(values.offhandCooldownReduction).toBeCloseTo(0.25, 10);
  });

  it('offhandCooldownSeconds applies total CDR to the step base', () => {
    const base = { cooldownReduction: 0.10, dragonAffinityCooldown: 0.10 };
    const values = calculateDerivedStats(base, {
      offhandCooldownReduction: { activeAffinities: ['Dragon'] },
      offhandCooldownSeconds: { baseCooldown: 5.13, abilityName: 'Electric Dragons', offhandCount: 4 },
    });
    expect(values.offhandCooldownSeconds).toBeCloseTo(5.13 * 0.8, 10);
  });

  it('offhandCooldownSeconds is 0 without a detected ability', () => {
    const values = calculateDerivedStats({}, {});
    expect(values.offhandCooldownSeconds).toBe(0);
  });
});

// =============================================================================
// Race + level detection
// =============================================================================

describe('race and level detection', () => {
  it('parses the E_CharacterRace enum index from the save', () => {
    expect(parseCharacterRace(saveFixture)).toBe(2);
  });

  it('parses character level (racial grants cap at level 200)', () => {
    expect(parseCharacterLevel(saveFixture)).toBe(741);
    expect(RACE_LEVEL_CAP).toBe(200);
  });

  it('returns null race for empty saves', () => {
    expect(parseCharacterRace({})).toBeNull();
  });
});
