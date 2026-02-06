import { describe, it, expect } from 'vitest';
import {
  compilePatterns,
  countHits,
  scoreItemPools,
  filterInventoryItems,
  itemMatchesAnyPattern,
} from '../src/utils/itemFilter.js';

describe('itemFilter', () => {
  describe('compilePatterns', () => {
    it('should pass through RegExp objects unchanged', () => {
      const regex = /test/i;
      const result = compilePatterns([regex]);
      expect(result[0]).toBe(regex);
    });

    it('should convert wildcard strings to regex', () => {
      const result = compilePatterns(['Fiery*Damage']);
      expect(result[0].test('FieryTotemDamage')).toBe(true);
      expect(result[0].test('FieryBoltDamage')).toBe(true);
      expect(result[0].test('ColdDamage')).toBe(false);
    });

    it('should be case insensitive', () => {
      const result = compilePatterns(['wisdom']);
      expect(result[0].test('Wisdom')).toBe(true);
      expect(result[0].test('WISDOM')).toBe(true);
      expect(result[0].test('wisdom')).toBe(true);
    });

    it('should handle multiple patterns', () => {
      const result = compilePatterns(['Strength', 'Vitality', 'Critical*']);
      expect(result.length).toBe(3);
    });
  });

  describe('countHits', () => {
    it('should count matching attributes', () => {
      const attrs = ['Strength', 'Vitality', 'CriticalChance', 'Armor'];
      const patterns = compilePatterns(['Strength', 'Critical*']);

      const hits = countHits(attrs, patterns);
      expect(hits).toBe(2); // Strength and CriticalChance
    });

    it('should count each attribute only once', () => {
      const attrs = ['CriticalChance'];
      const patterns = compilePatterns(['Crit*', 'Critical*', '*Chance']);

      const hits = countHits(attrs, patterns);
      expect(hits).toBe(1); // Only count once even though multiple patterns match
    });

    it('should return 0 for empty arrays', () => {
      expect(countHits([], compilePatterns(['test']))).toBe(0);
      expect(countHits(['test'], [])).toBe(0);
    });

    it('should return 0 for non-array input', () => {
      expect(countHits(null, compilePatterns(['test']))).toBe(0);
      expect(countHits(undefined, compilePatterns(['test']))).toBe(0);
    });
  });

  describe('scoreItemPools', () => {
    it('should score each pool separately', () => {
      const item = {
        item: {
          pool1_attributes: ['Strength', 'Vitality'],
          pool2_attributes: ['CriticalChance'],
          pool3_attributes: ['Armor', 'Health'],
        },
      };
      const patterns = compilePatterns(['Strength', 'Critical*', 'Health']);

      const scores = scoreItemPools(item, patterns);

      expect(scores.s1).toBe(1); // Strength
      expect(scores.s2).toBe(1); // CriticalChance
      expect(scores.s3).toBe(1); // Health
      expect(scores.total).toBe(3);
    });

    it('should handle missing pool attributes', () => {
      const item = { item: {} };
      const patterns = compilePatterns(['test']);

      const scores = scoreItemPools(item, patterns);

      expect(scores.s1).toBe(0);
      expect(scores.s2).toBe(0);
      expect(scores.s3).toBe(0);
      expect(scores.total).toBe(0);
    });
  });

  describe('filterInventoryItems', () => {
    const createItem = (name, pool1 = [], pool2 = [], pool3 = []) => ({
      name,
      item: {
        pool1_attributes: pool1,
        pool2_attributes: pool2,
        pool3_attributes: pool3,
      },
    });

    it('should classify items as hits when all pools have minHits', () => {
      const items = [
        createItem('Item1', ['Strength'], ['Vitality'], ['Armor']),
        createItem('Item2', ['Strength'], [], ['Armor']), // Missing pool2
      ];
      const patterns = ['Strength', 'Vitality', 'Armor'];

      const result = filterInventoryItems(items, patterns, { minHits: 1 });

      expect(result.hits.length).toBe(1);
      expect(result.hits[0].name).toBe('Item1');
    });

    it('should classify items as close when total >= closeMinTotal but not full match', () => {
      const items = [
        createItem('PartialMatch', ['Strength', 'Vitality'], [], []),
      ];
      const patterns = ['Strength', 'Vitality'];

      const result = filterInventoryItems(items, patterns, {
        minHits: 1,
        closeMinTotal: 2,
      });

      expect(result.hits.length).toBe(0);
      expect(result.close.length).toBe(1);
      expect(result.close[0].name).toBe('PartialMatch');
    });

    it('should return totalItems count', () => {
      const items = [
        createItem('Item1', [], [], []),
        createItem('Item2', [], [], []),
        createItem('Item3', [], [], []),
      ];

      const result = filterInventoryItems(items, ['test']);

      expect(result.totalItems).toBe(3);
    });

    it('should add scores to matched items', () => {
      const items = [
        createItem('Item1', ['A', 'B'], ['C'], ['D', 'E']),
      ];
      const patterns = ['A', 'C', 'D'];

      const result = filterInventoryItems(items, patterns, { minHits: 1 });

      expect(result.hits[0].s1).toBe(1);
      expect(result.hits[0].s2).toBe(1);
      expect(result.hits[0].s3).toBe(1);
      expect(result.hits[0].total).toBe(3);
    });
  });

  describe('itemMatchesAnyPattern', () => {
    it('should return true when any attribute matches', () => {
      const item = {
        item: {
          all_attributes: ['Strength', 'Vitality', 'Armor'],
        },
      };
      const patterns = compilePatterns(['Wisdom', 'Vitality']);

      expect(itemMatchesAnyPattern(item, patterns)).toBe(true);
    });

    it('should return false when no attributes match', () => {
      const item = {
        item: {
          all_attributes: ['Strength', 'Armor'],
        },
      };
      const patterns = compilePatterns(['Wisdom', 'Vitality']);

      expect(itemMatchesAnyPattern(item, patterns)).toBe(false);
    });

    it('should return true when pattern list is empty', () => {
      const item = { item: { all_attributes: ['Strength'] } };
      expect(itemMatchesAnyPattern(item, [])).toBe(true);
    });
  });
});
