import { describe, it, expect } from 'vitest';
import {
  calculateCampaignHealth,
  calculateLevelHealth,
  parseCharacterLevel,
  parseCompletedRuptures,
  parseHealthProgression,
} from '../src/utils/healthParser.js';

function makeSave(level, completedRuptures = []) {
  return {
    root: {
      properties: {
        HostPlayerData_0: {
          Struct: {
            Struct: {
              Level_11_TEST_0: { Int: level },
            },
          },
        },
        'Completed Ruptures_0': {
          Array: { Base: { Int: completedRuptures } },
        },
      },
    },
  };
}

describe('health progression parsing', () => {
  it('applies +2 health through level 100 and +1 thereafter', () => {
    expect(calculateLevelHealth(1)).toBe(102);
    expect(calculateLevelHealth(100)).toBe(300);
    expect(calculateLevelHealth(101)).toBe(301);
    expect(calculateLevelHealth(560)).toBe(760);
    expect(calculateLevelHealth(0)).toBe(0);
  });

  it('reads character level and completed ruptures from save JSON', () => {
    const save = makeSave(560, [1, 6, 12, 18, 24, 30, 36, 160]);
    expect(parseCharacterLevel(save)).toBe(560);
    expect(parseCompletedRuptures(save)).toEqual([1, 6, 12, 18, 24, 30, 36, 160]);
  });

  it('awards 100 flat health for each of the six campaign bosses', () => {
    expect(calculateCampaignHealth([6, 12, 18, 24, 30, 36])).toBe(600);
    expect(calculateCampaignHealth([1, 6, 7, 12, 160])).toBe(200);
  });

  it('reconstructs the observed level-560 progression pool', () => {
    const result = parseHealthProgression(makeSave(560, [6, 12, 18, 24, 30, 36]));
    expect(result.levelHealth).toBe(760);
    expect(result.campaignHealth).toBe(600);
    expect(result.totalFlatHealth).toBe(1360);
    expect(result.campaignBosses).toEqual([6, 12, 18, 24, 30, 36]);
  });
});
