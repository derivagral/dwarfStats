import { describe, it, expect } from 'vitest';
import { findStatForAttribute } from '../src/utils/statRegistry.js';
import { calculateDerivedStats } from '../src/utils/derivedStats.js';
import {
  MONOGRAM_CALC_CONFIGS,
  applyExclusiveMonogramRules,
  getMonogramEffectSummary,
} from '../src/utils/monogramConfigs.js';
import { getMonogramById } from '../src/utils/monogramRegistry.js';

describe('MaxHealth% classification (health % lost as flat)', () => {
  it('resolves MaxHealth% variants to healthBonus (percent), not flat health', () => {
    expect(findStatForAttribute('EasyRPG.Attributes.Base.MaxHealth%').id).toBe('healthBonus');
    expect(findStatForAttribute('EasyRPG.Attributes.Base.MaxHealth%6').id).toBe('healthBonus');
    expect(findStatForAttribute('MaxHealth%').id).toBe('healthBonus');
  });

  it('still resolves flat MaxHealth to health', () => {
    expect(findStatForAttribute('EasyRPG.Attributes.Base.MaxHealth').id).toBe('health');
    expect(findStatForAttribute('MaxHealth').id).toBe('health');
  });

  it('percent health flows through totalHealth as a multiplier', () => {
    // e.g. CARD3_2 at L2 grants MaxHealth% 0.2 (decimal) → healthBonus
    const result = calculateDerivedStats({ health: 1000, healthBonus: 0.2 });
    expect(result.totalHealth).toBe(1200);
  });
});

describe('Health%ForHighest → percent stat (was flat chain)', () => {
  it('computes a percent from highest attribute', () => {
    const result = calculateDerivedStats(
      { strength: 250 },
      { healthPercentFromHighest: { enabled: true, percentPerInterval: 1, statInterval: 50 } },
    );
    expect(result.healthPercentFromHighest).toBe(5); // 250 / 50 × 1%
  });

  it('is disabled by default', () => {
    const result = calculateDerivedStats({ strength: 250 });
    expect(result.healthPercentFromHighest).toBe(0);
  });

  it('monogram configs route both game tags to the percent stat', () => {
    for (const key of ['Health%ForHighest', 'MaxHp%ForStat.Highest']) {
      const effects = MONOGRAM_CALC_CONFIGS[key].effects;
      expect(effects?.[0]?.derivedStatId, key).toBe('healthPercentFromHighest');
    }
  });

  it('feeds the glass-cannon damage-from-life total', () => {
    const withHealthPct = calculateDerivedStats(
      { health: 1000, strength: 500 },
      {
        damageFromLife: { enabled: true, lifePercent: 1 },
        healthPercentFromHighest: { enabled: true, percentPerInterval: 1, statInterval: 50 },
      },
    );
    // 500/50 = 10% life bonus → totalLife 1100 → 1% = 11
    expect(withHealthPct.damageFromLife).toBe(11);
  });
});

describe('distance monogram exclusivity', () => {
  it('drops the far bonus when both near and far are enabled', () => {
    const overrides = {
      distanceProcsDamageBonus: { enabled: true, bonusPercent: 50 },
      distanceProcsNearDamageBonus: { enabled: true, bonusPercent: 50 },
    };
    applyExclusiveMonogramRules(overrides);
    expect(overrides.distanceProcsNearDamageBonus).toBeDefined();
    expect(overrides.distanceProcsDamageBonus).toBeUndefined();
  });

  it('leaves a single distance bonus untouched', () => {
    const farOnly = { distanceProcsDamageBonus: { enabled: true, bonusPercent: 50 } };
    applyExclusiveMonogramRules(farOnly);
    expect(farOnly.distanceProcsDamageBonus).toBeDefined();

    const nearOnly = { distanceProcsNearDamageBonus: { enabled: true, bonusPercent: 50 } };
    applyExclusiveMonogramRules(nearOnly);
    expect(nearOnly.distanceProcsNearDamageBonus).toBeDefined();
  });

  it('only one distance bonus reaches the calc when both monograms are equipped', () => {
    const overrides = applyExclusiveMonogramRules({
      distanceProcsDamageBonus: { enabled: true, bonusPercent: 50 },
      distanceProcsNearDamageBonus: { enabled: true, bonusPercent: 50 },
    });
    const result = calculateDerivedStats({}, overrides);
    expect(result.distanceProcsNearDamageBonus).toBe(50);
    expect(result.distanceProcsDamageBonus).toBe(0);
    // EMulti applies the single surviving bonus once: ×1.5
    expect(result.edpsEMulti).toBeCloseTo(1.5);
  });
});

describe('monogram helper text fallback', () => {
  it('calc-config monograms provide a summary', () => {
    expect(getMonogramEffectSummary('DistanceProcsDamage')).toMatch(/6m/);
  });

  it('uncurated monograms fall back to game-data descriptions', () => {
    // No calc config, no curated entry — description comes from generated data
    expect(MONOGRAM_CALC_CONFIGS['EnergyNoHPRegen']).toBeUndefined();
    const def = getMonogramById('EnergyNoHPRegen');
    expect(def?.description).toMatch(/energy regeneration/i);
  });

  it('Glass Cannon description states the actual effect', () => {
    expect(getMonogramById('GainDamageForHPLoseArmor').description).toMatch(/1% of your maximum Health/i);
  });
});
