import { useState, useCallback, useMemo } from 'react';
import {
  createEmptyOverrides,
  BUCKET_DEFINITIONS,
  BUCKET_ORDER,
  isStatAllowedInBucket,
  sumOverridesByStatId,
} from '../utils/statBuckets';

/**
 * Hook for managing character stat overrides
 *
 * Provides state and actions for editing stat values across multiple buckets.
 * Designed to work alongside imported save data, allowing users to modify
 * or add stats for build planning.
 *
 * @param {Object} options
 * @param {Object} options.initialOverrides - Initial overrides state (for restoration)
 * @param {Function} options.onChange - Called when overrides change
 * @returns {Object} Overrides state and actions
 */
export function useCharacterOverrides(options = {}) {
  const { initialOverrides, onChange } = options;

  // Main overrides state - map of bucketId -> bucket state
  const [overrides, setOverrides] = useState(() => {
    return initialOverrides || createEmptyOverrides();
  });

  // Update a single slot in a bucket
  const updateSlot = useCallback((bucketId, slotIndex, updates) => {
    setOverrides(prev => {
      const bucket = prev[bucketId];
      if (!bucket || !bucket.slots[slotIndex]) return prev;

      // Validate stat if changing statId
      if (updates.statId !== undefined && updates.statId !== null) {
        if (!isStatAllowedInBucket(bucketId, updates.statId)) {
          console.warn(`Stat ${updates.statId} not allowed in bucket ${bucketId}`);
          return prev;
        }
      }

      const newSlots = [...bucket.slots];
      newSlots[slotIndex] = {
        ...newSlots[slotIndex],
        ...updates,
      };

      const newOverrides = {
        ...prev,
        [bucketId]: {
          ...bucket,
          slots: newSlots,
        },
      };

      onChange?.(newOverrides);
      return newOverrides;
    });
  }, [onChange]);

  // Add a new slot to a bucket
  const addSlot = useCallback((bucketId) => {
    setOverrides(prev => {
      const bucket = prev[bucketId];
      const def = BUCKET_DEFINITIONS[bucketId];

      if (!bucket || !def) return prev;
      if (bucket.slots.length >= def.maxSlots) {
        console.warn(`Bucket ${bucketId} at max capacity (${def.maxSlots})`);
        return prev;
      }

      const newSlotId = `${bucketId}-${Date.now()}`;
      const newSlots = [
        ...bucket.slots,
        { id: newSlotId, statId: null, value: 0 },
      ];

      const newOverrides = {
        ...prev,
        [bucketId]: {
          ...bucket,
          slots: newSlots,
        },
      };

      onChange?.(newOverrides);
      return newOverrides;
    });
  }, [onChange]);

  // Remove a slot from a bucket
  const removeSlot = useCallback((bucketId, slotIndex) => {
    setOverrides(prev => {
      const bucket = prev[bucketId];
      if (!bucket || bucket.slots.length <= 1) return prev; // Keep at least one slot

      const newSlots = bucket.slots.filter((_, i) => i !== slotIndex);

      const newOverrides = {
        ...prev,
        [bucketId]: {
          ...bucket,
          slots: newSlots,
        },
      };

      onChange?.(newOverrides);
      return newOverrides;
    });
  }, [onChange]);

  // Clear a specific bucket
  const clearBucket = useCallback((bucketId) => {
    setOverrides(prev => {
      const def = BUCKET_DEFINITIONS[bucketId];
      if (!def) return prev;

      const newOverrides = {
        ...prev,
        [bucketId]: {
          bucketId,
          slots: def.defaultSlots.map((slot, index) => ({
            id: `${bucketId}-${index}`,
            statId: null,
            value: 0,
          })),
        },
      };

      onChange?.(newOverrides);
      return newOverrides;
    });
  }, [onChange]);

  // Clear all overrides
  const clearAll = useCallback(() => {
    const empty = createEmptyOverrides();
    setOverrides(empty);
    onChange?.(empty);
  }, [onChange]);

  // Reset to initial or provided state
  const reset = useCallback((newState) => {
    const state = newState || initialOverrides || createEmptyOverrides();
    setOverrides(state);
    onChange?.(state);
  }, [initialOverrides, onChange]);

  // Calculate totals by stat ID
  const totals = useMemo(() => {
    return sumOverridesByStatId(overrides);
  }, [overrides]);

  // Get bucket state
  const getBucket = useCallback((bucketId) => {
    return overrides[bucketId] || null;
  }, [overrides]);

  // Check if overrides have any values
  const hasOverrides = useMemo(() => {
    for (const bucketId of BUCKET_ORDER) {
      const bucket = overrides[bucketId];
      if (!bucket) continue;
      for (const slot of bucket.slots) {
        if (slot.statId && slot.value !== 0) {
          return true;
        }
      }
    }
    return false;
  }, [overrides]);

  return {
    // State
    overrides,
    totals,
    hasOverrides,

    // Actions
    updateSlot,
    addSlot,
    removeSlot,
    clearBucket,
    clearAll,
    reset,
    getBucket,
  };
}
