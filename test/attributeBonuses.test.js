import { describe, expect, it } from 'vitest';
import fixtureData from './fixtures/dr-full-inventory.json';
import { ATTRIBUTE_BONUSES, getAttributeBonusEffect } from '../src/utils/attributeBonuses.js';
import { calculateDerivedStats } from '../src/utils/derivedStats.js';
import { parseAllocatedAttributes } from '../src/utils/stanceSkills.js';

describe('primary attribute bonuses', () => {
  it('resolves all DT_Attributes characteristic dependencies', () => {
    expect(Object.keys(ATTRIBUTE_BONUSES)).toEqual([
      'strength', 'dexterity', 'wisdom', 'endurance', 'agility', 'luck', 'stamina',
    ]);

    expect(getAttributeBonusEffect('strength', 'armorBonus').valuePerPoint).toBe(0.001);
    expect(getAttributeBonusEffect('dexterity', 'attackSpeed').valuePerPoint).toBe(0.01);
    expect(getAttributeBonusEffect('wisdom', 'bossBonus').valuePerPoint).toBe(0.0005);
    expect(getAttributeBonusEffect('endurance', 'energyRegen').valuePerPoint).toBe(0.01);
    expect(getAttributeBonusEffect('agility', 'critDamage').valuePerPoint).toBe(0.0005);
    expect(getAttributeBonusEffect('luck', 'xpBonus').valuePerPoint).toBe(0.001);
    expect(getAttributeBonusEffect('luck', 'arcaneDamageBonus').valuePerPoint).toBe(0.001);
    expect(getAttributeBonusEffect('luck', 'fireDamageBonus').valuePerPoint).toBe(0.001);
    expect(getAttributeBonusEffect('luck', 'lightningDamageBonus').valuePerPoint).toBe(0.001);
    expect(getAttributeBonusEffect('stamina', 'healthBonus').valuePerPoint).toBe(0.0001);
    expect(getAttributeBonusEffect('stamina', 'healthRegen').valuePerPoint).toBe(0.01);
  });

  it('feeds every primary attribute into its real target stat', () => {
    const result = calculateDerivedStats({
      strength: 100,
      dexterity: 100,
      wisdom: 100,
      endurance: 100,
      agility: 100,
      luck: 100,
      stamina: 100,
      armor: 100,
      health: 1000,
    });

    expect(result.totalArmor).toBe(110);                 // +10% from Strength
    expect(result.effectiveAttackSpeed).toBeCloseTo(0.5); // +100 AS, then 50% effectiveness
    expect(result.totalBossBonus).toBeCloseTo(0.05);     // +5% from Wisdom
    expect(result.edpsBD).toBeCloseTo(1.05);
    expect(result.totalEnergyRegen).toBeCloseTo(1);      // +1.0/s from Endurance
    expect(result.totalCritDamage).toBeCloseTo(0.05);    // +5% from Agility
    expect(result.edpsPhysAdditive).toBeCloseTo(0.05);
    expect(result.totalXpBonus).toBeCloseTo(0.1);        // +10% from Luck
    expect(result.totalArcaneDamageBonus).toBeCloseTo(0.1);
    expect(result.totalFireDamageBonus).toBeCloseTo(0.1);
    expect(result.totalLightningDamageBonus).toBeCloseTo(0.1);
    // Element routing: only the single active element reaches ED (no pet conversion)
    expect(result.edpsED).toBeCloseTo(1.1);
    expect(result.totalHealth).toBeCloseTo(1010);        // +1% from Stamina
    expect(result.totalHealthRegen).toBeCloseTo(1);      // +1.0/s from Stamina
  });

  it('applies the fixture Luck allocation to XP and all three elements', () => {
    const luck = parseAllocatedAttributes(fixtureData).luck.value;
    expect(luck).toBe(741);

    const result = calculateDerivedStats({ luck });
    expect(result.luckXpBonus).toBeCloseTo(0.741);
    expect(result.luckArcaneDamageBonus).toBeCloseTo(0.741);
    expect(result.luckFireDamageBonus).toBeCloseTo(0.741);
    expect(result.luckLightningDamageBonus).toBeCloseTo(0.741);
    // Luck feeds all three, but ED only counts the active element
    expect(result.edpsED).toBeCloseTo(1.741);
  });
});

