/**
 * Mapping of dungeon counter key prefixes to friendly display names
 */
const DUNGEON_DISPLAY_NAMES = {
  OlympusCounter: 'Olympus',
  BridgeDemigodsCounter: 'Bridge of the Demigods',
  CataCounter: 'Catacombs',
  CathedralCounter: 'Cathedral of Fire',
  ElisyaCounter: 'Elisya',
  SkorchCounter: 'Skorch',
  ElvenCounter: 'Elven Capital',
  GraveDiggerCounter: 'Gravedigger Cove',
  HourglassCounter: 'Hourglass',
  EnclaveCounter: 'Underground Enclave',
  MinLodurCounter: 'Min Lodur',
  CasinoCounter: 'Fortune',
  ZulCounter: 'Zul',
  UberDrythusCounter: 'Dark Drythus',
  UberOlympusCounter: 'Dark Olympus',
  UberBridgeDemigodsCounter: 'Dark Bridge',
  UberCathedralCounter: 'Dark Archeon',
  UberZulCounter: 'Dark Zul',
  UberSkorchCounter: 'Dark Skorch',
};

/**
 * Extracts dungeon counter statistics from save data
 * @param {Object} saveData - Parsed save file JSON
 * @returns {Array<{name: string, displayName: string, count: number}>} Array of dungeon counters
 */
export function extractDungeonCounters(saveData) {
  if (!saveData || typeof saveData !== 'object') {
    return [];
  }

  const dungeonCounters = [];

  // Recursively search for counter properties in the save data
  function searchForCounters(obj, path = '') {
    if (!obj || typeof obj !== 'object') return;

    for (const [key, value] of Object.entries(obj)) {
      // Check if this key matches a dungeon counter pattern
      for (const [counterKey, displayName] of Object.entries(DUNGEON_DISPLAY_NAMES)) {
        if (key.startsWith(counterKey + '_') || key === counterKey) {
          // Verify it has the expected structure with an Int property
          if (value && typeof value === 'object' && 'Int' in value) {
            dungeonCounters.push({
              name: counterKey,
              displayName: displayName,
              count: value.Int || 0,
            });
          }
        }
      }

      // Continue searching recursively
      if (typeof value === 'object' && value !== null) {
        searchForCounters(value, path ? `${path}.${key}` : key);
      }
    }
  }

  searchForCounters(saveData);

  // Remove duplicates (in case the same counter appears multiple times)
  const uniqueCounters = dungeonCounters.reduce((acc, current) => {
    const existing = acc.find(item => item.name === current.name);
    if (!existing) {
      acc.push(current);
    }
    return acc;
  }, []);

  // Sort by display name for consistent ordering
  return uniqueCounters.sort((a, b) => a.displayName.localeCompare(b.displayName));
}
