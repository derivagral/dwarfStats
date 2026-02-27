import { describe, it, expect } from 'vitest';
import fixtureData from './fixtures/dr-full-inventory.json';
import { extractEquippedItems } from '../src/utils/equipmentParser.js';
import {
  parseStanceContext,
  inferWeaponStance,
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
