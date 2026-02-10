import { describe, it, expect } from 'vitest';
import {
  buildAffixMatchers,
  scorePool,
  scoreItemPools,
  scoreMonograms,
  getMonogramCounts,
  filterByModel,
} from '../src/utils/itemFilter.js';
import { createFilterModel } from '../src/models/FilterModel.js';

// Helper: create an Item model with affix pools and monograms
function createItem(displayName, pools = {}, monograms = []) {
  return {
    id: `test-${displayName}`,
    rowName: displayName,
    displayName,
    type: 'Armor Helmet',
    rarity: 0,
    tier: 1,
    specks: 0,
    isLocked: false,
    isGenerated: false,
    stackCount: 1,
    charges: 0,
    baseStats: [],
    affixPools: {
      inherent: [],
      pool1: (pools.pool1 || []).map(rn => ({ rowName: rn, dataTable: '' })),
      pool2: (pools.pool2 || []).map(rn => ({ rowName: rn, dataTable: '' })),
      pool3: (pools.pool3 || []).map(rn => ({ rowName: rn, dataTable: '' })),
    },
    upgradeCount: 0,
    monograms: monograms.map(id => ({ id, value: 1, rawTag: `EasyRPG.Items.Modifiers.${id}` })),
  };
}

describe('itemFilter', () => {
  describe('buildAffixMatchers', () => {
    it('should build matchers from stat registry affix IDs', () => {
      const matchers = buildAffixMatchers([{ affixId: 'strength' }]);
      expect(matchers.length).toBe(1);
      expect(matchers[0].affixId).toBe('strength');
      expect(matchers[0].patterns.length).toBeGreaterThan(0);
    });

    it('should return empty patterns for unknown affix IDs', () => {
      const matchers = buildAffixMatchers([{ affixId: 'nonexistent_affix_xyz' }]);
      expect(matchers[0].patterns).toEqual([]);
    });

    it('should handle multiple affixes', () => {
      const matchers = buildAffixMatchers([
        { affixId: 'strength' },
        { affixId: 'critChance' },
      ]);
      expect(matchers.length).toBe(2);
    });
  });

  describe('scorePool', () => {
    it('should count matching affixes in a pool', () => {
      const matchers = buildAffixMatchers([
        { affixId: 'strength' },
        { affixId: 'vitality' },
      ]);
      // Pool contains rowNames that should match stat patterns
      const poolAffixes = [
        { rowName: 'Characteristics.Strength', dataTable: '' },
        { rowName: 'CriticalChance', dataTable: '' },
      ];

      const result = scorePool(poolAffixes, matchers);
      expect(result.count).toBe(1); // Only Strength matches
      expect(result.matchedAffixIds).toContain('strength');
    });

    it('should return 0 for empty pool', () => {
      const matchers = buildAffixMatchers([{ affixId: 'strength' }]);
      const result = scorePool([], matchers);
      expect(result.count).toBe(0);
      expect(result.matchedAffixIds).toEqual([]);
    });

    it('should return 0 for empty matchers', () => {
      const poolAffixes = [{ rowName: 'Strength', dataTable: '' }];
      const result = scorePool(poolAffixes, []);
      expect(result.count).toBe(0);
    });
  });

  describe('scoreItemPools', () => {
    it('should score each pool separately', () => {
      const matchers = buildAffixMatchers([
        { affixId: 'strength' },
      ]);

      const item = createItem('TestItem', {
        pool1: ['Strength'],
        pool2: ['CriticalChance'],
        pool3: ['Strength'],
      });

      const scores = scoreItemPools(item, matchers);
      expect(scores.s1).toBe(1);
      expect(scores.s2).toBe(0);
      expect(scores.s3).toBe(1);
      expect(scores.total).toBe(2);
    });

    it('should handle items with no pools', () => {
      const matchers = buildAffixMatchers([{ affixId: 'strength' }]);
      const item = createItem('EmptyItem');

      const scores = scoreItemPools(item, matchers);
      expect(scores.s1).toBe(0);
      expect(scores.s2).toBe(0);
      expect(scores.s3).toBe(0);
      expect(scores.total).toBe(0);
    });
  });

  describe('scoreMonograms', () => {
    it('should identify matched monograms', () => {
      const item = createItem('MonoItem', {}, ['Bloodlust.Base', 'AllowPhasing']);
      const criteria = [
        { monogramId: 'Bloodlust.Base' },
        { monogramId: 'Veil' },
      ];

      const result = scoreMonograms(item, criteria);
      expect(result.matched).toEqual(['Bloodlust.Base']);
      expect(result.missing).toEqual(['Veil']);
    });

    it('should return empty when no criteria', () => {
      const item = createItem('MonoItem', {}, ['Bloodlust.Base']);
      const result = scoreMonograms(item, []);
      expect(result.matched).toEqual([]);
      expect(result.missing).toEqual([]);
    });

    it('should return all missing when item has no monograms', () => {
      const item = createItem('NoMonoItem');
      const criteria = [{ monogramId: 'Bloodlust.Base' }];
      const result = scoreMonograms(item, criteria);
      expect(result.matched).toEqual([]);
      expect(result.missing).toEqual(['Bloodlust.Base']);
    });

    it('should return totalCount of monograms on item', () => {
      const item = createItem('ThreeMono', {}, ['A', 'B', 'C']);
      const result = scoreMonograms(item, []);
      expect(result.totalCount).toBe(3);
    });

    it('should respect minCount for specific monogram', () => {
      const item = createItem('DoubleMono', {}, ['Bloodlust.Base', 'Bloodlust.Base', 'AllowPhasing']);
      const criteria = [
        { monogramId: 'Bloodlust.Base', minCount: 2 },
      ];
      const result = scoreMonograms(item, criteria);
      expect(result.matched).toEqual(['Bloodlust.Base']);
      expect(result.missing).toEqual([]);
    });

    it('should fail minCount when item has fewer instances', () => {
      const item = createItem('SingleMono', {}, ['Bloodlust.Base']);
      const criteria = [
        { monogramId: 'Bloodlust.Base', minCount: 2 },
      ];
      const result = scoreMonograms(item, criteria);
      expect(result.matched).toEqual([]);
      expect(result.missing).toEqual(['Bloodlust.Base']);
    });

    it('should treat null minCount as 1', () => {
      const item = createItem('OneMono', {}, ['Bloodlust.Base']);
      const criteria = [
        { monogramId: 'Bloodlust.Base', minCount: null },
      ];
      const result = scoreMonograms(item, criteria);
      expect(result.matched).toEqual(['Bloodlust.Base']);
    });
  });

  describe('getMonogramCounts', () => {
    it('should count duplicate monogram IDs', () => {
      const item = createItem('Dupes', {}, ['Bloodlust.Base', 'Bloodlust.Base', 'AllowPhasing']);
      const counts = getMonogramCounts(item);
      expect(counts.get('Bloodlust.Base')).toBe(2);
      expect(counts.get('AllowPhasing')).toBe(1);
    });

    it('should return empty map for item with no monograms', () => {
      const item = createItem('Empty');
      const counts = getMonogramCounts(item);
      expect(counts.size).toBe(0);
    });
  });

  describe('filterByModel', () => {
    it('should classify items as hits when all pools have min hits', () => {
      const model = {
        ...createFilterModel('Test'),
        affixes: [{ affixId: 'strength' }],
        monograms: [],
      };

      const items = [
        createItem('AllPools', {
          pool1: ['Strength'],
          pool2: ['Strength'],
          pool3: ['Strength'],
        }),
        createItem('TwoPools', {
          pool1: ['Strength'],
          pool2: [],
          pool3: ['Strength'],
        }),
      ];

      const result = filterByModel(items, model);
      expect(result.hits.length).toBe(1);
      expect(result.hits[0].displayName).toBe('AllPools');
    });

    it('should classify items as close (near miss) when total >= closeMinTotal', () => {
      const model = {
        ...createFilterModel('Test'),
        affixes: [{ affixId: 'strength' }],
        monograms: [],
        options: { minHitsPerPool: 1, closeMinTotal: 2, includeWeapons: true },
      };

      const items = [
        createItem('TwoPools', {
          pool1: ['Strength'],
          pool2: [],
          pool3: ['Strength'],
        }),
      ];

      const result = filterByModel(items, model);
      expect(result.hits.length).toBe(0);
      expect(result.close.length).toBe(1);
      expect(result.close[0].displayName).toBe('TwoPools');
    });

    it('should classify as hit when only monograms are specified', () => {
      const model = {
        ...createFilterModel('MonoOnly'),
        affixes: [],
        monograms: [{ monogramId: 'Bloodlust.Base' }],
      };

      const items = [
        createItem('HasBloodlust', {}, ['Bloodlust.Base']),
        createItem('NoBloodlust', {}, ['AllowPhasing']),
      ];

      const result = filterByModel(items, model);
      expect(result.hits.length).toBe(1);
      expect(result.hits[0].displayName).toBe('HasBloodlust');
      // NoBloodlust has pools pass (no affix criteria) but mono missing
      expect(result.close.length).toBe(1);
      expect(result.close[0].monoMissing).toEqual(['Bloodlust.Base']);
    });

    it('should combine affix and monogram criteria', () => {
      const model = {
        ...createFilterModel('Combined'),
        affixes: [{ affixId: 'strength' }],
        monograms: [{ monogramId: 'Bloodlust.Base' }],
      };

      const items = [
        createItem('Both', {
          pool1: ['Strength'],
          pool2: ['Strength'],
          pool3: ['Strength'],
        }, ['Bloodlust.Base']),
        createItem('AffixOnly', {
          pool1: ['Strength'],
          pool2: ['Strength'],
          pool3: ['Strength'],
        }),
      ];

      const result = filterByModel(items, model);
      expect(result.hits.length).toBe(1);
      expect(result.hits[0].displayName).toBe('Both');
      // AffixOnly passes pools but missing monogram → close
      expect(result.close.length).toBe(1);
      expect(result.close[0].displayName).toBe('AffixOnly');
    });

    it('should return totalItems count', () => {
      const model = createFilterModel('Empty');
      const items = [
        createItem('A'),
        createItem('B'),
        createItem('C'),
      ];

      const result = filterByModel(items, model);
      expect(result.totalItems).toBe(3);
    });

    it('should exclude weapons when includeWeapons is false', () => {
      const model = {
        ...createFilterModel('NoWeapons'),
        affixes: [],
        monograms: [],
        options: { minHitsPerPool: 1, closeMinTotal: 2, includeWeapons: false },
      };

      const items = [
        {
          ...createItem('Sword'),
          type: 'Weapon Sword',
        },
        createItem('Helmet'),
      ];

      const result = filterByModel(items, model);
      // With no criteria, all pass as hits (pools pass vacuously)
      expect(result.hits.length).toBe(1);
      expect(result.hits[0].displayName).toBe('Helmet');
    });

    it('should add pool match details to scored items', () => {
      const model = {
        ...createFilterModel('Details'),
        affixes: [{ affixId: 'strength' }],
        monograms: [{ monogramId: 'Bloodlust.Base' }],
      };

      const items = [
        createItem('Detailed', {
          pool1: ['Strength'],
          pool2: ['Strength'],
          pool3: ['Strength'],
        }, ['Bloodlust.Base']),
      ];

      const result = filterByModel(items, model);
      const hit = result.hits[0];
      expect(hit.s1).toBe(1);
      expect(hit.s2).toBe(1);
      expect(hit.s3).toBe(1);
      expect(hit.poolMatches).toBeDefined();
      expect(hit.monoMatched).toEqual(['Bloodlust.Base']);
      expect(hit.monoMissing).toEqual([]);
    });

    it('should enforce minTotalMonograms', () => {
      const model = {
        ...createFilterModel('MinTotal'),
        affixes: [],
        monograms: [],
        options: { minHitsPerPool: 1, closeMinTotal: 2, includeWeapons: true, minTotalMonograms: 2 },
      };

      const items = [
        createItem('TwoMonos', {}, ['Bloodlust.Base', 'AllowPhasing']),
        createItem('OneMono', {}, ['Bloodlust.Base']),
        createItem('NoMono'),
      ];

      const result = filterByModel(items, model);
      // Only TwoMonos has >= 2 total monograms
      expect(result.hits.length).toBe(1);
      expect(result.hits[0].displayName).toBe('TwoMonos');
      // OneMono has pool pass but mono total fail → close
      expect(result.close.length).toBe(1);
      expect(result.close[0].displayName).toBe('OneMono');
    });

    it('should enforce minCount on specific monograms via filterByModel', () => {
      const model = {
        ...createFilterModel('DoubleBloodlust'),
        affixes: [],
        monograms: [{ monogramId: 'Bloodlust.Base', minCount: 2 }],
      };

      const items = [
        createItem('DoubleBlood', {}, ['Bloodlust.Base', 'Bloodlust.Base']),
        createItem('SingleBlood', {}, ['Bloodlust.Base']),
      ];

      const result = filterByModel(items, model);
      expect(result.hits.length).toBe(1);
      expect(result.hits[0].displayName).toBe('DoubleBlood');
      // SingleBlood pools pass but mono fails → close
      expect(result.close.length).toBe(1);
      expect(result.close[0].displayName).toBe('SingleBlood');
    });

    it('should include monoTotalCount in scored items', () => {
      const model = createFilterModel('CountCheck');
      const items = [createItem('ThreeMonos', {}, ['A', 'B', 'C'])];

      const result = filterByModel(items, model);
      expect(result.hits[0].monoTotalCount).toBe(3);
    });
  });
});
