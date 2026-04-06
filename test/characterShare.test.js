import { describe, it, expect } from 'vitest';
import {
  encodeCharacterShare,
  decodeCharacterShare,
  buildCharacterShareUrl,
} from '../src/utils/shareUrl.js';
import {
  createItemShare,
  createMasteryShare,
  createCharacterSharePayload,
  itemShareToItem,
  masteryShareToData,
  CHARACTER_SHARE_VERSION,
} from '../src/models/CharacterShareModel.js';
import {
  encodeId, decodeId, encodeIdOrString, decodeIdOrString,
  STAT_DICT, MONOGRAM_DICT, KEYSTONE_DICT,
  SLOT_DICT, WEAPON_TYPE_DICT,
} from '../src/utils/shareCodec.js';
import { convertMasteryToStanceContext } from '../src/utils/stanceSkills.js';

// ---------------------------------------------------------------------------
// Codec
// ---------------------------------------------------------------------------

describe('shareCodec', () => {
  it('encodes known IDs to integers', () => {
    expect(encodeId(STAT_DICT, 'strength')).toBe(0);
    expect(encodeId(STAT_DICT, 'dexterity')).toBe(2);
    expect(encodeId(SLOT_DICT, 'head')).toBe(0);
    expect(encodeId(SLOT_DICT, 'offhand')).toBe(12);
  });

  it('returns null for unknown IDs', () => {
    expect(encodeId(STAT_DICT, 'nonExistentStat')).toBeNull();
    expect(encodeId(MONOGRAM_DICT, 'FakeMonogram')).toBeNull();
  });

  it('decodes integers back to strings', () => {
    expect(decodeId(STAT_DICT, 0)).toBe('strength');
    expect(decodeId(SLOT_DICT, 0)).toBe('head');
    expect(decodeId(WEAPON_TYPE_DICT, 0)).toBe('spear');
  });

  it('decodeId returns null for out-of-range index', () => {
    expect(decodeId(STAT_DICT, -1)).toBeNull();
    expect(decodeId(STAT_DICT, 99999)).toBeNull();
  });

  it('encodeIdOrString falls back to string for unknown IDs', () => {
    expect(encodeIdOrString(STAT_DICT, 'strength')).toBe(0);
    expect(encodeIdOrString(STAT_DICT, 'futureNewStat')).toBe('futureNewStat');
  });

  it('decodeIdOrString handles both integers and strings', () => {
    expect(decodeIdOrString(STAT_DICT, 0)).toBe('strength');
    expect(decodeIdOrString(STAT_DICT, 'futureNewStat')).toBe('futureNewStat');
  });

  it('all dictionaries are non-empty', () => {
    expect(STAT_DICT.length).toBeGreaterThan(0);
    expect(MONOGRAM_DICT.length).toBeGreaterThan(0);
    expect(KEYSTONE_DICT.length).toBeGreaterThan(0);
    expect(SLOT_DICT.length).toBeGreaterThan(0);
    expect(WEAPON_TYPE_DICT.length).toBeGreaterThan(0);
  });

  it('WEAPON_TYPE_DICT covers all STANCE_DEFS ids (no string fallback for any stance)', () => {
    // Previously used SkillTree.js WEAPON_TYPE values ('mauls', 'oneHand', 'archery', etc.)
    // which mismatched STANCE_DEFS ids ('maul', 'sword', 'bow', etc.), causing string fallback.
    const stanceIds = ['spear', 'maul', 'sword', 'twohand', 'bow', 'magery', 'fist', 'scythe'];
    for (const id of stanceIds) {
      expect(WEAPON_TYPE_DICT.indexOf(id)).toBeGreaterThanOrEqual(0);
    }
  });
});

// ---------------------------------------------------------------------------
// createItemShare / itemShareToItem round-trip
// ---------------------------------------------------------------------------

describe('CharacterShareModel — item round-trip', () => {
  const sampleItem = {
    id: 'test-item-1',
    rowName: 'Armor_Bracers_Zone_4_Tiger_Bracers',
    type: 'Armor Bracers',
    displayName: 'Tiger Bracers',
    slot: 'bracer',
    rarity: 3,
    tier: 42,
    baseStats: [
      { stat: 'strength', value: 25 },
      { stat: 'critChance', value: 15 },
      { stat: 'armor', value: 200 },
    ],
    monograms: [
      { id: 'Bloodlust.Base', value: 1 },
      { id: 'AllowPhasing', value: null },
    ],
    affixPools: { inherent: [], pool1: [], pool2: [], pool3: [] },
    isLocked: false, isGenerated: true, stackCount: 1, charges: 0,
    specks: 0, upgradeCount: 0,
  };

  it('round-trips item stats and monograms', () => {
    const share = createItemShare(sampleItem);
    const restored = itemShareToItem(share, 0);

    expect(restored.slot).toBe('bracer');
    expect(restored.rowName).toBe('Armor_Bracers_Zone_4_Tiger_Bracers');
    expect(restored.rarity).toBe(3);
    expect(restored.tier).toBe(42);

    expect(restored.baseStats).toHaveLength(3);
    expect(restored.baseStats[0]).toEqual({ stat: 'strength', value: 25 });
    expect(restored.baseStats[1]).toEqual({ stat: 'critChance', value: 15 });
    expect(restored.baseStats[2]).toEqual({ stat: 'armor', value: 200 });

    expect(restored.monograms).toHaveLength(2);
    expect(restored.monograms[0]).toEqual({ id: 'Bloodlust.Base', value: 1 });
    expect(restored.monograms[1]).toEqual({ id: 'AllowPhasing', value: null });
  });

  it('omits rarity and tier when zero', () => {
    const zeroItem = { ...sampleItem, rarity: 0, tier: 0 };
    const share = createItemShare(zeroItem);
    expect(share.ra).toBeUndefined();
    expect(share.ti).toBeUndefined();
  });

  it('omits bs and mg when empty', () => {
    const bareItem = { ...sampleItem, baseStats: [], monograms: [] };
    const share = createItemShare(bareItem);
    expect(share.bs).toBeUndefined();
    expect(share.mg).toBeUndefined();
  });

  it('round-trips display name via dn field', () => {
    const share = createItemShare(sampleItem);
    expect(share.dn).toBe('Tiger Bracers');
    const restored = itemShareToItem(share, 0);
    expect(restored.displayName).toBe('Tiger Bracers');
  });

  it('falls back to rowName derivation when dn is absent', () => {
    const share = createItemShare({ ...sampleItem, displayName: '' });
    expect(share.dn).toBeUndefined();
    const restored = itemShareToItem(share, 0);
    // displayNameFromRowName takes last 2 segments
    expect(restored.displayName).toBe('Tiger Bracers');
  });

  it('preserves unknown stat IDs as strings through round-trip', () => {
    const itemWithFutureStat = {
      ...sampleItem,
      baseStats: [{ stat: 'futureUnknownStat', value: 99 }],
      monograms: [{ id: 'FutureMonogram.New', value: 1 }],
    };
    const share = createItemShare(itemWithFutureStat);
    const restored = itemShareToItem(share, 0);

    expect(restored.baseStats[0].stat).toBe('futureUnknownStat');
    expect(restored.monograms[0].id).toBe('FutureMonogram.New');
  });
});

// ---------------------------------------------------------------------------
// createMasteryShare / masteryShareToData / convertMasteryToStanceContext
// ---------------------------------------------------------------------------

describe('CharacterShareModel — mastery round-trip', () => {
  const sampleStanceContext = {
    stances: {
      spear: {
        id: 'spear', damageStatId: 'spearDamage',
        keystoneMonogramId: 'Bloodlust.Base', monogramFamily: 'melee',
        totalSkill: 15000, keystoneUnlocked: true, mastery: 28,
      },
    },
    activeStanceId: 'spear',
    activeStance: {
      id: 'spear', damageStatId: 'spearDamage',
      keystoneMonogramId: 'Bloodlust.Base', monogramFamily: 'melee',
      totalSkill: 15000, keystoneUnlocked: true, mastery: 28,
    },
  };

  it('encodes weaponType, keystoneUnlocked, and paragonLevel', () => {
    const share = createMasteryShare(sampleStanceContext);
    expect(share).not.toBeNull();
    expect(share.wt).toBe(WEAPON_TYPE_DICT.indexOf('spear'));
    expect(share.ku).toBe(1);
    expect(share.pl).toBe(28);
  });

  it('omits ku when keystone not unlocked', () => {
    const noKeystone = { activeStance: { ...sampleStanceContext.activeStance, keystoneUnlocked: false } };
    const share = createMasteryShare(noKeystone);
    expect(share.ku).toBeUndefined();
  });

  it('omits pl when mastery is zero', () => {
    const zeroMastery = { activeStance: { ...sampleStanceContext.activeStance, mastery: 0 } };
    const share = createMasteryShare(zeroMastery);
    expect(share.pl).toBeUndefined();
  });

  it('returns null for null or missing activeStance', () => {
    expect(createMasteryShare(null)).toBeNull();
    expect(createMasteryShare({})).toBeNull();
    expect(createMasteryShare({ activeStance: null })).toBeNull();
  });

  it('masteryShareToData decodes all fields', () => {
    const share = createMasteryShare(sampleStanceContext);
    const decoded = masteryShareToData(share);

    expect(decoded.weaponType).toBe('spear');
    expect(decoded.keystoneUnlocked).toBe(true);
    expect(decoded.paragonLevel).toBe(28);
  });

  it('masteryShareToData defaults keystoneUnlocked to false and paragonLevel to 0', () => {
    const minimalShare = { wt: WEAPON_TYPE_DICT.indexOf('sword') };
    const decoded = masteryShareToData(minimalShare);
    expect(decoded.keystoneUnlocked).toBe(false);
    expect(decoded.paragonLevel).toBe(0);
  });

  it('masteryShareToData returns null for null input', () => {
    expect(masteryShareToData(null)).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// convertMasteryToStanceContext
// ---------------------------------------------------------------------------

describe('convertMasteryToStanceContext', () => {
  it('reconstructs a valid stanceContext from masteryData', () => {
    const masteryData = { weaponType: 'spear', keystoneUnlocked: true, paragonLevel: 42 };
    const ctx = convertMasteryToStanceContext(masteryData);

    expect(ctx).not.toBeNull();
    expect(ctx.activeStanceId).toBe('spear');
    expect(ctx.activeStance.id).toBe('spear');
    expect(ctx.activeStance.damageStatId).toBe('spearDamage');
    expect(ctx.activeStance.keystoneMonogramId).toBe('Bloodlust.Base');
    expect(ctx.activeStance.keystoneUnlocked).toBe(true);
    expect(ctx.activeStance.mastery).toBe(42);
    expect(ctx.stances.spear).toBe(ctx.activeStance);
  });

  it('returns null for null or missing weaponType', () => {
    expect(convertMasteryToStanceContext(null)).toBeNull();
    expect(convertMasteryToStanceContext({})).toBeNull();
    expect(convertMasteryToStanceContext({ weaponType: null })).toBeNull();
    expect(convertMasteryToStanceContext({ weaponType: 'unknownWeapon999' })).toBeNull();
  });

  it('full round-trip: stanceContext → share → decode → stanceContext', () => {
    const original = {
      activeStance: {
        id: 'sword', damageStatId: 'swordDamage',
        keystoneMonogramId: 'Shroud', monogramFamily: 'melee',
        totalSkill: 6000, keystoneUnlocked: true, mastery: 3,
      },
    };
    const share = createMasteryShare(original);
    const decoded = masteryShareToData(share);
    const restored = convertMasteryToStanceContext(decoded);

    expect(restored.activeStance.id).toBe('sword');
    expect(restored.activeStance.keystoneUnlocked).toBe(true);
    expect(restored.activeStance.mastery).toBe(3);
    expect(restored.activeStance.damageStatId).toBe('swordDamage');
    expect(restored.activeStance.keystoneMonogramId).toBe('Shroud');
  });
});

// ---------------------------------------------------------------------------
// encodeCharacterShare / decodeCharacterShare round-trip
// ---------------------------------------------------------------------------

describe('shareUrl — character share encode/decode', () => {
  it('round-trips a full payload (items + mastery)', () => {
    const payload = createCharacterSharePayload(
      [
        {
          id: 'item-1',
          rowName: 'Armor_Head_Zone_3_Helmet',
          type: 'Armor Head',
          displayName: 'Zone Helmet',
          slot: 'head',
          rarity: 2,
          tier: 30,
          baseStats: [{ stat: 'armor', value: 150 }, { stat: 'health', value: 500 }],
          monograms: [{ id: 'Bloodlust.Base', value: 1 }],
          affixPools: { inherent: [], pool1: [], pool2: [], pool3: [] },
          isLocked: false, isGenerated: true, stackCount: 1, charges: 0,
          specks: 0, upgradeCount: 0,
        },
      ],
      {
        activeStance: {
          id: 'spear', damageStatId: 'spearDamage',
          keystoneMonogramId: 'Bloodlust.Base',
          keystoneUnlocked: true, mastery: 10,
        },
      }
    );

    const encoded = encodeCharacterShare(payload);
    const decoded = decodeCharacterShare(encoded);

    expect(decoded).not.toBeNull();
    expect(decoded.v).toBe(CHARACTER_SHARE_VERSION);
    expect(decoded.e).toHaveLength(1);
    expect(decoded.sk).toBeDefined();

    const item = itemShareToItem(decoded.e[0], 0);
    expect(item.slot).toBe('head');
    expect(item.rarity).toBe(2);
    expect(item.tier).toBe(30);
    expect(item.baseStats[0].stat).toBe('armor');
    expect(item.baseStats[0].value).toBe(150);
    expect(item.monograms[0].id).toBe('Bloodlust.Base');

    const mastery = masteryShareToData(decoded.sk);
    expect(mastery.weaponType).toBe('spear');
    expect(mastery.keystoneUnlocked).toBe(true);
    expect(mastery.paragonLevel).toBe(10);
  });

  it('round-trips an items-only payload (no mastery)', () => {
    const payload = createCharacterSharePayload([
      {
        id: 'i', rowName: 'Ring_Basic', type: 'Ring', displayName: 'Ring',
        slot: 'ring', rarity: 1, tier: 5,
        baseStats: [{ stat: 'luck', value: 10 }],
        monograms: [],
        affixPools: { inherent: [], pool1: [], pool2: [], pool3: [] },
        isLocked: false, isGenerated: true, stackCount: 1, charges: 0,
        specks: 0, upgradeCount: 0,
      },
    ]);

    const encoded = encodeCharacterShare(payload);
    const decoded = decodeCharacterShare(encoded);

    expect(decoded.e).toHaveLength(1);
    expect(decoded.sk).toBeUndefined();
  });

  it('round-trips an empty payload', () => {
    const payload = createCharacterSharePayload([]);
    const encoded = encodeCharacterShare(payload);
    const decoded = decodeCharacterShare(encoded);

    expect(decoded).not.toBeNull();
    expect(decoded.v).toBe(CHARACTER_SHARE_VERSION);
    expect(decoded.e).toBeUndefined();
    expect(decoded.sk).toBeUndefined();
  });

  it('returns null for malformed input', () => {
    expect(decodeCharacterShare('not-valid-base64url!!!')).toBeNull();
    expect(decodeCharacterShare('')).toBeNull();
  });

  it('buildCharacterShareUrl produces a #character= URL', () => {
    const payload = { v: 1 };
    const url = buildCharacterShareUrl(payload, 'https://example.com/');
    expect(url).toMatch(/^https:\/\/example\.com\/#character=/);
  });

  it('rejects future version payloads', () => {
    // Simulate a payload from a future version
    const futurePayload = btoa(JSON.stringify({ v: 99, e: [] }))
      .replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
    expect(decodeCharacterShare(futurePayload)).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// Edge cases: decimal precision, raw-tag stat names, real-world data
// ---------------------------------------------------------------------------

describe('CharacterShareModel — edge cases', () => {
  it('preserves decimal stat values exactly through JSON round-trip', () => {
    const item = {
      id: 't', rowName: 'Head_Test', type: 'Head', displayName: 'Test',
      slot: 'head', rarity: 0, tier: 0,
      baseStats: [
        { stat: 'armor', value: 197.5757 },
        { stat: 'critChance', value: 0.31600076 },
        { stat: 'health', value: 5810.91354 },
      ],
      monograms: [],
      affixPools: { inherent: [], pool1: [], pool2: [], pool3: [] },
    };
    const share = createItemShare(item);
    // Simulate full encode→decode cycle (JSON stringify/parse as URL would)
    const cycled = JSON.parse(JSON.stringify(share));
    const restored = itemShareToItem(cycled, 0);

    expect(restored.baseStats[0].value).toBe(197.5757);
    expect(restored.baseStats[1].value).toBe(0.31600076);
    expect(restored.baseStats[2].value).toBe(5810.91354);
  });

  it('handles raw-tag stat names with % suffix (not in STAT_DICT)', () => {
    // Game data has tags like "OneHandedCritcalChance%" which aren't in the
    // stat registry (only the canonical "swordCritChance" is). These must
    // survive as fallback strings, not be silently dropped.
    const item = {
      id: 't', rowName: 'Weapon_Test', type: 'Weapon', displayName: 'Test',
      slot: 'weapon', rarity: 0, tier: 0,
      baseStats: [
        { stat: 'OneHandedCritcalChance%', value: 0.316 },
        { stat: 'PoleArmCriticalDamage%', value: 3.09 },
      ],
      monograms: [],
      affixPools: { inherent: [], pool1: [], pool2: [], pool3: [] },
    };
    const share = createItemShare(item);
    // Unknown stats stored as strings in the tuple
    expect(typeof share.bs[0][0]).toBe('string');
    expect(share.bs[0][0]).toBe('OneHandedCritcalChance%');

    const restored = itemShareToItem(share, 0);
    expect(restored.baseStats[0].stat).toBe('OneHandedCritcalChance%');
    expect(restored.baseStats[0].value).toBe(0.316);
    expect(restored.baseStats[1].stat).toBe('PoleArmCriticalDamage%');
  });

  it('handles monograms with null, undefined, and numeric values', () => {
    const item = {
      id: 't', rowName: 'Ring_Test', type: 'Ring', displayName: 'Test',
      slot: 'ring', rarity: 0, tier: 0,
      baseStats: [],
      monograms: [
        { id: 'Bloodlust.Base', value: 1 },
        { id: 'AllowPhasing', value: null },
        { id: 'DarkEssence', value: undefined },
      ],
      affixPools: { inherent: [], pool1: [], pool2: [], pool3: [] },
    };
    const share = createItemShare(item);
    const restored = itemShareToItem(JSON.parse(JSON.stringify(share)), 0);

    expect(restored.monograms).toHaveLength(3);
    expect(restored.monograms[0]).toEqual({ id: 'Bloodlust.Base', value: 1 });
    expect(restored.monograms[1]).toEqual({ id: 'AllowPhasing', value: null });
    expect(restored.monograms[2]).toEqual({ id: 'DarkEssence', value: null });
  });

  it('handles items with zero-length rowName gracefully', () => {
    const item = {
      id: 't', rowName: '', type: '', displayName: '',
      slot: 'head', rarity: 0, tier: 0,
      baseStats: [], monograms: [],
      affixPools: { inherent: [], pool1: [], pool2: [], pool3: [] },
    };
    const share = createItemShare(item);
    const restored = itemShareToItem(share, 0);
    expect(restored.rowName).toBe('');
    expect(restored.id).toBe('share-0-');
  });
});

// ---------------------------------------------------------------------------
// Real-world: full equipped set round-trip from fixture data
// ---------------------------------------------------------------------------

describe('CharacterShareModel — real-world fixture round-trip', () => {
  // eslint-disable-next-line global-require
  let equipped;
  try {
    const { extractEquippedItems } = require('../src/utils/equipmentParser.js');
    const saveData = require('./fixtures/dr-full-inventory.json');
    equipped = extractEquippedItems(saveData);
  } catch {
    equipped = null;
  }

  it('round-trips all equipped items from fixture', () => {
    if (!equipped || equipped.length === 0) return; // skip if fixture missing

    const payload = createCharacterSharePayload(equipped);
    const encoded = encodeCharacterShare(payload);
    const decoded = decodeCharacterShare(encoded);

    expect(decoded.e).toHaveLength(equipped.length);

    for (let i = 0; i < equipped.length; i++) {
      const original = equipped[i];
      const restored = itemShareToItem(decoded.e[i], i);

      expect(restored.slot).toBe(original.slot);
      expect(restored.rowName).toBe(original.rowName);
      expect(restored.rarity).toBe(original.rarity);
      expect(restored.baseStats.length).toBe(original.baseStats.length);
      expect(restored.monograms.length).toBe(original.monograms.length);

      // Verify every stat value is exactly preserved
      for (let j = 0; j < original.baseStats.length; j++) {
        expect(restored.baseStats[j].value).toBe(original.baseStats[j].value);
      }
    }
  });

  it('URL payload size is reasonable for full build share', () => {
    if (!equipped || equipped.length === 0) return;

    const payload = createCharacterSharePayload(equipped);
    const encoded = encodeCharacterShare(payload);
    // A full build URL should be under 8KB (well within browser URL limits)
    expect(encoded.length).toBeLessThan(8192);
    // Log actual size for visibility
    console.log(`Full build payload size: ${encoded.length} chars (${equipped.length} items)`);
  });
});
