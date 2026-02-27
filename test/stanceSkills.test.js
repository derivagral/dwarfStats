import { describe, it, expect } from 'vitest';
import fixtureData from './fixtures/dr-full-inventory.json';
import { extractEquippedItems } from '../src/utils/equipmentParser.js';
import {
  parseStanceContext,
  inferWeaponStance,
  parseAllocatedAttributes,
  STANCE_KEYSTONE_BREAKPOINT,
  STANCE_MASTERY_STEP,
} from '../src/utils/stanceSkills.js';

describe('stance skill parsing', () => {
  it('detects active stance from equipped weapon row name', () => {
    const equipped = extractEquippedItems(fixtureData);
    expect(inferWeaponStance(equipped)).toBe('maul');
  });

  it('treats axes as two-hand stance', () => {
    const stanceId = inferWeaponStance([{ slot: 'weapon', rowName: 'Weapon_Axe_GM5' }]);
    expect(stanceId).toBe('twohand');
  });

  it('maps polearms to maul stance', () => {
    const stanceId = inferWeaponStance([{ slot: 'weapon', rowName: 'Weapon_Polearm_GM5' }]);
    expect(stanceId).toBe('maul');
  });

  it('maps legacy staff variants to maul and regular staff to magery', () => {
    expect(inferWeaponStance([{ slot: 'weapon', rowName: 'Weapon_Staff_Legacy_GM1' }])).toBe('maul');
    expect(inferWeaponStance([{ slot: 'weapon', rowName: 'Weapon_Staff_Magery_GM1' }])).toBe('magery');
  });

  it('parses stance totals, keystone, and mastery levels from host player data', () => {
    const equipped = extractEquippedItems(fixtureData);
    const context = parseStanceContext(fixtureData, equipped);

    expect(context.activeStanceId).toBe('maul');
    expect(context.activeStance.monogramFamily).toBe('melee');
    expect(context.stances.maul.totalSkill).toBe(261870);
    expect(context.stances.maul.keystoneUnlocked).toBe(true);

    const expectedMastery = Math.floor((261870 - STANCE_KEYSTONE_BREAKPOINT) / STANCE_MASTERY_STEP);
    expect(context.stances.maul.mastery).toBe(expectedMastery);
    expect(context.activeStance.mastery).toBe(expectedMastery);
  });

  it('maps one-hand keystone to Shroud when unlocked', () => {
    const save = {
      root: {
        properties: {
          HostPlayerData_0: {
            Struct: {
              Struct: {
                OneHandSkill_0: { Int64: 5500 },
              },
            },
          },
        },
      },
    };

    const context = parseStanceContext(save, [{ slot: 'weapon', rowName: 'Weapon_1H_Test' }]);
    expect(context.activeStance.keystoneUnlocked).toBe(true);
    expect(context.activeStance.keystoneAbility).toBe('Shroud');
    expect(context.activeStance.keystoneMonogramId).toBe('Shroud');
  });

  it('uses zero mastery below keystone breakpoint', () => {
    const save = {
      root: {
        properties: {
          HostPlayerData_0: {
            Struct: {
              Struct: {
                SpearSkill_0: { Int64: 4999 },
              },
            },
          },
        },
      },
    };

    const context = parseStanceContext(save, [{ slot: 'weapon', rowName: 'Weapon_Spear_Test' }]);
    expect(context.activeStance.keystoneUnlocked).toBe(false);
    expect(context.activeStance.mastery).toBe(0);
  });
});

describe('allocated attributes parsing', () => {
  it('extracts allocated stat points from full fixture', () => {
    const attrs = parseAllocatedAttributes(fixtureData);
    // Fixture has 741 points in Luck
    expect(attrs.luck).toBeDefined();
    expect(attrs.luck.value).toBe(741);
    expect(attrs.luck.sourceName).toBe('Allocated Points');
  });

  it('returns empty object for missing save data', () => {
    expect(parseAllocatedAttributes(null)).toEqual({});
    expect(parseAllocatedAttributes({})).toEqual({});
  });

  it('resolves known attribute tags to proper stat IDs', () => {
    const save = {
      root: {
        properties: {
          HostPlayerData_0: {
            Struct: {
              Struct: {
                'Attributes_21_TEST_0': {
                  Array: {
                    Struct: {
                      type_: 'StructProperty',
                      struct_type: { Struct: 'STR_Attribute' },
                      id: 'test',
                      value: [
                        {
                          Struct: {
                            'GameplayTag_2_TEST_0': {
                              Struct: {
                                Struct: {
                                  TagName_0: {
                                    Name: 'EasyRPG.Attributes.Characteristics.Strength',
                                  },
                                },
                              },
                            },
                            'Value_5_TEST_0': { Float: 200 },
                          },
                        },
                        {
                          Struct: {
                            'GameplayTag_2_TEST2_0': {
                              Struct: {
                                Struct: {
                                  TagName_0: {
                                    Name: 'EasyRPG.Attributes.Characteristics.Dexterity',
                                  },
                                },
                              },
                            },
                            'Value_5_TEST2_0': { Float: 100 },
                          },
                        },
                      ],
                    },
                  },
                },
              },
            },
          },
        },
      },
    };

    const attrs = parseAllocatedAttributes(save);
    expect(attrs.strength).toEqual({ value: 200, sourceName: 'Allocated Points' });
    expect(attrs.dexterity).toEqual({ value: 100, sourceName: 'Allocated Points' });
  });
});
