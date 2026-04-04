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
  STAT_DICT, MONOGRAM_DICT, WEAPON_SKILL_DICT, KEYSTONE_DICT,
  SLOT_DICT, WEAPON_TYPE_DICT,
} from '../src/utils/shareCodec.js';

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
    expect(WEAPON_SKILL_DICT.length).toBeGreaterThan(0);
    expect(KEYSTONE_DICT.length).toBeGreaterThan(0);
    expect(SLOT_DICT.length).toBeGreaterThan(0);
    expect(WEAPON_TYPE_DICT.length).toBeGreaterThan(0);
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
// createMasteryShare / masteryShareToData round-trip
// ---------------------------------------------------------------------------

describe('CharacterShareModel — mastery round-trip', () => {
  const sampleSkillTree = {
    weaponStances: {
      spear: {
        skills: [
          { rowName: 'SpearsQ', level: 1 },
          { rowName: 'SpearsDamage', level: 5 },
        ],
      },
    },
    keystones: ['closeDistance', 'meleeMasteryDamage'],
  };

  it('round-trips weapon type and skills', () => {
    const share = createMasteryShare(sampleSkillTree);
    const restored = masteryShareToData(share);

    expect(restored.weaponType).toBe('spear');
    expect(restored.weaponSkills).toHaveLength(2);
    expect(restored.weaponSkills[0]).toEqual({ rowName: 'SpearsQ', level: 1 });
    expect(restored.weaponSkills[1]).toEqual({ rowName: 'SpearsDamage', level: 5 });
  });

  it('round-trips keystones', () => {
    const share = createMasteryShare(sampleSkillTree);
    const restored = masteryShareToData(share);

    expect(restored.keystones).toEqual(['closeDistance', 'meleeMasteryDamage']);
  });

  it('returns null for null input', () => {
    expect(createMasteryShare(null)).toBeNull();
    expect(masteryShareToData(null)).toBeNull();
  });

  it('preserves unknown skill rowNames as strings', () => {
    const withFutureSkill = {
      weaponStances: {
        spear: {
          skills: [{ rowName: 'FutureSpearSkill_99', level: 3 }],
        },
      },
    };
    const share = createMasteryShare(withFutureSkill);
    const restored = masteryShareToData(share);
    expect(restored.weaponSkills[0].rowName).toBe('FutureSpearSkill_99');
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
        weaponStances: {
          spear: { skills: [{ rowName: 'SpearsQ', level: 1 }] },
        },
        keystones: ['farDistance'],
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
    expect(mastery.keystones).toContain('farDistance');
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
});
