/**
 * Models Module
 *
 * Clean data models for DwarfStats application.
 * These models transform complex UE5 save file structures into
 * flat, easy-to-use representations optimized for read-only display.
 *
 * @module models
 */

// Item model and utilities
export {
  Rarity,
  RARITY_NAMES,
  RARITY_CLASSES,
  createEmptyItem,
  getRarityName,
  getRarityClass,
  getAllStatNames,
  hasAffixes,
  getTotalAffixCount,
} from './Item.js';

// Item transformation functions
export {
  isItemStruct,
  transformItem,
  findAllItemStructs,
  transformAllItems,
  isWeaponType,
  WEAPON_PATTERNS,
} from './itemTransformer.js';
