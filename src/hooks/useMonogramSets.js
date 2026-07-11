import { useCallback, useState } from 'react';
import { deserializeMonogramSet, serializeMonogramSet } from '../models/MonogramSet.js';

const STORAGE_KEY = 'dwarfStats.monogramSets';

function loadSetsFromStorage() {
  try {
    const parsed = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
    if (!Array.isArray(parsed)) return [];
    return parsed
      .map(entry => deserializeMonogramSet(JSON.stringify(entry)))
      .filter(Boolean);
  } catch {
    return [];
  }
}

function saveSetsToStorage(sets) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(sets));
  } catch {
    // localStorage may be disabled or full; the in-memory list still works.
  }
}

export function useMonogramSets() {
  const [sets, setSets] = useState(() => loadSetsFromStorage());

  const saveSet = useCallback(monogramSet => {
    setSets(previous => {
      const stored = JSON.parse(serializeMonogramSet(monogramSet));
      const index = previous.findIndex(entry => entry.name === monogramSet.name);
      const next = index >= 0
        ? previous.map((entry, entryIndex) => entryIndex === index ? stored : entry)
        : [...previous, stored];
      saveSetsToStorage(next);
      return next;
    });
  }, []);

  const deleteSet = useCallback(name => {
    setSets(previous => {
      const next = previous.filter(entry => entry.name !== name);
      saveSetsToStorage(next);
      return next;
    });
  }, []);

  return { sets, saveSet, deleteSet };
}
