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

  it('parses stance totals, keystone, and mastery levels from host player data', () => {
    const equipped = extractEquippedItems(fixtureData);
    const context = parseStanceContext(fixtureData, equipped);

    expect(context.activeStanceId).toBe('maul');
    expect(context.stances.maul.totalSkill).toBe(261870);
    expect(context.stances.maul.keystoneUnlocked).toBe(true);

    const expectedMastery = Math.floor((261870 - STANCE_KEYSTONE_BREAKPOINT) / STANCE_MASTERY_STEP);
    expect(context.stances.maul.mastery).toBe(expectedMastery);
    expect(context.activeStance.mastery).toBe(expectedMastery);
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
