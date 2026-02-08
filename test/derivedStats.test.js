import { describe, it, expect } from 'vitest';
import {
  LAYERS,
  DERIVED_STATS,
  calculateDerivedStats,
  calculateDerivedStatsDetailed,
  getCalculationOrder,
  getStatsByLayer,
  getDependencyChain,
} from '../src/utils/derivedStats.js';
import { extractEquippedItems } from '../src/utils/equipmentParser.js';
import fixtureData from './fixtures/dr-full-inventory.json';

describe('derivedStats', () => {
  describe('LAYERS', () => {
    it('should define all required layers in order', () => {
      expect(LAYERS.BASE).toBe(0);
      expect(LAYERS.TOTALS).toBe(1);
      expect(LAYERS.PRIMARY_DERIVED).toBe(2);
      expect(LAYERS.SECONDARY_DERIVED).toBe(3);
      expect(LAYERS.TERTIARY_DERIVED).toBe(4);
    });
  });

  describe('getStatsByLayer', () => {
    it('should group stats by their layer', () => {
      const byLayer = getStatsByLayer();

      expect(byLayer[LAYERS.TOTALS]).toBeDefined();
      expect(Array.isArray(byLayer[LAYERS.TOTALS])).toBe(true);

      // Check that totalStrength is in TOTALS layer
      const totalsLayer = byLayer[LAYERS.TOTALS];
      const totalStrength = totalsLayer.find(s => s.id === 'totalStrength');
      expect(totalStrength).toBeDefined();
    });
  });

  describe('getCalculationOrder', () => {
    it('should return stats in layer order', () => {
      const order = getCalculationOrder();

      expect(Array.isArray(order)).toBe(true);
      expect(order.length).toBeGreaterThan(0);

      // Verify layer ordering - each stat should be in same or higher layer than previous
      let lastLayer = -1;
      for (const stat of order) {
        expect(stat.layer).toBeGreaterThanOrEqual(lastLayer);
        if (stat.layer > lastLayer) {
          lastLayer = stat.layer;
        }
      }
    });

    it('should place totalStrength before stats that depend on it', () => {
      const order = getCalculationOrder();
      const ids = order.map(s => s.id);

      const strengthIdx = ids.indexOf('totalStrength');
      const highestAttrIdx = ids.indexOf('highestAttribute');

      // highestAttribute depends on totalStrength
      expect(strengthIdx).toBeLessThan(highestAttrIdx);
    });
  });

  describe('calculateDerivedStats', () => {
    it('should calculate total stats with bonus percentages', () => {
      const baseStats = {
        strength: 100,
        strengthBonus: 50, // +50%
      };

      const result = calculateDerivedStats(baseStats);

      expect(result.totalStrength).toBe(150); // 100 * 1.5
    });

    it('should calculate highestAttribute correctly', () => {
      const baseStats = {
        strength: 100,
        strengthBonus: 0,
        dexterity: 200,
        dexterityBonus: 0,
        wisdom: 150,
        wisdomBonus: 0,
        vitality: 50,
        vitalityBonus: 0,
        endurance: 0,
        agility: 0,
        luck: 0,
        stamina: 0,
      };

      const result = calculateDerivedStats(baseStats);

      expect(result.highestAttribute).toBe(200); // dexterity is highest
    });

    it('should handle missing base stats gracefully', () => {
      const baseStats = {};
      const result = calculateDerivedStats(baseStats);

      expect(result.totalStrength).toBe(0);
      expect(result.highestAttribute).toBe(0);
    });

    it('should respect config overrides', () => {
      const baseStats = {
        strength: 100,
        strengthBonus: 0,
      };

      // Override phasingStacks to be enabled
      const configOverrides = {
        phasingStacks: {
          enabled: true,
          maxStacks: 50,
          currentStacks: 25,
        },
      };

      const result = calculateDerivedStats(baseStats, configOverrides);

      expect(result.phasingStacks).toBe(25);
      expect(result.phasingDamageBonus).toBe(25); // 1% per stack
    });
  });

  describe('Monogram buff calculations', () => {
    it('should calculate Phasing stacks and bonuses when enabled', () => {
      const baseStats = {};
      const config = {
        phasingStacks: { enabled: true, maxStacks: 50, currentStacks: 50 },
      };

      const result = calculateDerivedStats(baseStats, config);

      expect(result.phasingStacks).toBe(50);
      expect(result.phasingDamageBonus).toBe(50); // 1% per stack
      expect(result.phasingBossDamageBonus).toBe(25); // 0.5% per stack
    });

    it('should calculate Bloodlust stacks and bonuses when enabled', () => {
      const baseStats = {};
      const config = {
        bloodlustStacks: { enabled: true, maxStacks: 100, currentStacks: 100 },
      };

      const result = calculateDerivedStats(baseStats, config);

      expect(result.bloodlustStacks).toBe(100);
      expect(result.bloodlustCritDamageBonus).toBe(500); // 5% per stack
      expect(result.bloodlustAttackSpeedBonus).toBe(300); // 3% per stack
      expect(result.bloodlustMoveSpeedBonus).toBe(100); // 1% per stack
    });

    it('should calculate Dark Essence and derived chain', () => {
      const baseStats = {
        strength: 1000,
        strengthBonus: 0,
        dexterity: 0,
        wisdom: 0,
        vitality: 0,
        endurance: 0,
        agility: 0,
        luck: 0,
        stamina: 0,
      };

      const config = {
        darkEssenceStacks: { enabled: true, maxStacks: 500, currentStacks: 500 },
        critChanceFromEssence: { enabled: true, essencePerCrit: 20 },
      };

      const result = calculateDerivedStats(baseStats, config);

      // highestAttribute = 1000 (strength)
      expect(result.highestAttribute).toBe(1000);

      // essence = highestAttribute * 1.25 at 500 stacks
      expect(result.essence).toBe(1250);

      // critChanceFromEssence = essence / 20 = 62%
      expect(result.critChanceFromEssence).toBe(62);
    });

    it('should return 0 for disabled monograms', () => {
      const baseStats = {};
      const result = calculateDerivedStats(baseStats);

      expect(result.phasingStacks).toBe(0);
      expect(result.bloodlustStacks).toBe(0);
      expect(result.darkEssenceStacks).toBe(0);
    });
  });

  describe('calculateDerivedStatsDetailed', () => {
    it('should return formatted stat details', () => {
      const baseStats = { strength: 100, strengthBonus: 25 };
      const result = calculateDerivedStatsDetailed(baseStats);

      expect(result.values.totalStrength).toBe(125);
      expect(result.detailed).toBeDefined();
      expect(result.byCategory).toBeDefined();
      expect(result.byLayer).toBeDefined();

      const strengthDetail = result.detailed.find(s => s.id === 'totalStrength');
      expect(strengthDetail.formattedValue).toBe('125');
    });
  });

  describe('getDependencyChain', () => {
    it('should return dependency chain for chained stats', () => {
      const chain = getDependencyChain('phasingDamageBonus');

      expect(chain).toContain('phasingStacks');
      expect(chain).toContain('phasingDamageBonus');

      // phasingStacks should come before phasingDamageBonus
      const stacksIdx = chain.indexOf('phasingStacks');
      const bonusIdx = chain.indexOf('phasingDamageBonus');
      expect(stacksIdx).toBeLessThan(bonusIdx);
    });

    it('should return single-item array for base stats', () => {
      const chain = getDependencyChain('strength');
      expect(chain).toEqual(['strength']);
    });
  });

  describe('Item model integration', () => {
    it('should extract items from fixture with baseStats', () => {
      // Fixture structure is { header, root, extra } - extractEquippedItems expects the whole object
      const items = extractEquippedItems(fixtureData);

      expect(items.length).toBeGreaterThan(0);

      // Verify items have the expected Item model format
      const firstItem = items[0];
      expect(firstItem).toHaveProperty('rowName');
      expect(firstItem).toHaveProperty('displayName');
      expect(firstItem).toHaveProperty('baseStats');
      expect(firstItem).toHaveProperty('slot');
      expect(Array.isArray(firstItem.baseStats)).toBe(true);
    });

    it('should have baseStats with stat/value/rawTag format', () => {
      const items = extractEquippedItems(fixtureData);

      // Find an item with stats
      const itemWithStats = items.find(i => i.baseStats && i.baseStats.length > 0);
      expect(itemWithStats).toBeDefined();

      const stat = itemWithStats.baseStats[0];
      expect(stat).toHaveProperty('stat');
      expect(stat).toHaveProperty('value');
      expect(typeof stat.value).toBe('number');
    });

    it('should correctly aggregate stats from Item model format', () => {
      const items = extractEquippedItems(fixtureData);

      // Mock simple aggregation similar to useDerivedStats
      const stats = {};
      for (const item of items) {
        if (!item.baseStats) continue;
        for (const stat of item.baseStats) {
          const key = stat.stat || stat.rawTag?.split('.').pop();
          if (key && stat.value) {
            stats[key] = (stats[key] || 0) + stat.value;
          }
        }
      }

      // Should have aggregated some stats
      expect(Object.keys(stats).length).toBeGreaterThan(0);

      // Log for debugging
      console.log('Aggregated stats sample:', Object.entries(stats).slice(0, 5));
    });
  });
});
