import { useState, useCallback } from 'react';
import { serializeFilter, deserializeFilter } from '../models/FilterModel';

const STORAGE_KEY = 'dwarfStats.filterProfiles';

/**
 * Read all saved profiles from localStorage
 * @returns {Array<import('../models/FilterModel').FilterModel>}
 */
function loadProfilesFromStorage() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed
      .map(entry => deserializeFilter(JSON.stringify(entry)))
      .filter(Boolean);
  } catch {
    return [];
  }
}

/**
 * Write profiles array to localStorage
 * @param {Array} profiles
 */
function saveProfilesToStorage(profiles) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(profiles));
  } catch {
    // localStorage full or unavailable
  }
}

/**
 * Hook for managing saved filter profiles in localStorage.
 */
export function useFilterProfiles() {
  const [profiles, setProfiles] = useState(() => loadProfilesFromStorage());

  const saveProfile = useCallback((model) => {
    setProfiles(prev => {
      const idx = prev.findIndex(p => p.name === model.name);
      const serialized = JSON.parse(serializeFilter(model));
      let next;
      if (idx >= 0) {
        next = [...prev];
        next[idx] = serialized;
      } else {
        next = [...prev, serialized];
      }
      saveProfilesToStorage(next);
      return next;
    });
  }, []);

  const deleteProfile = useCallback((name) => {
    setProfiles(prev => {
      const next = prev.filter(p => p.name !== name);
      saveProfilesToStorage(next);
      return next;
    });
  }, []);

  return { profiles, saveProfile, deleteProfile };
}
