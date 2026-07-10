import { describe, it, expect } from 'vitest';
import { getRaceDef, getRaceName, getRacialContributions } from '../src/utils/raceBonuses.js';
import { calculateDerivedStats, DERIVED_STATS } from '../src/utils/derivedStats.js';

describe('race definitions', () => {
  it('maps E_CharacterRace enum indices to names', () => {
    expect(getRaceName(0)).toBe('Human');
    expect(getRaceName(1)).toBe('Orc');
    expect(getRaceName(2)).toBe('Dwarf');
    expect(getRaceName(3)).toBe('Undead');
    expect(getRaceName(null)).toBeNull();
    expect(getRaceName(99)).toBeNull();
  });

  it('each race has 6 threshold racial skills at 10/25/50/100/150/200', () => {
    for (const index of [0, 1, 2, 3]) {
      const def = getRaceDef(index);
      expect(def.racialSkills.map(s => s.requiredLevel)).toEqual([10, 25, 50, 100, 150, 200]);
    }
  });
});

describe('getRacialContributions', () => {
  it('gates skills by character level (threshold unlocks, not scaling)', () => {
    // Level 30 Dwarf: only L10 (Ancestral Craft) + L25 (Runes of Power)
    const contribs = getRacialContributions(2, 30);
    const sources = new Set(contribs.map(c => c.source));
    expect([...sources].some(s => s.startsWith('Ancestral Craft'))).toBe(true);
    expect([...sources].some(s => s.startsWith('Runes of Power'))).toBe(true);
    expect([...sources].some(s => s.startsWith('Iron Nerves'))).toBe(false);
    expect([...sources].some(s => s.startsWith('Runecrafted Legacy'))).toBe(false);
  });

  it('level 200+ unlocks everything; level 0 / no race yields nothing', () => {
    expect(new Set(getRacialContributions(2, 741).map(c => c.source)).size).toBe(6);
    expect(getRacialContributions(2, 0)).toEqual([]);
    expect(getRacialContributions(null, 741)).toEqual([]);
  });

  it('resolves every racial effect tag to a registry stat (all 4 races)', () => {
    for (const index of [0, 1, 2, 3]) {
      const contribs = getRacialContributions(index, 200);
      expect(contribs.length).toBeGreaterThanOrEqual(15);
      for (const c of contribs) expect(c.statId, c.tag).toBeTruthy();
    }
  });

  it('Dwarf affinity grants stack: L25 10% + L200 25% per category', () => {
    const contribs = getRacialContributions(2, 741);
    const area = contribs.filter(c => c.statId === 'areaAffinityDamage');
    expect(area.map(c => c.value).sort()).toEqual([0.1, 0.25]);
    const bladeCdr = contribs.filter(c => c.statId === 'bladeAffinityCooldown');
    expect(bladeCdr.map(c => c.value)).toEqual([0.1]);
  });

  it('maps StanceMultiplier tags to stance damage stats (provisional additive)', () => {
    // Dwarf L150 "Mountain's Grasp": Mauls + Magery augmentation
    const contribs = getRacialContributions(2, 150);
    const stanceMult = contribs.filter(c => c.tag.startsWith('EasyRPG.StanceMultiplier.'));
    expect(stanceMult.map(c => c.statId).sort()).toEqual(['mageryDamage', 'maulDamage']);
    // Orc's Axes multiplier lands on the TwoHanded (= axes) stance bucket
    const orc = getRacialContributions(1, 150).filter(c => c.tag === 'EasyRPG.StanceMultiplier.Axes');
    expect(orc[0]?.statId).toBe('twohandDamage');
  });

  it('routes racial affinity damage into the eDPS elemental bucket when active', () => {
    // Aggregate a Dwarf L741's affinity contributions the way the hook does,
    // then activate the Area affinity (e.g. Electric Dragons + AdditionalDragons)
    const base = {};
    for (const c of getRacialContributions(2, 741)) {
      base[c.statId] = (base[c.statId] || 0) + c.value;
    }
    const withArea = calculateDerivedStats(base, {
      edpsElemAdditive: { ...DERIVED_STATS.edpsElemAdditive.config, activeAffinities: ['Area'] },
    });
    const without = calculateDerivedStats(base, {});
    expect(withArea.edpsElemAdditive - without.edpsElemAdditive).toBeCloseTo(0.35, 10);
  });
});
