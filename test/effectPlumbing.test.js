import { describe, expect, it } from 'vitest';
import React from 'react';
import { renderToString } from 'react-dom/server';
import { useDerivedStats, resolveStatId } from '../src/hooks/useDerivedStats.js';
import { calculateDerivedStats, DERIVED_STATS, getCalculationOrder } from '../src/utils/derivedStats.js';
import { findStatForAttribute } from '../src/utils/statRegistry.js';
import { parseStanceContext, convertMasteryToStanceContext } from '../src/utils/stanceSkills.js';
import { extractEquippedItems } from '../src/utils/equipmentParser.js';
import { extractSkillTree } from '../src/utils/skillTreeParser.js';
import { createCharacterSharePayload, itemShareToItem, masteryShareToData,
  allocatedAttributesShareToData, skillTreeShareToData } from '../src/models/CharacterShareModel.js';
import { encodeCharacterShareCompressed, decodeCharacterShareAny } from '../src/utils/shareUrl.js';
import fixture from './fixtures/dr-full-inventory.json';

function probe(options) {
  let result;
  function Probe() { result = useDerivedStats(options); return null; }
  renderToString(React.createElement(Probe));
  return result;
}
const stat = (rawTag, value) => ({ rawTag, value });
const item = (slot, monograms = [], baseStats = [], rowName = `${slot}_test`) => ({
  slot, rowName, baseStats, monograms: monograms.map(id => ({ id, value: 1 })),
});
async function sharedOptions(options) {
  const payload = createCharacterSharePayload(options.equippedItems, options.stanceContext,
    options.characterStats, options.maxHealth, options.skillTree);
  const decoded = await decodeCharacterShareAny(await encodeCharacterShareCompressed(payload));
  return {
    equippedItems: decoded.e.map(itemShareToItem),
    stanceContext: convertMasteryToStanceContext(masteryShareToData(decoded.sk)),
    characterStats: allocatedAttributesShareToData(decoded.at),
    skillTree: skillTreeShareToData(decoded.st), maxHealth: decoded.hp || 0,
  };
}

describe('effect identity through imports, overrides and sharing', () => {
  it('uses the same ability-specific stat on both resolution paths', () => {
    const tag = 'EasyRPG.Attributes.Abilities.ElectricDragons.DamageMultiplier';
    expect(resolveStatId(tag)).toBe('electricDragonsDamage');
    expect(resolveStatId(tag)).toBe(findStatForAttribute(tag).id);
    expect(resolveStatId('electricDragonsDamage')).toBe('electricDragonsDamage');
    expect(resolveStatId('EasyRPG.Attributes.Base.EnergyRegeneration%')).toBe('energyRegenBonus');
  });

  it('preserves ability modifiers and the complete fixture calculation across a share', async () => {
    const equippedItems = extractEquippedItems(fixture);
    const options = { equippedItems, stanceContext: parseStanceContext(fixture, equippedItems), skillTree: extractSkillTree(fixture) };
    const direct = probe(options);
    const shared = probe(await sharedOptions(options));
    expect(shared.offhandAbilities).toEqual(direct.offhandAbilities);
    expect(shared.offhandAbilities.abilities[0].affinities).toContain('Area');
    expect(shared.values).toEqual(direct.values);
  });

  it('routes one ability consistently instead of pooling unrelated affinities or elements', () => {
    const options = {
      characterStats: { elementalDamage: 100, fireDamageBonus: 10, lightningDamageBonus: 1,
        dragonAffinityDamage: 0.2, orbitAffinityDamage: 0.3, totemAffinityDamage: 10 },
      equippedItems: [
        item('offhand', [], [stat('EasyRPG.Attributes.Abilities.ElectricDragons.DamageMultiplier', 1)]),
        item('offhand', [], [stat('EasyRPG.Attributes.Abilities.ElectricDragons.DamageMultiplier', 2)]),
        item('offhand', [], [stat('EasyRPG.Attributes.Abilities.FieryTotem.DamageMultiplier', 20)]),
      ],
    };
    const result = probe(options);
    expect(result.configOverrides.edpsED.activeElement).toBe('lightning');
    expect(result.values.edpsED).toBe(2);
    expect(result.values.edpsElemAdditive).toBeCloseTo(3.5);
    expect(result.configOverrides.edpsElemAdditive.activeAffinities).not.toContain('Totem');
    const removed = probe({ ...options, itemOverrides: { offhand1: { removedIndices: [0] }, offhand2: { removedIndices: [0] } } });
    expect(removed.offhandAbilities.abilities.map(a => a.key)).toEqual(['FieryTotem']);
    expect(removed.configOverrides.edpsED.activeElement).toBe('fire');
  });
});

describe('Spear mastery and chained monograms', () => {
  const equippedItems = [
    item('weapon', [], [stat('EasyRPG.Attributes.Base.Damage', 100), stat('EasyRPG.Attributes.Base.ElementalDamage', 50)], 'weapon_spear_test'),
    item('head', ['DarkEssence', 'BonusCritChance%ForEssence', 'BonusCritDamage%ForEssence']),
    item('pants', ['GainCritChanceForHighest', 'CritChanceForEnergyRegen', 'ElementForCritChance.Fire']),
    item('neck', ['ExtraEnergyAddDamage', 'EliteBuffs.Energy', 'Bloodlust.Damage%PerStack']),
    item('bracer', ['ElementForCritChance.Lightning', 'GainCritDamageForCritChance']),
  ];
  // Exercise the save-side mastery parser, not a hand-built keystone flag.
  const save = { properties: { HostPlayerData_0: { Struct: { Struct: { SpearSkill_0: { Int64: 5000 } } } } } };
  const options = {
    equippedItems, stanceContext: parseStanceContext(save, equippedItems),
    characterStats: { strength: 1000, endurance: 1000, critChance: 0.8, energyRegen: 20, energyRegenBonus: 0.5, maxEnergy: 40 },
    skillTree: { weaponStances: { spear: { skills: [{ rowName: 'SpearCritDamage', level: 1 }] } } },
  };

  it('carries the free Bloodlust, Dark Essence and energy chains into on-hit exactly once', () => {
    const { values: v, summary } = probe(options);
    expect(v.bloodlustStacks).toBe(100);
    expect(v.bloodlustCritDamageBonus).toBe(500);
    expect(v.bloodlustPhysicalDamageBonus).toBe(200);
    expect(v.bloodlustDrawBloodBonus).toBe(0); // Bloodlust alone does not grant Blood stacks
    expect(v.essence).toBe(1250);
    expect(v.critChanceFromEssence).toBe(93);
    expect(v.critChanceFromHighest).toBe(20);
    expect(v.critDamageFromEssence).toBe(187.5);
    expect(v.totalEnergyRegen).toBe(45);
    expect(v.totalCritChance).toBeCloseTo(2.38);
    expect(v.fireFromCritChance).toBeCloseTo(414);
    expect(v.lightningFromCritChance).toBeCloseTo(414);
    expect(v.critDamageFromOvercrit).toBeCloseTo(138);
    expect(v.finalCritDamage).toBeCloseTo(8.255);
    expect(v.edpsPhysAdditive).toBeCloseTo(10.255);
    expect(v.edpsElemCrit).toBeCloseTo(9.255);
    expect(v.totalMaxEnergy).toBe(240);
    expect(v.energyDamageBonus).toBe(420);
    expect(v.edpsElemFlat).toBe(470);
    expect(summary.critChance).toBe(v.totalCritChance);
    expect(summary.critDamage).toBe(v.finalCritDamage);
  });

  it('preserves pants, all monogram positions and the resulting chains in shared builds', async () => {
    const shared = await sharedOptions(options);
    expect(shared.equippedItems.find(i => i.slot === 'pants').monograms).toHaveLength(3);
    expect(probe(shared).values).toEqual(probe(options).values);
  });

  it('does not double free Bloodlust when a monogram also grants it', () => {
    const extra = [...equippedItems, item('ring', ['Bloodlust.Base'])];
    expect(probe({ ...options, equippedItems: extra }).values).toEqual(probe(options).values);
  });

  it('turns mastery Bloodlust off below its unlock, with downstream damage responding', () => {
    const low = structuredClone(save);
    low.properties.HostPlayerData_0.Struct.Struct.SpearSkill_0.Int64 = 4999;
    const v = probe({ ...options, stanceContext: parseStanceContext(low, equippedItems) }).values;
    expect(v.bloodlustStacks).toBe(0);
    expect(v.bloodlustPhysicalDamageBonus).toBe(0);
    expect(v.finalCritDamage).toBeCloseTo(3.255);
  });

  it('requires Draw Blood before its extra physical bonus can apply', () => {
    const added = probe({ ...options, equippedItems: [...equippedItems, item('ring', ['Bloodlust.DrawBlood'])] });
    expect(added.values.bloodlustDrawBloodBonus).toBe(100);
    expect(added.values.edpsPhysAdditive).toBeCloseTo(probe(options).values.edpsPhysAdditive + 1);
  });

  it('preserves the existing fire-overcrit-to-life chain after splitting elemental effects', () => {
    const v = probe({ ...options, equippedItems: [...equippedItems, item('ring', ['ElementalToHp%.Fire'])] }).values;
    expect(v.lifeFromElement).toBe(26); // floor(414 / 30) × 2
  });

  it('keeps simultaneous elemental overcrit effects scoped and independent of item order', () => {
    const forward = probe(options).values;
    const reversed = probe({ ...options, equippedItems: [...equippedItems].reverse() }).values;
    expect(reversed).toEqual(forward);
    const noFire = probe({ ...options, itemOverrides: { pants: { monogramSlots: ['GainCritChanceForHighest', 'CritChanceForEnergyRegen', null] } } }).values;
    expect(noFire.fireFromCritChance).toBe(0);
    expect(noFire.lightningFromCritChance).toBeCloseTo(414);
  });
});

describe('dependency and comparison guards', () => {
  it('gates paragon grants individually and feeds armor/health into their consumers', () => {
    const stanceContext = convertMasteryToStanceContext({ weaponType: 'spear', keystoneUnlocked: true, paragonLevel: 10 });
    const armor = probe({ stanceContext, equippedItems: [item('head', ['MeleeParagon.Armor', 'CritDamageForArmor'])], characterStats: { armor: 400, health: 1000 } });
    expect(armor.values.paragonArmorBonus).toBe(150);
    expect(armor.values.paragonDamageBonus).toBe(0);
    expect(armor.values.paragonHpBonus).toBe(0);
    expect(armor.values.totalArmor).toBe(1100); // 550 flat × (1 + 100% Bloodlust)
    expect(armor.values.critDamageFromArmor).toBe(2);
    const hp = probe({ stanceContext, equippedItems: [item('head', ['MeleeParagon.MaxHp', 'GainDamageForHPLoseArmor'])], characterStats: { health: 1000 } });
    expect(hp.values.totalHealth).toBe(1100);
    expect(hp.values.damageFromHealth).toBe(11);
  });

  it('adds Bloodlust armor to the existing percentage pool before armor-to-crit', () => {
    const v = calculateDerivedStats({ armor: 1000, armorBonus: 2, strength: 100 }, {
      bloodlustStacks: { enabled: true }, critDamageFromArmor: { enabled: true },
    });
    expect(v.bloodlustArmorBonus).toBe(1);
    expect(v.totalArmor).toBe(4100); // 1000 × (1 + 200% gear + 10% STR + 100% Bloodlust)
    expect(v.critDamageFromArmor).toBe(8);
    expect(v.finalCritDamage).toBeCloseTo(5.08); // Bloodlust critical damage + armor conversion, once
  });
  it('merges partial overrides with defaults and orders configured sources', () => {
    const result = calculateDerivedStats({ strength: 1000 }, {
      darkEssenceStacks: { enabled: true }, critChanceFromEssence: { enabled: true },
      monogramValueFromStrength: { sourceStat: 'essence' },
    });
    expect(result.essence).toBe(1250);
    expect(result.critChanceFromEssence).toBe(62);
    const ids = getCalculationOrder({ monogramValueFromStrength: { sourceStat: 'essence' } }).map(s => s.id);
    expect(ids.indexOf('essence')).toBeLessThan(ids.indexOf('monogramValueFromStrength'));
    expect(() => getCalculationOrder({ damageFromHealth: { sourceStat: 'damageFromHealth' } })).toThrow(/dependency cycle/);
  });

  it('recomputes health-derived damage after edits when progression health is available', () => {
    const options = { equippedItems: [item('bracer', ['GainDamageForHPLoseArmor'])], maxHealth: 1000, characterStats: { health: 1000 } };
    expect(probe(options).values.damageFromHealth).toBe(10);
    expect(probe({ ...options, characterStats: { health: 2000 } }).values.damageFromHealth).toBe(20);
    expect(probe({ ...options, characterStats: {} }).values.damageFromHealth).toBe(10); // legacy share fallback
  });

  it('keeps no-energy builds from deriving elemental flat damage from energy', () => {
    const v = probe({ characterStats: { maxEnergy: 100 }, equippedItems: [item('head', ['ExtraEnergyAddDamage', 'DamageGainNoEnergy'])] }).values;
    expect(v.totalMaxEnergy).toBe(0);
    expect(v.energyDamageBonus).toBe(0);
  });

  it('uses actual percent units at the overcrit threshold', () => {
    const cfg = { fireFromCritChance: { enabled: true } };
    expect(calculateDerivedStats({ critChance: 1 }, cfg).fireFromCritChance).toBe(0);
    expect(calculateDerivedStats({ critChance: 2 }, cfg).fireFromCritChance).toBe(300);
    expect(DERIVED_STATS.totalCritChance.format(2)).toBe('200.0%');
  });
});

describe('confirmed duplicate monogram rules', () => {
  it.each([1, 2, 3])('adds %i copies at each stage of the essence → crit chain', async copies => {
    const options = {
      characterStats: { strength: 1000, critChance: 0.1 },
      equippedItems: [
        item('neck', Array(copies).fill('DarkEssence')),
        item('ring', Array(copies).fill('BonusCritChance%ForEssence')),
        item('pants', Array(copies).fill('BonusCritDamage%ForEssence')),
      ],
    };
    const result = probe(options);
    const essence = 1250 * copies;
    const chance = Math.floor(essence / 20) * 1.5 * copies;
    const damage = Math.floor(essence / 10) * 1.5 * copies;
    expect(result.values.darkEssenceStacks).toBe(500);
    expect(result.values.essence).toBe(essence);
    expect(result.values.critChanceFromEssence).toBe(chance);
    expect(result.values.totalCritChance).toBeCloseTo(0.1 + chance / 100);
    expect(result.values.critDamageFromEssence).toBe(damage);
    expect(result.values.finalCritDamage).toBeCloseTo(damage / 100);
    expect(probe(await sharedOptions(options)).values).toEqual(result.values);
  });

  it('stacks flat and energy bonuses before conversion, and updates after removing a copy', () => {
    const options = { equippedItems: [
      item('neck', ['EliteBuffs.Energy', 'EliteBuffs.Energy', 'EliteBuffs.Energy']),
      item('head', ['ExtraEnergyAddDamage', 'ExtraEnergyAddDamage']),
      item('pants', ['DamageBonusAnd51Damage', 'DamageBonusAnd51Damage']),
    ] };
    const result = probe(options).values;
    expect(result.totalMaxEnergy).toBe(400);
    expect(result.energyDamageBonus).toBe(1800);
    expect(result.flatDamageMonogramBonus).toBe(600);
    expect(result.edpsElemFlat).toBe(2400);
    expect(result.edpsPhysFlat).toBe(600);
    const edited = probe({ ...options, itemOverrides: {
      neck: { monogramSlots: ['EliteBuffs.Energy', null, null] },
    } }).values;
    expect(edited.totalMaxEnergy).toBe(200);
    expect(edited.energyDamageBonus).toBe(600);
  });

  it('adds different monogram IDs feeding the same scalar without order dependence', () => {
    const equippedItems = [item('neck', ['DarkEssence']),
      item('ring', ['BonusDamageForEssence', 'PotionsAsDamageBuff'])];
    const options = { characterStats: { strength: 1000 }, equippedItems };
    const values = probe(options).values;
    expect(values.elementalFlatFromEssence).toBe(186);
    expect(probe({ ...options, equippedItems: [...equippedItems].reverse() }).values).toEqual(values);
  });

  it.each(['Bloodlust.Base', 'Juggernaut', 'Shroud', 'AllowPhasing',
    'DamageCircle.Base', 'ExplodingArcaneMineNode'])('keeps %s grants/procs single-instance', id => {
    const one = probe({ equippedItems: [item('head', [id])] }).values;
    const three = probe({ equippedItems: [item('head', [id, id, id])] }).values;
    expect(three).toEqual(one);
  });
});
