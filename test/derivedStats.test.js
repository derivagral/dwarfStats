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
import { extractEquippedItems, inferWeaponStance } from '../src/utils/equipmentParser.js';
import { findStatForAttribute } from '../src/utils/statRegistry.js';
import fixtureData from './fixtures/dr-full-inventory.json';
import dualBowFixture from './fixtures/chaos-dual-bow-equipped.json';

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
      expect(result.phasingDamageBonus).toBe(37.5); // 1.5% per stack (both types)
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
      expect(result.phasingDamageBonus).toBe(75); // 1.5% per stack (both types)
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

  describe('eDPS calculations (ele/phys split)', () => {
    it('edpsPhysFlat uses raw Base.Damage (damage bonus% does NOT double-count)', () => {
      const result = calculateDerivedStats({ damage: 100, damageBonus: 0.5, strength: 200, strengthBonus: 0.5 });
      // Raw flat only — the 50% damage bonus lives in the additive bucket.
      expect(result.edpsPhysFlat).toBe(100);
    });

    it('edpsElemFlat uses Base.ElementalDamage flat', () => {
      const result = calculateDerivedStats({ damage: 100, elementalDamage: 60 });
      expect(result.edpsPhysFlat).toBe(100);
      expect(result.edpsElemFlat).toBe(60);
    });

    it('edpsPhysAdditive merges Stance Crit into the additive bucket (no standalone SCHD)', () => {
      const result = calculateDerivedStats({
        critDamage: 1.5,      // 150% crit damage
        damageBonus: 0.3,     // 30% physical damage bonus
        maulDamage: 0.5,      // 50% stance damage
        maulCritDamage: 2.0,  // 200% stance crit damage (now additive, not standalone)
      });
      // 1.5 + 0.3 + 0.5 + 2.0 = 4.30
      expect(result.edpsPhysAdditive).toBeCloseTo(4.30, 2);
      // No edpsSCHD stat exists anymore
      expect(result.edpsSCHD).toBeUndefined();
    });

    it('both-types damage% feeds the physical additive bucket', () => {
      const config = { phasingStacks: { enabled: true, maxStacks: 50, currentStacks: 50 } };
      const result = calculateDerivedStats({ critDamage: 1.0 }, config);
      // phasing: 50 stacks × 1.5% = 75% → 0.75 both-types
      expect(result.edpsBothTypesDamageBonus).toBeCloseTo(0.75, 2);
      // additive = crit(1.0) + both(0.75) = 1.75
      expect(result.edpsPhysAdditive).toBeCloseTo(1.75, 2);
    });

    it('Fire/Arcane/Lightning% feed only the elemental ED multiplier', () => {
      const result = calculateDerivedStats({ fireDamageBonus: 0.5, lightningDamageBonus: 0.3 });
      expect(result.edpsED).toBeCloseTo(1.80, 2);
      // physical additive untouched by elemental %
      expect(result.edpsPhysAdditive).toBeCloseTo(0, 2);
    });

    it('elemental offhand bucket = item offhand% + affinity + both-types (skill mult added per skill)', () => {
      const config = {
        edpsElemAdditive: { offhandItemBonus: 0.2, affinity: 0.5 },
      };
      const result = calculateDerivedStats({ damageMultiplier: 0.3 }, config);
      // 0.3 (items) + 0.2 (manual) + 0.5 (affinity) + 0 (both) = 1.0
      expect(result.edpsElemAdditive).toBeCloseTo(1.0, 2);
    });

    it('boss multiplier combines gear boss% and phasing boss%', () => {
      const config = { phasingStacks: { enabled: true, maxStacks: 50, currentStacks: 50 } };
      const result = calculateDerivedStats({ bossBonus: 0.8 }, config);
      // 1 + 0.8 + (50 × 0.5%/100) = 1 + 0.8 + 0.25 = 2.05
      expect(result.edpsBD).toBeCloseTo(2.05, 2);
    });

    it('physical on-hit per skill uses default multipliers (Left 200%, Q 150%, R 200%)', () => {
      const baseStats = { damage: 150, critDamage: 1.0, maulDamage: 0.5, maulCritDamage: 0.5 };
      const result = calculateDerivedStats(baseStats);
      // additive = crit(1.0) + maulDmg(0.5) + maulCrit(0.5) = 2.0; flat = 150; EMulti = 1
      expect(result.edpsPhysAdditive).toBeCloseTo(2.0, 2);
      // Left = 150 × 2.0 × 2.0 = 600
      expect(result.edpsPhysPrimary).toBe(600);
      // Q = 150 × 2.0 × 1.5 = 450
      expect(result.edpsPhysQ).toBe(450);
      // R = 150 × 2.0 × 2.0 = 600
      expect(result.edpsPhysR).toBe(600);
    });

    it('elemental on-hit adds the per-skill base multiplier into the offhand bucket', () => {
      const baseStats = { elementalDamage: 100, fireDamageBonus: 1.0 };
      const result = calculateDerivedStats(baseStats);
      // ED = 2.0; offhand bucket base = 0; OffhandMods = 1
      // Left: 100 × (0 + 2.0) × 2.0 × 1 = 400
      expect(result.edpsElemPrimary).toBe(400);
      // Q: 100 × (0 + 1.5) × 2.0 = 300
      expect(result.edpsElemQ).toBe(300);
      // R: 100 × (0 + 2.0) × 2.0 = 400
      expect(result.edpsElemR).toBe(400);
    });

    it('uses weapon-configured stance for both stance damage and stance crit', () => {
      const baseStats = {
        critDamage: 1.0,
        maulDamage: 0.8, swordDamage: 0.2,
        maulCritDamage: 2.0, swordCritDamage: 0.5,
      };
      const config = { edpsPhysAdditive: { stance: 'sword' } };
      const result = calculateDerivedStats(baseStats, config);
      // additive = crit(1.0) + swordDmg(0.2) + swordCrit(0.5) = 1.70
      expect(result.edpsPhysAdditive).toBeCloseTo(1.70, 2);
    });

    it('detects weapon stance from row name', () => {
      expect(inferWeaponStance('Equipment_Weapon_Maul_T5')).toBe('maul');
      expect(inferWeaponStance('Equipment_Weapon_Bow_T3')).toBe('archery');
      expect(inferWeaponStance('Equipment_Armor_Head_T5')).toBeNull();
    });

    it('ring Stat Damage (+1 per 75 highest) feeds BOTH flat pools', () => {
      const config = { statDamageFlatBonus: { enabled: true, damagePerInterval: 1, statInterval: 75 } };
      const result = calculateDerivedStats({ damage: 100, elementalDamage: 100, strength: 300 }, config);
      // floor(300 / 75) × 1 = 4
      expect(result.statDamageFlatBonus).toBe(4);
      expect(result.edpsPhysFlat).toBe(104);
      expect(result.edpsElemFlat).toBe(104);
    });

    it('energy-to-elemental monogram feeds elemental flat, not physical', () => {
      const config = { energyDamageBonus: { enabled: true, baseEnergy: 100, damagePerEnergy: 3 } };
      const result = calculateDerivedStats({ damage: 100, elementalDamage: 50, energy: 200 }, config);
      // (200 - 100) × 3 = 300 elemental flat
      expect(result.energyDamageBonus).toBe(300);
      expect(result.edpsElemFlat).toBe(350);
      expect(result.edpsPhysFlat).toBe(100);
    });

    it('per-skill result breakdown surfaces normal and boss on-hit', () => {
      const baseStats = { damage: 100, critDamage: 1.0, bossBonus: 1.0 };
      const values = calculateDerivedStats(baseStats);
      const breakdown = DERIVED_STATS.edpsPhysPrimary.breakdown(values, DERIVED_STATS.edpsPhysPrimary.config);
      const labels = breakdown.map(t => t.label);
      expect(labels).toEqual([
        'BasePhys', 'PhysMult', 'SkillMult', 'EMulti', 'Normal Hit', 'BD', 'Boss Hit',
      ]);
      const normal = breakdown.find(t => t.label === 'Normal Hit');
      const boss = breakdown.find(t => t.label === 'Boss Hit');
      expect(normal.value).toBe(values.edpsPhysPrimary);
      expect(boss.value).toBe(Math.floor(values.edpsPhysPrimary * values.edpsBD));
      for (const term of breakdown) expect(term.fullName).toBeTruthy();
    });
  });

  describe('ele/phys flat resolution (regex guard + real save)', () => {
    it('resolves Base.ElementalDamage to elementalDamage, NOT the generic damage stat', () => {
      // Guard against the `Damage$` regex on the generic `damage` stat claiming
      // `...ElementalDamage` (which also ends in "Damage").
      expect(findStatForAttribute('EasyRPG.Attributes.Base.ElementalDamage').id).toBe('elementalDamage');
      expect(findStatForAttribute('Base.ElementalDamage').id).toBe('elementalDamage');
      expect(findStatForAttribute('ElementalDamage').id).toBe('elementalDamage');
      // And the physical flat still resolves to `damage`.
      expect(findStatForAttribute('EasyRPG.Attributes.Base.Damage').id).toBe('damage');
    });

    it('dual-bow save populates BOTH physical and elemental flat pools', () => {
      // Aggregate equipped base stats through the registry resolver — the same
      // path that would mis-bucket elemental flat if the regex guard regressed.
      const base = {};
      for (const item of dualBowFixture.equipped) {
        for (const s of item.baseStats || []) {
          const def = findStatForAttribute(s.rawTag || s.stat || '');
          if (!def) continue;
          base[def.id] = (base[def.id] || 0) + (s.value || 0);
        }
      }
      // Both flats present on equipped gear for this build.
      expect(base.damage).toBeGreaterThan(0);
      expect(base.elementalDamage).toBeGreaterThan(0);

      const r = calculateDerivedStats(base);
      // Both pipelines produce output, and they draw from their own flat pools.
      expect(r.edpsPhysFlat).toBe(Math.floor(base.damage));
      expect(r.edpsElemFlat).toBe(Math.floor(base.elementalDamage));
      expect(r.edpsPhysPrimary).toBeGreaterThan(0);
      expect(r.edpsElemPrimary).toBeGreaterThan(0);
    });
  });

  describe('eDPS update: attack speed, elemental crit, essence, conversions', () => {
    it('effectiveAttackSpeed applies 50% effectiveness and caps at 300%', () => {
      // Below cap: raw 5.0 × 0.5 = 2.5
      expect(calculateDerivedStats({ attackSpeed: 5.0 }).effectiveAttackSpeed).toBeCloseTo(2.5, 2);
      // Above cap: raw 8.0 × 0.5 = 4.0 → capped at 3.0
      expect(calculateDerivedStats({ attackSpeed: 8.0 }).effectiveAttackSpeed).toBeCloseTo(3.0, 2);
    });

    it('elemental crit bucket folds regular + stance crit damage into the elemental line', () => {
      const base = { elementalDamage: 100, fireDamageBonus: 1.0, critDamage: 1.0, archeryCritDamage: 0.5 };
      const r = calculateDerivedStats(base);
      // ElemCrit = 1 + crit(1.0) + archeryStanceCrit(0.5) = 2.5
      expect(r.edpsElemCrit).toBeCloseTo(2.5, 2);
      // Left elemental = 100 × (0 + 2.0) × ED(2.0) × ElemCrit(2.5) = 1000
      expect(r.edpsElemPrimary).toBe(1000);
    });

    it('damageFromEssence (2% per 10 essence) feeds the both-types bucket via Dark Essence', () => {
      const r = calculateDerivedStats(
        { strength: 400, critDamage: 0 },
        {
          darkEssenceStacks: { enabled: true, maxStacks: 500, currentStacks: 500 },
          damageFromEssence: { enabled: true, percentPerInterval: 2, essenceInterval: 10 },
        }
      );
      expect(r.essence).toBe(500);                 // highest(400) × 1.25
      expect(r.damageFromEssence).toBe(100);       // floor(500/10) × 2
      expect(r.edpsBothTypesDamageBonus).toBeCloseTo(1.0, 2);
    });

    it('elemental→physical FLAT conversion adds 75% of elemental flat and disables elemental', () => {
      const base = { damage: 100, elementalDamage: 80, fireDamageBonus: 1.0, critDamage: 1.0 };
      const r = calculateDerivedStats(base, {
        edpsPhysFlat: { elemToPhysFlatRatio: 0.75 },
        elementalDisabled: { enabled: true },
      });
      expect(r.edpsPhysFlat).toBe(160);            // floor(100 + 0.75 × 80)
      expect(r.edpsElemPrimary).toBe(0);           // elemental disabled
      expect(r.edpsElemFlat).toBe(80);             // raw pool still computed (read by conversion)
    });

    it('elemental→physical BONUS conversion folds 75% of (ED − 1) into physical additive', () => {
      const base = { damage: 100, elementalDamage: 80, fireDamageBonus: 1.0, critDamage: 1.0 };
      const r = calculateDerivedStats(base, {
        edpsPhysAdditive: { elemBonusToPhysRatio: 0.75 },
        elementalDisabled: { enabled: true },
      });
      // ED = 1 + fire(1.0) = 2.0 → (ED−1)=1.0 → +0.75 into physical additive
      // additive = crit(1.0) + converted(0.75) = 1.75 (no stance crit in base)
      expect(r.edpsPhysAdditive).toBeCloseTo(1.75, 2);
      expect(r.edpsElemPrimary).toBe(0);
    });

    it('1% max-health-as-damage monogram is gated and populates BOTH flat pools', () => {
      const base = { damage: 100, elementalDamage: 50, health: 10000 };
      // Off by default — no phantom health contribution to flat damage.
      const off = calculateDerivedStats(base);
      expect(off.damageFromHealth).toBe(0);
      expect(off.edpsPhysFlat).toBe(100);
      expect(off.edpsElemFlat).toBe(50);
      // When the monogram enables it: +1% of totalHealth (100) into both pools.
      const on = calculateDerivedStats(base, {
        damageFromHealth: { enabled: true, sourceStat: 'totalHealth', percentage: 1 },
      });
      expect(on.damageFromHealth).toBe(100);
      expect(on.edpsPhysFlat).toBe(200);
      expect(on.edpsElemFlat).toBe(150);
    });
  });
});

