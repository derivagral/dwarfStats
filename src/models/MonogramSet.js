import { getUniqueSlotKeyMap } from '../utils/equipmentParser.js';
import { normalizeMonogramSlots } from '../utils/monogramOverrides.js';

export const MONOGRAM_SET_VERSION = 1;

const MONOGRAM_EQUIPMENT_SLOTS = new Set([
  'head', 'neck', 'bracer', 'boots', 'pants', 'relic', 'ring',
]);

function baseSlot(slotKey = '') {
  return slotKey.replace(/\d+$/, '');
}

export function isMonogramEquipmentSlot(slotKey) {
  return MONOGRAM_EQUIPMENT_SLOTS.has(baseSlot(slotKey));
}

export function getMonogramPoolForEquipmentSlot(slotKey) {
  const slot = baseSlot(slotKey);
  if (slot === 'neck') return 'amulet';
  return MONOGRAM_EQUIPMENT_SLOTS.has(slot) ? slot : null;
}

export function createMonogramSet(name, equippedItems = [], overrides = {}, id = null) {
  const uniqueSlotKeys = getUniqueSlotKeyMap(equippedItems);
  const entries = [];

  for (const item of equippedItems) {
    const slotKey = uniqueSlotKeys.get(item) || item?.slotKey || item?.slot || '';
    if (!isMonogramEquipmentSlot(slotKey)) continue;

    const slotOverride = overrides[slotKey] || {};
    const monogramSlots = Array.isArray(slotOverride.monogramSlots)
      ? normalizeMonogramSlots(slotOverride.monogramSlots)
      : normalizeMonogramSlots(item?.monograms || item?.model?.monograms || []);

    entries.push({
      slotKey,
      itemRow: item?.rowName || item?.model?.rowName || '',
      itemName: item?.displayName || item?.model?.displayName || slotKey,
      monogramSlots,
    });
  }

  return {
    version: MONOGRAM_SET_VERSION,
    id: id || `monogram-set-${Date.now()}`,
    name: name.trim(),
    entries,
  };
}

export function matchMonogramSet(monogramSet, equippedItems = []) {
  const uniqueSlotKeys = getUniqueSlotKeyMap(equippedItems);
  const equippedBySlot = new Map();

  for (const item of equippedItems) {
    const slotKey = uniqueSlotKeys.get(item) || item?.slotKey || item?.slot || '';
    equippedBySlot.set(slotKey, item);
  }

  const monogramSlotsByEquipment = {};
  const skipped = [];

  for (const entry of monogramSet?.entries || []) {
    const item = equippedBySlot.get(entry.slotKey);
    const currentRow = item?.rowName || item?.model?.rowName || '';

    if (!item || currentRow !== entry.itemRow) {
      skipped.push(entry);
      continue;
    }

    monogramSlotsByEquipment[entry.slotKey] = normalizeMonogramSlots(entry.monogramSlots);
  }

  return { monogramSlotsByEquipment, skipped };
}

export function serializeMonogramSet(monogramSet) {
  return JSON.stringify(monogramSet);
}

export function deserializeMonogramSet(json) {
  try {
    const parsed = JSON.parse(json);
    if (!parsed?.name || !Array.isArray(parsed.entries)) return null;

    const entries = parsed.entries
      .filter(entry => entry?.slotKey && isMonogramEquipmentSlot(entry.slotKey))
      .map(entry => ({
        slotKey: entry.slotKey,
        itemRow: entry.itemRow || '',
        itemName: entry.itemName || entry.slotKey,
        monogramSlots: normalizeMonogramSlots(entry.monogramSlots),
      }));

    return {
      version: MONOGRAM_SET_VERSION,
      id: parsed.id || `monogram-set-${Date.now()}`,
      name: parsed.name,
      entries,
    };
  } catch {
    return null;
  }
}
