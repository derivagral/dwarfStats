/**
 * Character health progression extracted from save-side level and rupture data.
 *
 * Observed rules:
 * - 100 starting health
 * - +2 health per level through level 100
 * - +1 health per level after 100
 * - +100 health for campaign-boss ruptures 6, 12, 18, 24, 30, and 36
 */

export const CAMPAIGN_BOSS_RUPTURES = Object.freeze([6, 12, 18, 24, 30, 36]);
export const CAMPAIGN_BOSS_HEALTH = 100;

function findHostPlayerStruct(saveData) {
  const props = saveData?.root?.properties || saveData?.properties;
  return props?.HostPlayerData_0?.Struct?.Struct || null;
}

/** @returns {number} Character level, or 0 when unavailable. */
export function parseCharacterLevel(saveData) {
  const hostPlayerStruct = findHostPlayerStruct(saveData);
  if (!hostPlayerStruct) return 0;
  const key = Object.keys(hostPlayerStruct).find(k => k.startsWith('Level_'));
  const level = key ? hostPlayerStruct[key]?.Int : 0;
  return Number.isFinite(level) && level > 0 ? level : 0;
}

/**
 * Character name from HostPlayerData (PlayerName_*). The save FILENAME is a
 * character-id hash — useless as a display name — so the UI prefers this.
 * @returns {string} Character name, or '' when unavailable.
 */
export function parseCharacterName(saveData) {
  const hostPlayerStruct = findHostPlayerStruct(saveData);
  if (!hostPlayerStruct) return '';
  const key = Object.keys(hostPlayerStruct).find(k => k.startsWith('PlayerName_'));
  const name = key ? hostPlayerStruct[key]?.Str : '';
  return typeof name === 'string' ? name : '';
}

/**
 * Character race from HostPlayerData customization data. Stored as a byte of
 * the game's E_CharacterRace enum ("E_CharacterRace::NewEnumerator2") — the
 * enum labels are opaque indices; the index→name/bonus mapping awaits a race
 * table extraction. Race grants scale with character level capped at 200
 * (see RACE_LEVEL_CAP), so the index + capped level are what downstream
 * racial-affinity calculations will need.
 *
 * @returns {number|null} Race enum index (e.g. 2), or null when unavailable.
 */
export function parseCharacterRace(saveData) {
  const hostPlayerStruct = findHostPlayerStruct(saveData);
  if (!hostPlayerStruct) return null;
  const customizationKey = Object.keys(hostPlayerStruct).find(k => k.startsWith('CustumizationData_'));
  const customization = customizationKey
    ? hostPlayerStruct[customizationKey]?.Struct?.Struct
    : null;
  if (!customization) return null;
  const raceKey = Object.keys(customization).find(k => k.startsWith('Race_'));
  const label = raceKey ? customization[raceKey]?.Byte?.Label : null;
  const match = typeof label === 'string' ? label.match(/NewEnumerator(\d+)$/) : null;
  return match ? Number(match[1]) : null;
}

/** Racial bonuses scale with character level up to this cap. */
export const RACE_LEVEL_CAP = 200;

/** @returns {number[]} Completed rupture numbers from the map-select save data. */
export function parseCompletedRuptures(saveData) {
  const props = saveData?.root?.properties || saveData?.properties;
  if (!props) return [];
  const key = Object.keys(props).find(k => k.startsWith('Completed Ruptures'));
  const values = key ? props[key]?.Array?.Base?.Int : null;
  return Array.isArray(values) ? values.filter(Number.isFinite) : [];
}

export function calculateLevelHealth(level) {
  if (!Number.isFinite(level) || level < 1) return 0;
  const normalizedLevel = Math.floor(level);
  return 100
    + (2 * Math.min(normalizedLevel, 100))
    + Math.max(normalizedLevel - 100, 0);
}

export function calculateCampaignHealth(completedRuptures = []) {
  const completed = new Set(completedRuptures);
  return CAMPAIGN_BOSS_RUPTURES.filter(level => completed.has(level)).length
    * CAMPAIGN_BOSS_HEALTH;
}

export function parseHealthProgression(saveData) {
  const level = parseCharacterLevel(saveData);
  const completedRuptures = parseCompletedRuptures(saveData);
  const levelHealth = calculateLevelHealth(level);
  const campaignBosses = CAMPAIGN_BOSS_RUPTURES.filter(value => completedRuptures.includes(value));
  const campaignHealth = campaignBosses.length * CAMPAIGN_BOSS_HEALTH;

  return {
    level,
    levelHealth,
    completedRuptures,
    campaignBosses,
    campaignHealth,
    totalFlatHealth: levelHealth + campaignHealth,
  };
}
