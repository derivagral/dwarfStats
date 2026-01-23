import { useState, useCallback, useMemo } from 'react';
import { getStatType } from '../utils/statBuckets';

/**
 * Hook for managing per-item stat overrides
 *
 * Stores modifications to individual item stats, keyed by equipment slot.
 * Each item can have stat modifications that override or add to the base item stats.
 *
 * @param {Object} options
 * @param {Object} options.initialOverrides - Initial overrides state
 * @param {Function} options.onChange - Called when overrides change
 * @returns {Object} Item overrides state and actions
 */
export function useItemOverrides(options = {}) {
  const { initialOverrides, onChange } = options;

  // State: { slotKey: { mods: [...], removedIndices: [], monograms: [...], skillModifiers: [...] } }
  const [overrides, setOverrides] = useState(() => initialOverrides || {});

  // Get overrides for a specific slot
  const getSlotOverrides = useCallback((slotKey) => {
    return overrides[slotKey] || { mods: [], removedIndices: [], monograms: [], skillModifiers: [] };
  }, [overrides]);

  // Update a stat modification for an item
  const updateMod = useCallback((slotKey, modIndex, updates) => {
    setOverrides(prev => {
      const slotData = prev[slotKey] || { mods: [], removedIndices: [] };
      const newMods = [...slotData.mods];

      if (modIndex >= 0 && modIndex < newMods.length) {
        newMods[modIndex] = { ...newMods[modIndex], ...updates };
      }

      const newOverrides = {
        ...prev,
        [slotKey]: { ...slotData, mods: newMods },
      };

      onChange?.(newOverrides);
      return newOverrides;
    });
  }, [onChange]);

  // Add a new stat modification to an item
  const addMod = useCallback((slotKey, mod = { name: '', value: 0, isNew: true }) => {
    setOverrides(prev => {
      const slotData = prev[slotKey] || { mods: [], removedIndices: [] };
      const newMod = {
        id: `mod-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        ...mod,
      };

      const newOverrides = {
        ...prev,
        [slotKey]: {
          ...slotData,
          mods: [...slotData.mods, newMod],
        },
      };

      onChange?.(newOverrides);
      return newOverrides;
    });
  }, [onChange]);

  // Remove a stat modification from an item
  const removeMod = useCallback((slotKey, modIndex) => {
    setOverrides(prev => {
      const slotData = prev[slotKey] || { mods: [], removedIndices: [] };
      const newMods = slotData.mods.filter((_, i) => i !== modIndex);

      const newOverrides = {
        ...prev,
        [slotKey]: { ...slotData, mods: newMods },
      };

      // Clean up if no mods left
      if (newMods.length === 0 && slotData.removedIndices.length === 0) {
        delete newOverrides[slotKey];
      }

      onChange?.(newOverrides);
      return newOverrides;
    });
  }, [onChange]);

  // Mark a base item stat as removed (hide it from display)
  const removeBaseStat = useCallback((slotKey, baseStatIndex) => {
    setOverrides(prev => {
      const slotData = prev[slotKey] || { mods: [], removedIndices: [] };
      const removedIndices = [...slotData.removedIndices];

      if (!removedIndices.includes(baseStatIndex)) {
        removedIndices.push(baseStatIndex);
      }

      const newOverrides = {
        ...prev,
        [slotKey]: { ...slotData, removedIndices },
      };

      onChange?.(newOverrides);
      return newOverrides;
    });
  }, [onChange]);

  // Restore a removed base stat
  const restoreBaseStat = useCallback((slotKey, baseStatIndex) => {
    setOverrides(prev => {
      const slotData = prev[slotKey] || { mods: [], removedIndices: [], monograms: [], skillModifiers: [] };
      const removedIndices = slotData.removedIndices.filter(i => i !== baseStatIndex);

      const newOverrides = {
        ...prev,
        [slotKey]: { ...slotData, removedIndices },
      };

      // Clean up if no overrides left
      const monograms = slotData.monograms || [];
      const skillMods = slotData.skillModifiers || [];
      if (slotData.mods.length === 0 && removedIndices.length === 0 && monograms.length === 0 && skillMods.length === 0) {
        delete newOverrides[slotKey];
      }

      onChange?.(newOverrides);
      return newOverrides;
    });
  }, [onChange]);

  // Add a monogram to an item (duplicates allowed)
  const addMonogram = useCallback((slotKey, monogram) => {
    setOverrides(prev => {
      const slotData = prev[slotKey] || { mods: [], removedIndices: [], monograms: [] };
      const monograms = slotData.monograms || [];

      const newOverrides = {
        ...prev,
        [slotKey]: {
          ...slotData,
          monograms: [...monograms, monogram],
        },
      };

      onChange?.(newOverrides);
      return newOverrides;
    });
  }, [onChange]);

  // Remove a monogram from an item
  const removeMonogram = useCallback((slotKey, monogramIndex) => {
    setOverrides(prev => {
      const slotData = prev[slotKey] || { mods: [], removedIndices: [], monograms: [], skillModifiers: [] };
      const monograms = (slotData.monograms || []).filter((_, i) => i !== monogramIndex);

      const newOverrides = {
        ...prev,
        [slotKey]: { ...slotData, monograms },
      };

      // Clean up if no overrides left
      const skillMods = slotData.skillModifiers || [];
      if (slotData.mods.length === 0 && slotData.removedIndices.length === 0 && monograms.length === 0 && skillMods.length === 0) {
        delete newOverrides[slotKey];
      }

      onChange?.(newOverrides);
      return newOverrides;
    });
  }, [onChange]);

  // Add a skill modifier to an item (for weapons, duplicates allowed)
  const addSkillModifier = useCallback((slotKey, skillModifier) => {
    setOverrides(prev => {
      const slotData = prev[slotKey] || { mods: [], removedIndices: [], monograms: [], skillModifiers: [] };
      const skillModifiers = slotData.skillModifiers || [];

      const newOverrides = {
        ...prev,
        [slotKey]: {
          ...slotData,
          skillModifiers: [...skillModifiers, skillModifier],
        },
      };

      onChange?.(newOverrides);
      return newOverrides;
    });
  }, [onChange]);

  // Remove a skill modifier from an item
  const removeSkillModifier = useCallback((slotKey, modifierIndex) => {
    setOverrides(prev => {
      const slotData = prev[slotKey] || { mods: [], removedIndices: [], monograms: [], skillModifiers: [] };
      const skillModifiers = (slotData.skillModifiers || []).filter((_, i) => i !== modifierIndex);

      const newOverrides = {
        ...prev,
        [slotKey]: { ...slotData, skillModifiers },
      };

      // Clean up if no overrides left
      const monograms = slotData.monograms || [];
      if (slotData.mods.length === 0 && slotData.removedIndices.length === 0 && monograms.length === 0 && skillModifiers.length === 0) {
        delete newOverrides[slotKey];
      }

      onChange?.(newOverrides);
      return newOverrides;
    });
  }, [onChange]);

  // Clear all overrides for a slot
  const clearSlot = useCallback((slotKey) => {
    setOverrides(prev => {
      const newOverrides = { ...prev };
      delete newOverrides[slotKey];
      onChange?.(newOverrides);
      return newOverrides;
    });
  }, [onChange]);

  // Clear all overrides
  const clearAll = useCallback(() => {
    setOverrides({});
    onChange?.({});
  }, [onChange]);

  // Check if a slot has any overrides
  const hasSlotOverrides = useCallback((slotKey) => {
    const slotData = overrides[slotKey];
    if (!slotData) return false;
    return slotData.mods.length > 0 ||
           slotData.removedIndices.length > 0 ||
           (slotData.monograms || []).length > 0 ||
           (slotData.skillModifiers || []).length > 0;
  }, [overrides]);

  // Check if any overrides exist
  const hasAnyOverrides = useMemo(() => {
    return Object.keys(overrides).length > 0;
  }, [overrides]);

  // Apply overrides to an item's attributes
  // Returns modified attributes array
  const applyOverridesToItem = useCallback((slotKey, baseAttributes = []) => {
    const slotData = overrides[slotKey];
    if (!slotData) return baseAttributes;

    // Filter out removed base stats
    let result = baseAttributes.filter((_, index) =>
      !slotData.removedIndices.includes(index)
    );

    // Add new/modified stats using attributeName for pattern matching
    for (const mod of slotData.mods) {
      if (mod.statId && mod.value !== undefined) {
        const statType = getStatType(mod.statId);
        if (statType) {
          result.push({
            name: statType.attributeName, // Use attributeName for pattern matching
            value: mod.value,
            isOverride: true,
          });
        }
      }
    }

    return result;
  }, [overrides]);

  return {
    // State
    overrides,
    hasAnyOverrides,

    // Per-slot queries
    getSlotOverrides,
    hasSlotOverrides,
    applyOverridesToItem,

    // Actions
    updateMod,
    addMod,
    removeMod,
    removeBaseStat,
    restoreBaseStat,
    addMonogram,
    removeMonogram,
    addSkillModifier,
    removeSkillModifier,
    clearSlot,
    clearAll,
  };
}
