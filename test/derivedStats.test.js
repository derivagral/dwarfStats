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
        strengthBonus: 0.50, // 0.50 = +50% (save file stores as decimal)
      };

      const result = calculateDerivedStats(baseStats);

      expect(result.totalStrength).toBe(150); // 100 * (1 + 0.50) = 150
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

    it('should calculate totalLuck with bonus correctly', () => {
      const baseStats = {
        luck: 80,
        luckBonus: 0.50, // 0.50 = +50% (save file stores as decimal)
      };

      const result = calculateDerivedStats(baseStats);

      // 80 * (1 + 0.50) = 80 * 1.5 = 120
      expect(result.totalLuck).toBe(120);
    });

    it('should calculate totalLuck without bonus', () => {
      const baseStats = {
        luck: 100,
        luckBonus: 0,
      };

      const result = calculateDerivedStats(baseStats);

      expect(result.totalLuck).toBe(100);
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
      const baseStats = { strength: 100, strengthBonus: 0.25 };
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

  describe('eDPS calculations', () => {
    it('should calculate FLAT damage from gear + STR', () => {
      const baseStats = {
        damage: 100,
        damageBonus: 0,
        strength: 200,
        strengthBonus: 0.50, // 50% bonus → totalStrength = 300
      };
      const result = calculateDerivedStats(baseStats);

      // totalDamage = 100 * (1 + 0) = 100
      // totalStrength = 200 * 1.5 = 300
      // FLAT = totalDamage + STR = 100 + 300 = 400
      expect(result.edpsFlat).toBe(400);
    });

    it('should build additive multiplier bucket (CHD + DB + SD)', () => {
      const baseStats = {
        critDamage: 1.50,      // 150% crit damage
        damageBonus: 0.30,     // 30% damage bonus (raw from gear, not consumed by totalDamage)
        maulDamage: 0.50,      // 50% stance damage
      };
      const result = calculateDerivedStats(baseStats);

      // CHD (1.50) + DB (0.30) + SD (0.50) = 2.30
      expect(result.edpsAdditiveMulti).toBeCloseTo(2.30, 2);
    });

    it('should auto-detect stance from highest stance stat', () => {
      const baseStats = {
        critDamage: 1.0,
        swordDamage: 0.20,
        maulDamage: 0.80,  // highest → picked as SD
      };
      const result = calculateDerivedStats(baseStats);

      // CHD (1.0) + SD (0.80) = 1.80
      expect(result.edpsAdditiveMulti).toBeCloseTo(1.80, 2);
    });

    it('should calculate SCHD as standalone multiplier', () => {
      const baseStats = {
        maulCritDamage: 2.0,  // 200% stance crit damage
      };
      const result = calculateDerivedStats(baseStats);

      // SCHD = 1 + 2.0 = 3.0 (300%)
      expect(result.edpsSCHD).toBeCloseTo(3.0, 2);
    });

    it('should include bloodlust crit damage in SCHD', () => {
      const baseStats = {
        swordCritDamage: 1.0,
      };
      const config = {
        bloodlustStacks: { enabled: true, maxStacks: 100, currentStacks: 100 },
      };
      const result = calculateDerivedStats(baseStats, config);

      // bloodlustCritDamageBonus = 100 * 5 = 500 → 5.0 decimal
      // SCHD = 1 + swordCrit(1.0) + bloodlust(5.0) = 7.0
      expect(result.edpsSCHD).toBeCloseTo(7.0, 2);
    });

    it('should default WAD to 200% for primary', () => {
      const result = calculateDerivedStats({});
      expect(result.edpsWAD).toBeCloseTo(2.0, 2);
    });

    it('should use 400% WAD for secondary when configured', () => {
      const config = {
        edpsWAD: { primaryBase: 2.0, secondaryBase: 4.0, useSecondary: true, wadBonus: 0 },
      };
      const result = calculateDerivedStats({}, config);
      expect(result.edpsWAD).toBeCloseTo(4.0, 2);
    });

    it('should calculate EMulti as product of independent multipliers', () => {
      const config = {
        edpsEMulti: { classWeaponBonus: 0.50 }, // 50% class bonus
        distanceProcsDamageBonus: { enabled: true, bonusPercent: 50 },
      };
      const result = calculateDerivedStats({}, config);

      // classWeapon: 1.50, distance: 1.50 → 1.50 * 1.50 = 2.25
      expect(result.edpsEMulti).toBeCloseTo(2.25, 2);
    });

    it('should calculate boss damage multiplier', () => {
      const baseStats = {
        bossBonus: 0.80, // 80% boss damage from gear
      };
      const config = {
        phasingStacks: { enabled: true, maxStacks: 50, currentStacks: 50 },
      };
      const result = calculateDerivedStats(baseStats, config);

      // BD = 1 + 0.80 + (25 / 100) = 1 + 0.80 + 0.25 = 2.05
      expect(result.edpsBD).toBeCloseTo(2.05, 2);
    });

    it('should calculate elemental damage multiplier', () => {
      const baseStats = {
        fireDamageBonus: 0.50,       // 50% fire
        lightningDamageBonus: 0.30,  // 30% lightning
      };
      const result = calculateDerivedStats(baseStats);

      // ED = 1 + 0.50 + 0.30 = 1.80
      expect(result.edpsED).toBeCloseTo(1.80, 2);
    });

    it('should calculate full eDPS chain for normal mobs', () => {
      const baseStats = {
        damage: 50,
        damageBonus: 0,
        strength: 100,
        strengthBonus: 0,
        critDamage: 1.0,       // 100% crit damage
        maulDamage: 0.50,      // 50% stance damage
        maulCritDamage: 0.50,  // 50% stance crit damage
      };

      const result = calculateDerivedStats(baseStats);

      // FLAT = totalDamage(50) + STR(100) = 150
      expect(result.edpsFlat).toBe(150);
      // Additive = CHD(1.0) + SD(0.50) = 1.50
      expect(result.edpsAdditiveMulti).toBeCloseTo(1.50, 2);
      // SCHD = 1 + 0.50 = 1.50
      expect(result.edpsSCHD).toBeCloseTo(1.50, 2);
      // WAD = 2.0 (default primary)
      expect(result.edpsWAD).toBeCloseTo(2.0, 2);
      // EMulti = 1.0 (nothing active)
      expect(result.edpsEMulti).toBeCloseTo(1.0, 2);
      // DD = 150 * 1.50 * 1.50 * 2.0 * 1.0 = 675
      expect(result.edpsDDNormal).toBe(675);
    });

    it('should calculate boss DD as normal DD × BD', () => {
      const baseStats = {
        damage: 100,
        damageBonus: 0,
        strength: 0,
        strengthBonus: 0,
        critDamage: 1.0,
        bossBonus: 1.0, // 100% boss damage
      };
      const result = calculateDerivedStats(baseStats);

      // FLAT = 100, Additive = 1.0, SCHD = 1.0, WAD = 2.0, EMulti = 1.0
      // DDNormal = 100 * 1.0 * 1.0 * 2.0 * 1.0 = 200
      // BD = 1 + 1.0 = 2.0
      // DDBoss = 200 * 2.0 = 400
      expect(result.edpsDDNormal).toBe(200);
      expect(result.edpsDDBoss).toBe(400);
    });

    it('should calculate offhand damage with elemental multiplier', () => {
      const baseStats = {
        damage: 100,
        damageBonus: 0,
        strength: 0,
        strengthBonus: 0,
        critDamage: 1.0,
        fireDamageBonus: 1.0,  // 100% fire
      };
      const config = {
        edpsAD: { abilityDamage: 1.5, affinityDamage: 0.5 }, // AD + AFFIN = 2.0
      };
      const result = calculateDerivedStats(baseStats, config);

      // DDNormal = 100 * 1.0 * 1.0 * 2.0 * 1.0 = 200
      // AD = 1.5 + 0.5 = 2.0
      // ED = 1 + 1.0 = 2.0
      // Offhand = 200 * 2.0 * 2.0 = 800
      expect(result.edpsDDNormal).toBe(200);
      expect(result.edpsOffhandNormal).toBe(800);
    });
  });
});
