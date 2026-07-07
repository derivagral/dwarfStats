import { useMemo } from 'react';
import { calculateDerivedStats } from '../utils/derivedStats';

/**
 * Hook to calculate derived stats from base stats and monogram configurations
 */
export function useDerivedStats(options = {}) {
  const {
    baseStats = {},
    monogramInstanceCounts = {},
    monograms = [],
    stanceContext = null,
    overrideConfigs = {},
  } = options;

  return useMemo(() => {
    const overrides = { ...overrideConfigs };

    // Apply monogram configurations
    for (const mono of monograms) {
      const applyMonogramConfig = (monoId, count) => {
        // Implementation of monogram config application
        // This would apply the monogram's effects to the overrides
      };

      if (mono?.id) {
        applyMonogramConfig(mono.id, monogramInstanceCounts[mono.id] || 1);
      }
    }

    // The near/far distance monograms are mutually exclusive in-game. If a save
    // or manual override carries both tags, keep a single active display/calculation
    // path so the monogram section does not show two simultaneous +50% rows.
    if (overrides.distanceProcsDamageBonus && overrides.distanceProcsNearDamageBonus) {
      delete overrides.distanceProcsDamageBonus;
    }

    const activeStance = stanceContext?.activeStance;
    if (activeStance?.keystoneUnlocked && activeStance.keystoneMonogramId) {
      applyMonogramConfig(activeStance.keystoneMonogramId, 1);
    }

    return calculateDerivedStats(baseStats, overrides);
  }, [baseStats, monogramInstanceCounts, monograms, stanceContext, overrideConfigs]);
}
