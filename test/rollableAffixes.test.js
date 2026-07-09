import { describe, it, expect } from 'vitest';
import {
  ROLLABLE_AFFIX_LIST,
  ROLLABLE_AFFIXES_BY_CATEGORY,
  getRollRowSetForAffix,
  searchRollableAffixes,
} from '../src/utils/affixList.js';
import { buildAffixMatchers, scorePool } from '../src/utils/itemFilter.js';

describe('rollable affix list (from DT_Base_Item_Attributes)', () => {
  it('offers only game-rollable affixes, grouped by stat', () => {
    // 82 rollable rows (minus tagless Random* placeholders) group into ~71 stats
    expect(ROLLABLE_AFFIX_LIST.length).toBeGreaterThan(60);
    expect(ROLLABLE_AFFIX_LIST.length).toBeLessThan(90);
    // Derived/monogram stats never roll and must not appear
    expect(ROLLABLE_AFFIX_LIST.find(a => a.id === 'edpsPhysFlat')).toBeUndefined();
  });

  it('stance rows map to their specific stats, not generic damage', () => {
    const byId = Object.fromEntries(ROLLABLE_AFFIX_LIST.map(a => [a.id, a]));
    expect(byId.archeryDamage.rollRows.map(r => r.rowName)).toContain('ArcheryDamage%');
    expect(byId.mageryCritChance.rollRows.map(r => r.rowName)).toContain('MageryCriticalChance%');
    expect(byId.maulDamage.rollRows.map(r => r.rowName)).toContain('MaulsDamage%');
    // Generic damageBonus must not swallow stance rows
    const generic = byId.damageBonus?.rollRows.map(r => r.rowName) ?? [];
    expect(generic.filter(rn => /Archery|Magery|Fists|Scythes|Mauls|Spears/.test(rn))).toEqual([]);
  });

  it('carries roll metadata for UI tooltips', () => {
    const spear = ROLLABLE_AFFIX_LIST.find(a => a.id === 'spearCritDamage');
    const row = spear.rollRows.find(r => r.rowName === 'SpearsCriticalDamage%');
    expect(row.value).toBeCloseTo(0.02);
    expect(row.valuePerLevel).toBeCloseTo(0.004);
  });

  it('search finds affixes by name and row name', () => {
    expect(searchRollableAffixes('spear').some(a => a.id === 'spearDamage')).toBe(true);
    expect(searchRollableAffixes('boss').some(a => a.id === 'bossBonus')).toBe(true);
  });

  it('groups by category for the selector', () => {
    expect(Object.keys(ROLLABLE_AFFIXES_BY_CATEGORY)).toContain('stance');
    expect(Object.keys(ROLLABLE_AFFIXES_BY_CATEGORY)).toContain('attributes');
  });
});

describe('exact rowName matching in itemFilter', () => {
  it('matches pool rows by exact rowName set', () => {
    const matchers = buildAffixMatchers([{ affixId: 'archeryDamage' }]);
    expect(matchers[0].rowSet).toBeInstanceOf(Set);

    const pool = [{ rowName: 'ArcheryDamage%' }, { rowName: 'Strength' }];
    const { count, matchedAffixIds } = scorePool(pool, matchers);
    expect(count).toBe(1);
    expect(matchedAffixIds).toEqual(['archeryDamage']);
  });

  it('does not cross-match stance rows to generic stats', () => {
    const matchers = buildAffixMatchers([{ affixId: 'damageBonus' }]);
    const pool = [{ rowName: 'ArcheryDamage%' }, { rowName: 'MaulsDamage%' }];
    expect(scorePool(pool, matchers).count).toBe(0);
  });

  it('is case-insensitive (UE row names)', () => {
    const matchers = buildAffixMatchers([{ affixId: 'strength' }]);
    expect(scorePool([{ rowName: 'strength' }], matchers).count).toBe(1);
  });

  it('falls back to registry patterns for non-rollable stats (legacy shares)', () => {
    const matchers = buildAffixMatchers([{ affixId: 'moveSpeed' }]);
    // Whether or not moveSpeed rolls, the matcher must not throw and must
    // return a well-formed matcher
    expect(matchers[0].affixId).toBe('moveSpeed');
    expect(matchers[0].rowSet instanceof Set || Array.isArray(matchers[0].patterns)).toBe(true);
  });
});
