// Attribute display mapping - transforms technical save data attribute names
// into user-friendly display names for tooltips and UI
//
// Display mappings are now generated from the unified stat registry.
// To add new display names, update src/utils/statRegistry.js

import { DISPLAY_MAP, warnUnknownAttribute } from './statRegistry.js';

// Use the display map generated from the stat registry
const ATTRIBUTE_DISPLAY_MAP = DISPLAY_MAP;

// Pre-compute sorted patterns (longest first for better matching)
const SORTED_PATTERNS = Object.keys(ATTRIBUTE_DISPLAY_MAP).sort((a, b) => b.length - a.length);

// Extract the most relevant part of an attribute name for fallback display
function extractFallbackName(fullName) {
  if (!fullName) return 'Unknown';

  const parts = fullName.split('.');

  // If it's a deep path like "EasyRPG.Attributes.DamageSystem.Damage.Magery.CriticalDamage%"
  // We want to grab the meaningful parts toward the end
  if (parts.length > 3) {
    // Take the last 2-3 parts and join them
    const relevantParts = parts.slice(-2);
    return relevantParts.join(' ');
  }

  // Otherwise just return the last part
  return parts[parts.length - 1];
}

// Extract the meaningful tail of an attribute path
// E.g., "EasyRPG.Attributes.Abilities.DragonFlame.DamageMultiplier" -> "DragonFlame.DamageMultiplier"
function extractAttributeTail(fullName) {
  if (!fullName) return fullName;

  // Remove common prefixes
  const prefixesToStrip = [
    'EasyRPG.Attributes.Abilities.',
    'EasyRPG.Attributes.DamageSystem.',
    'EasyRPG.Attributes.Characteristics.',
    'EasyRPG.Attributes.Base.',
    'EasyRPG.Attributes.',
  ];

  for (const prefix of prefixesToStrip) {
    if (fullName.startsWith(prefix)) {
      return fullName.substring(prefix.length);
    }
  }

  return fullName;
}

// Transform an attribute name for display
export function getDisplayName(attributeName) {
  if (!attributeName) return 'Unknown';

  // First try exact match on the full attribute name
  if (ATTRIBUTE_DISPLAY_MAP[attributeName]) {
    return ATTRIBUTE_DISPLAY_MAP[attributeName];
  }

  // Extract the meaningful tail (strip common prefixes)
  const tail = extractAttributeTail(attributeName);

  // Try exact match on the tail
  if (tail !== attributeName && ATTRIBUTE_DISPLAY_MAP[tail]) {
    return ATTRIBUTE_DISPLAY_MAP[tail];
  }

  // Try matching patterns in order from longest to shortest (more specific first)
  // This ensures "DragonFlame.DamageMultiplier" matches before "DamageMultiplier"
  for (const pattern of SORTED_PATTERNS) {
    // Check if tail ends with the pattern (for multi-segment matches)
    if (tail.endsWith(pattern)) {
      return ATTRIBUTE_DISPLAY_MAP[pattern];
    }
  }

  // Try contains matching as last resort (case-sensitive)
  for (const pattern of SORTED_PATTERNS) {
    if (tail.includes(pattern)) {
      return ATTRIBUTE_DISPLAY_MAP[pattern];
    }
  }

  // Log unknown attributes in development mode
  warnUnknownAttribute(attributeName);

  // Fallback: extract a reasonable name from the path
  return extractFallbackName(tail);
}

// Format an attribute value for display
export function formatAttributeValue(value, attributeName = '') {
  if (value === null || value === undefined) return '';

  // If it's a percentage attribute, format with 1 decimal place
  if (attributeName.includes('%') || attributeName.includes('Percent')) {
    if (typeof value === 'number') {
      // If value is between 0-1, treat as fraction and convert to percentage
      if (value > 0 && value < 1) {
        return `${(value * 100).toFixed(1)}%`;
      }
      // Otherwise it's already a percentage value
      return `${value.toFixed(1)}%`;
    }
  }

  // For regular numeric values
  if (typeof value === 'number') {
    // If it's a whole number, don't show decimals
    if (Number.isInteger(value)) {
      return value.toString();
    }
    // Otherwise show 1 decimal place
    return value.toFixed(1);
  }

  return String(value);
}

// Transform an attribute object for display (convenience function)
export function transformAttribute(attr) {
  return {
    ...attr,
    displayName: getDisplayName(attr.name),
    displayValue: formatAttributeValue(attr.value, attr.name),
  };
}
