import { describe, it, expect } from 'vitest';
import {
  transformItem,
  transformAllItems,
  isItemStruct,
  isWeaponType,
  WEAPON_PATTERNS,
} from '../src/models/itemTransformer.js';
import { Rarity } from '../src/models/Item.js';

describe('itemTransformer', () => {
  describe('isItemStruct', () => {
    it('should identify valid item structures', () => {
      const validItem = {
        'ItemHandle_50_XXX': {
          Struct: {
            Struct: {
              DataTable_0: {
                Object: '/Game/EasySurvivalRPG/Blueprints/DataTables/DT_Items.DT_Items',
              },
              RowName_0: {
                Name: 'Armor_Helmet_Zone_1_Common',
              },
            },
          },
        },
      };

      expect(isItemStruct(validItem)).toBe(true);
    });

    it('should reject non-item structures', () => {
      expect(isItemStruct(null)).toBe(false);
      expect(isItemStruct({})).toBe(false);
      expect(isItemStruct({ someOtherKey: 'value' })).toBe(false);
    });

    it('should reject items with wrong DataTable', () => {
      const wrongTable = {
        'ItemHandle_50_XXX': {
          Struct: {
            Struct: {
              DataTable_0: {
                Object: '/Game/SomeOther/Table.Table',
              },
            },
          },
        },
      };

      expect(isItemStruct(wrongTable)).toBe(false);
    });
  });

  describe('isWeaponType', () => {
    it('should identify weapon types', () => {
      expect(isWeaponType('Weapon Sword')).toBe(true);
      expect(isWeaponType('Weapon Bow')).toBe(true);
      expect(isWeaponType('Weapon Staff')).toBe(true);
      expect(isWeaponType('Weapon Axe')).toBe(true);
      expect(isWeaponType('Mage Wand')).toBe(true);
    });

    it('should not identify armor as weapons', () => {
      expect(isWeaponType('Armor Helmet')).toBe(false);
      expect(isWeaponType('Armor Chest')).toBe(false);
      expect(isWeaponType('Jewelry Ring')).toBe(false);
    });

    it('should handle null/undefined', () => {
      expect(isWeaponType(null)).toBe(false);
      expect(isWeaponType(undefined)).toBe(false);
      expect(isWeaponType('')).toBe(false);
    });
  });

  describe('transformItem', () => {
    const createMockItemStruct = (overrides = {}) => ({
      'ItemHandle_50_XXX': {
        Struct: {
          Struct: {
            DataTable_0: {
              Object: '/Game/EasySurvivalRPG/Blueprints/DataTables/DT_Items.DT_Items',
            },
            RowName_0: {
              Name: overrides.rowName || 'Armor_Bracers_Zone_4_Legendary',
            },
          },
        },
      },
      'GeneratedName_57_XXX': {
        Str: overrides.generatedName || 'Test Bracers of Power',
      },
      'Amount_10_XXX': {
        Int: overrides.amount || 1,
      },
      'Rarity_70_XXX': {
        Byte: {
          Label: overrides.rarity || 'E_Rarity::NewEnumerator3', // Rare
        },
      },
      'ItemTier_80_XXX': {
        Int: overrides.tier || 4,
      },
      'GeneratedAttributes_62_XXX': {
        Array: {
          Struct: {
            value: overrides.attributes || [
              {
                Struct: {
                  'GameplayTag_0': {
                    Struct: {
                      Struct: {
                        'TagName_0': {
                          Name: 'EasyRPG.Attributes.Strength',
                        },
                      },
                    },
                  },
                  'Value_0': { Float: 150 },
                },
              },
              {
                Struct: {
                  'GameplayTag_0': {
                    Struct: {
                      Struct: {
                        'TagName_0': {
                          Name: 'EasyRPG.Attributes.Vitality',
                        },
                      },
                    },
                  },
                  'Value_0': { Float: 75 },
                },
              },
            ],
          },
        },
      },
      ...overrides.extra,
    });

    it('should extract basic item properties', () => {
      const rawStruct = createMockItemStruct();
      const item = transformItem(rawStruct, 0);

      expect(item.rowName).toBe('Armor_Bracers_Zone_4_Legendary');
      expect(item.displayName).toBe('Test Bracers of Power');
      expect(item.type).toBe('Armor Bracers');
      expect(item.tier).toBe(4);
    });

    it('should parse rarity from enum label', () => {
      const common = transformItem(createMockItemStruct({
        rarity: 'E_Rarity::NewEnumerator0',
      }));
      expect(common.rarity).toBe(Rarity.COMMON);

      const rare = transformItem(createMockItemStruct({
        rarity: 'E_Rarity::NewEnumerator2',
      }));
      expect(rare.rarity).toBe(Rarity.RARE);

      const epic = transformItem(createMockItemStruct({
        rarity: 'E_Rarity::NewEnumerator3',
      }));
      expect(epic.rarity).toBe(Rarity.EPIC);

      const legendary = transformItem(createMockItemStruct({
        rarity: 'E_Rarity::NewEnumerator4',
      }));
      expect(legendary.rarity).toBe(Rarity.LEGENDARY);
    });

    it('should extract base stats from GeneratedAttributes', () => {
      const rawStruct = createMockItemStruct();
      const item = transformItem(rawStruct, 0);

      expect(item.baseStats.length).toBe(2);
      expect(item.baseStats[0].stat).toBe('Strength');
      expect(item.baseStats[0].value).toBe(150);
      expect(item.baseStats[1].stat).toBe('Vitality');
      expect(item.baseStats[1].value).toBe(75);
    });

    it('should separate monograms from base stats', () => {
      const rawStruct = createMockItemStruct({
        attributes: [
          {
            Struct: {
              'GameplayTag_0': {
                Struct: {
                  Struct: {
                    'TagName_0': {
                      Name: 'EasyRPG.Attributes.Strength',
                    },
                  },
                },
              },
              'Value_0': { Float: 100 },
            },
          },
          {
            Struct: {
              'GameplayTag_0': {
                Struct: {
                  Struct: {
                    'TagName_0': {
                      Name: 'EasyRPG.Items.Modifiers.Phasing.Base',
                    },
                  },
                },
              },
              'Value_0': { Float: 1 },
            },
          },
        ],
      });

      const item = transformItem(rawStruct, 0);

      // Strength should be in baseStats
      expect(item.baseStats.length).toBe(1);
      expect(item.baseStats[0].stat).toBe('Strength');

      // Phasing should be in monograms
      expect(item.monograms.length).toBe(1);
      expect(item.monograms[0].id).toBe('Phasing.Base');
    });

    it('should normalize %6 suffix in monogram IDs', () => {
      const rawStruct = createMockItemStruct({
        attributes: [
          {
            Struct: {
              'GameplayTag_0': {
                Struct: {
                  Struct: {
                    'TagName_0': {
                      // %6 is how the save file encodes %
                      Name: 'EasyRPG.Items.Modifiers.ElementalToHp%6.Fire',
                    },
                  },
                },
              },
              'Value_0': { Float: 1 },
            },
          },
        ],
      });

      const item = transformItem(rawStruct, 0);

      expect(item.monograms[0].id).toBe('ElementalToHp%.Fire');
    });

    it('should generate unique IDs', () => {
      const rawStruct = createMockItemStruct();
      const item1 = transformItem(rawStruct, 0);
      const item2 = transformItem(rawStruct, 1);

      expect(item1.id).not.toBe(item2.id);
    });

    it('should fix Jewlery typo in type', () => {
      const rawStruct = createMockItemStruct({
        rowName: 'Jewlery_Ring_Zone_3_Rare',
      });
      const item = transformItem(rawStruct, 0);

      expect(item.type).toBe('Jewelry Ring');
    });
  });

  describe('transformAllItems', () => {
    it('should find and transform all items in save data', () => {
      // Minimal save structure with one item
      const saveData = {
        root: {
          properties: {
            SomeArray_0: {
              Array: {
                Struct: {
                  value: [
                    {
                      Struct: {
                        'ItemHandle_50_XXX': {
                          Struct: {
                            Struct: {
                              DataTable_0: {
                                Object: '/Game/EasySurvivalRPG/Blueprints/DataTables/DT_Items.DT_Items',
                              },
                              RowName_0: {
                                Name: 'Armor_Helmet_Zone_1_Common',
                              },
                            },
                          },
                        },
                        'GeneratedName_57_XXX': {
                          Str: 'Test Helmet',
                        },
                      },
                    },
                  ],
                },
              },
            },
          },
        },
      };

      const result = transformAllItems(saveData);

      expect(result.totalCount).toBe(1);
      expect(result.items[0].displayName).toBe('Test Helmet');
      expect(result.items[0].type).toBe('Armor Helmet');
    });

    it('should handle string JSON input', () => {
      const saveData = {
        root: {
          properties: {},
        },
      };

      const result = transformAllItems(JSON.stringify(saveData));

      expect(result.totalCount).toBe(0);
      expect(result.items).toEqual([]);
    });
  });
});
