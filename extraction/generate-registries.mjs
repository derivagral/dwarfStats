#!/usr/bin/env node
/**
 * Generate derived registry data from extracted DataTables.
 *
 * Inputs (extraction/data/, committed FModel-derived facts):
 *   DT_Attributes.json              — master attribute/monogram lexicon (tag,
 *                                     description, dependency effects)
 *   DT_Base_Item_Attributes.json    — item affix definitions (tag, base value,
 *                                     per-level scaling, roll rules)
 *   DT_Yellow_Orange_Modifiers.json — which affixes roll in which pool
 *
 *   DT_Crystal_Cards_Skills.json    — crystal card effects (per-level bonus
 *                                     attributes; values scale linearly)
 *   DT_Skills_*.json (8 weapons)    — weapon stance skill trees
 *   DT_StatusEffects.json           — buff/status lexicon (names, durations,
 *                                     stacks, effect values)
 *   DT_GENERATED_SkillTree_Main.json — optional main-tree UI-node effects
 *   DT_PlayerAbilities.json         — optional offhand ability definitions
 *                                     (affinities, cooldown steps, modifiers)
 *   DT_PlayerRaces.json + E_CharacterRace.json — optional race definitions
 *                                     (racial skill unlocks by level)
 *
 * Outputs (committed, consumed by src/):
 *   src/data/attributeBonuses.generated.json
 *   src/data/monograms.generated.json
 *   src/data/affixes.generated.json
 *   src/data/modifierPools.generated.json
 *   src/data/cards.generated.json
 *   src/data/weaponSkills.generated.json
 *   src/data/statusEffects.generated.json
 *   src/data/mainTreeHealth.generated.json (when the optional export exists)
 *   src/data/mainTreeAffinity.generated.json (when the optional export exists)
 *   src/data/playerAbilities.generated.json (when the optional export exists)
 *   src/data/races.generated.json (when the optional exports exist)
 *
 * Also prints a drift report comparing affix tags against STAT_REGISTRY
 * patterns (written to extraction/out/drift-report.md, gitignored).
 *
 * Re-run after each game update once fresh exports land in extraction/data/:
 *   node extraction/generate-registries.mjs
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const SCRIPT_DIR = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.join(SCRIPT_DIR, '..');
const DATA_DIR = path.join(SCRIPT_DIR, 'data');
const OUT_DIR = path.join(SCRIPT_DIR, 'out');
const GEN_DIR = path.join(REPO_ROOT, 'src', 'data');

const MODIFIER_PREFIX = 'EasyRPG.Items.Modifiers.';

const PRIMARY_ATTRIBUTE_TAGS = {
  strength: 'EasyRPG.Attributes.Characteristics.Strength',
  dexterity: 'EasyRPG.Attributes.Characteristics.Dexterity',
  wisdom: 'EasyRPG.Attributes.Characteristics.Wisdom',
  // The game exposes this to players as Endurance but retains Intelligence in
  // the underlying gameplay tag.
  endurance: 'EasyRPG.Attributes.Characteristics.Intelligence',
  agility: 'EasyRPG.Attributes.Characteristics.Agility',
  luck: 'EasyRPG.Attributes.Characteristics.Luck',
  stamina: 'EasyRPG.Attributes.Characteristics.Stamina',
};

function loadTable(fileName) {
  const raw = JSON.parse(fs.readFileSync(path.join(DATA_DIR, fileName), 'utf8'));
  const objects = Array.isArray(raw) ? raw : [raw];
  const table = objects.find((o) => o && typeof o === 'object' && o.Rows);
  if (!table) throw new Error(`No DataTable rows found in ${fileName}`);
  return table.Rows;
}

/** UE struct property keys carry GUID suffixes (Name_7_ABC123...); strip them. */
function propKey(row, shortName) {
  return Object.keys(row).find((k) => k === shortName || k.startsWith(`${shortName}_`));
}

function prop(row, shortName) {
  const key = propKey(row, shortName);
  return key === undefined ? undefined : row[key];
}

function textOf(ftext) {
  if (!ftext || typeof ftext !== 'object') return ftext ?? null;
  // SourceString is the developer's current English; LocalizedString can lag
  // behind it when the localization table hasn't been rebuilt.
  return ftext.SourceString ?? ftext.LocalizedString ?? ftext.CultureInvariantString ?? null;
}

// ---------------------------------------------------------------------------
// Primary attribute dependencies (from DT_Attributes)
// ---------------------------------------------------------------------------

function generateAttributeBonuses(attributeRows) {
  return Object.fromEntries(Object.entries(PRIMARY_ATTRIBUTE_TAGS).map(([id, tag]) => {
    const row = attributeRows[tag];
    if (!row) throw new Error(`Missing primary attribute row: ${tag}`);

    const effects = (prop(row, 'Dependencies') ?? []).map((dep) => ({
      tag: prop(dep, 'GameplayTag')?.TagName,
      valuePerPoint: prop(dep, 'Value') ?? 0,
    })).filter(effect => effect.tag);

    return [id, {
      tag,
      name: textOf(prop(row, 'AttributeName')) ?? id,
      description: textOf(prop(row, 'Description')) ?? '',
      effects,
    }];
  }));
}

// ---------------------------------------------------------------------------
// Monograms (from DT_Attributes rows tagged EasyRPG.Items.Modifiers.*)
// ---------------------------------------------------------------------------

function generateMonograms(attributeRows) {
  const monograms = {};
  for (const [rowName, row] of Object.entries(attributeRows)) {
    if (!rowName.startsWith(MODIFIER_PREFIX)) continue;
    const id = rowName.slice(MODIFIER_PREFIX.length);

    const name = textOf(prop(row, 'AttributeName'));
    const description = (textOf(prop(row, 'Description')) ?? '')
      .replace(/\r\n/g, ' ').replace(/\n/g, ' ').trim() || null;

    const effects = [];
    for (const dep of prop(row, 'Dependencies') ?? []) {
      const tag = prop(dep, 'GameplayTag')?.TagName;
      const value = prop(dep, 'Value');
      if (tag) effects.push({ tag, value: value ?? 0 });
    }

    monograms[id] = {
      tag: rowName,
      ...(name ? { name } : {}),
      ...(description ? { description } : {}),
      effects,
    };
  }
  return monograms;
}

// ---------------------------------------------------------------------------
// Affixes (DT_Base_Item_Attributes)
// ---------------------------------------------------------------------------

function generateAffixes(affixRows) {
  const affixes = {};
  for (const [rowName, row] of Object.entries(affixRows)) {
    affixes[rowName] = {
      tag: prop(row, 'AttributeTag')?.TagName ?? null,
      value: prop(row, 'Value') ?? 0,
      valuePerLevel: prop(row, 'AddedValuePerLevel') ?? 0,
      itemTags: prop(row, 'ItemTags') ?? [],
      canRoll: prop(row, 'CanBeRollerOnItem') ?? false,
      minItemLevel: prop(row, 'MinIRequiredtemLevel') ?? 0,
    };
  }
  return affixes;
}

// ---------------------------------------------------------------------------
// Modifier pools (DT_Yellow_Orange_Modifiers → lists of affix row names)
// ---------------------------------------------------------------------------

function generatePools(poolRows) {
  const pools = {};
  for (const [poolName, row] of Object.entries(poolRows)) {
    const handles = prop(row, 'AttributesAbilityHandles') ?? [];
    pools[poolName] = handles
      .map((h) => h?.RowName)
      .filter(Boolean);
  }
  return pools;
}

// ---------------------------------------------------------------------------
// Shared: tag/value effect list from a BonusAttributes/CharacterAttributes array
// ---------------------------------------------------------------------------

function effectList(entries) {
  const effects = [];
  for (const entry of entries ?? []) {
    const tag = prop(entry, 'GameplayTag')?.TagName;
    const value = prop(entry, 'Value');
    if (tag && tag !== 'None') effects.push({ tag, value: value ?? 0 });
  }
  return effects;
}

// ---------------------------------------------------------------------------
// Crystal cards (DT_Crystal_Cards_Skills — STR_SkillInstance rows)
//
// Every card has exactly one SkillLevels entry; in-game card levels multiply
// those values linearly (consistent with the observed "L6 doubles L3" rule).
// ---------------------------------------------------------------------------

function generateCards(cardRows) {
  const cards = {};
  for (const [rowName, row] of Object.entries(cardRows)) {
    const m = rowName.match(/^CARD(\d+)(?:_(\d+))?$/i);
    const levels = prop(row, 'SkillLevels') ?? [];
    cards[rowName] = {
      family: m ? Number(m[1]) : null,
      variant: m && m[2] !== undefined ? Number(m[2]) : null,
      maxLevel: prop(row, 'MaxLevel') ?? 0,
      // Per-level effects (multiply by card level)
      effects: effectList(prop(levels[0] ?? {}, 'BonusAttributes')),
    };
  }
  return cards;
}

// ---------------------------------------------------------------------------
// Main passive tree health effects (DT_GENERATED_SkillTree_Main)
//
// Saves use opaque UI_SkillTreeNode_* row names. Keep only MaxHealth facts so
// the shipped lookup remains tiny instead of embedding the full raw export.
// ---------------------------------------------------------------------------

// All numeric attribute grants; modifier behavior tags keep their own pipeline.
function generateMainTreeAttributes(mainTreeRows) {
  const effectsByRow = {};
  for (const [rowName, row] of Object.entries(mainTreeRows)) {
    const levels = (prop(row, 'SkillLevels') ?? []).map(level =>
      effectList(prop(level, 'BonusAttributes')).filter(effect => effect.tag.startsWith('EasyRPG.Attributes.')));
    if (levels.some(effects => effects.length)) effectsByRow[rowName] = levels;
  }
  return effectsByRow;
}

function generateMainTreeHealth(mainTreeRows) {
  const effectsByRow = {};
  const healthTags = new Set([
    'EasyRPG.Attributes.Base.MaxHealth',
    'EasyRPG.Attributes.Base.MaxHealth%',
  ]);

  for (const [rowName, row] of Object.entries(mainTreeRows)) {
    const effects = [];
    for (const level of prop(row, 'SkillLevels') ?? []) {
      effects.push(...effectList(prop(level, 'BonusAttributes'))
        .filter(effect => healthTags.has(effect.tag)));
    }
    if (effects.length > 0) effectsByRow[rowName] = effects;
  }
  return effectsByRow;
}

// ---------------------------------------------------------------------------
// Main passive tree offhand-affinity effects (DT_GENERATED_SkillTree_Main)
//
// Same opaque UI_SkillTreeNode_* rows as the health map, filtered to
// EasyRPG.OffhandCategories.* effects (Damage%Bonus / CooldownBonus per
// affinity). Node display names ("Sky Rush") ship alongside so stat
// breakdowns can label sources readably.
// ---------------------------------------------------------------------------

const OFFHAND_CATEGORY_PREFIX = 'EasyRPG.OffhandCategories.';

function generateMainTreeAffinity(mainTreeRows) {
  const effectsByRow = {};
  const namesByRow = {};

  for (const [rowName, row] of Object.entries(mainTreeRows)) {
    const effects = [];
    for (const level of prop(row, 'SkillLevels') ?? []) {
      effects.push(...effectList(prop(level, 'BonusAttributes'))
        .filter(effect => effect.tag.startsWith(OFFHAND_CATEGORY_PREFIX)));
    }
    if (effects.length > 0) {
      effectsByRow[rowName] = effects;
      const name = textOf(prop(row, 'SkillName'));
      if (name) namesByRow[rowName] = name;
    }
  }
  return { effectsByRow, namesByRow };
}

// ---------------------------------------------------------------------------
// Main passive tree modifier grants (DT_GENERATED_SkillTree_Main)
//
// Some nodes grant EasyRPG.Items.Modifiers.* behavior tags instead of stats —
// e.g. "Melee Mastery: Damage" grants MeleeParagon.BaseDamage_TextTag (+2
// flat per stance mastery level, additive with the helmet monogram of the
// same id). Emitted with the Modifiers prefix and _TextTag suffix stripped so
// the ids line up with MONOGRAM_CALC_CONFIGS; the app applies only the ids it
// has calc configs for.
// ---------------------------------------------------------------------------

function generateMainTreeModifiers(mainTreeRows) {
  const grantsByRow = {};
  const namesByRow = {};

  for (const [rowName, row] of Object.entries(mainTreeRows)) {
    const grants = [];
    for (const level of prop(row, 'SkillLevels') ?? []) {
      for (const effect of effectList(prop(level, 'BonusAttributes'))) {
        if (!effect.tag.startsWith(MODIFIER_PREFIX)) continue;
        grants.push({
          id: effect.tag.slice(MODIFIER_PREFIX.length).replace(/_TextTag$/, ''),
          value: effect.value,
        });
      }
    }
    if (grants.length > 0) {
      grantsByRow[rowName] = grants;
      const name = textOf(prop(row, 'SkillName'));
      if (name) namesByRow[rowName] = name;
    }
  }
  return { grantsByRow, namesByRow };
}

// ---------------------------------------------------------------------------
// Offhand abilities (DT_PlayerAbilities)
//
// One row per proc ability (Electric Dragons, Vortex, …). Each carries:
// - Affinities: base OffhandCategories the ability benefits from
// - AffinityBehaviours: item-rollable ability modifiers that ADD an affinity
//   (e.g. ElectricDragons.Modifier.AdditionalDragons adds Area). Only offhand
//   items can roll these — weapons can never contribute an affinity tag.
// - CooldownSettings: cooldown step function by number of equipped offhands
//   (Initial = 1, TwoOffhands = 2, ThreeOffhands = 3+; there is no 4th step)
// ---------------------------------------------------------------------------

const ABILITY_TAG_PREFIX = 'EasyRPG.Attributes.Abilities.';

const DAMAGE_TYPE_ENUM = {
  'E_DamageType_DR::NewEnumerator1': 'fire',
  'E_DamageType_DR::NewEnumerator2': 'lightning',
  'E_DamageType_DR::NewEnumerator3': 'arcane',
};

function generatePlayerAbilities(abilityRows) {
  const abilities = {};
  for (const [rowName, row] of Object.entries(abilityRows)) {
    const identifier = prop(row, 'IdentifierTag')?.TagName ?? '';
    // BurningShield's identifier is "…BurningShield.ProcChance" — strip the
    // stray attribute suffix so keys always name the ability itself.
    const key = identifier
      .replace(ABILITY_TAG_PREFIX, '')
      .replace(/\.ProcChance$/, '');
    if (!key) continue;

    const affinities = (prop(row, 'Affinities') ?? [])
      .map(entry => entry?.TagName?.replace(OFFHAND_CATEGORY_PREFIX, ''))
      .filter(Boolean);

    // Modifier tag → affinity category it adds when rolled on an offhand item
    const affinityBehaviours = {};
    for (const entry of prop(row, 'AffinityBehaviours') ?? []) {
      const modifierTag = entry?.Key?.TagName;
      const category = entry?.Value?.TagName?.replace(OFFHAND_CATEGORY_PREFIX, '');
      if (modifierTag && category) affinityBehaviours[modifierTag] = category;
    }

    const cd = prop(row, 'CooldownSettings') ?? {};
    const cooldown = prop(cd, 'HasCooldown?')
      ? {
        initial: prop(cd, 'Initial') ?? 0,
        twoOffhands: prop(cd, 'TwoOffhandsCooldown') ?? 0,
        threeOffhands: prop(cd, 'ThreeOffhandsCooldown') ?? 0,
      }
      : null;

    const element = prop(row, 'ElementalType');
    abilities[key] = {
      rowName,
      name: textOf(prop(row, 'Title')) ?? key,
      description: textOf(prop(row, 'Description')) ?? '',
      element: DAMAGE_TYPE_ENUM[element] ?? element ?? null,
      baseDamageMultiplier: prop(prop(row, 'DmgModifierAttribute') ?? {}, 'Value') ?? 0,
      affinities,
      affinityBehaviours,
      ...(cooldown ? { cooldown } : {}),
    };
  }
  return abilities;
}

// ---------------------------------------------------------------------------
// Player races (DT_PlayerRaces + E_CharacterRace enum)
//
// Saves store race as an opaque E_CharacterRace byte (NewEnumeratorN); the
// enum export maps N → display name ("Dwarf"), which uppercases to the race
// table's row key ("DWARF"). Each race has 6 RacialSkills — threshold unlocks
// at character level 10/25/50/100/150/200 (NOT per-level scaling; 200 is
// simply the last unlock) granting weapon damage/crit, offhand affinity
// damage/CDR, and StanceMultiplier bonuses.
// ---------------------------------------------------------------------------

function loadEnum(fileName) {
  const raw = JSON.parse(fs.readFileSync(path.join(DATA_DIR, fileName), 'utf8'));
  const objects = Array.isArray(raw) ? raw : [raw];
  const enumExport = objects.find((o) => o?.Type === 'UserDefinedEnum');
  if (!enumExport) throw new Error(`No UserDefinedEnum found in ${fileName}`);
  return enumExport;
}

function generatePlayerRaces(raceRows, raceEnum) {
  const races = {};
  for (const entry of raceEnum?.Properties?.DisplayNameMap ?? []) {
    const match = entry?.Key?.match(/NewEnumerator(\d+)$/);
    const name = textOf(entry?.Value);
    if (!match || !name) continue;

    const row = raceRows[name.toUpperCase()];
    if (!row) {
      console.warn(`  (race enum ${entry.Key} "${name}" has no DT_PlayerRaces row)`);
      continue;
    }

    races[Number(match[1])] = {
      key: name.toUpperCase(),
      name,
      racialSkills: (prop(row, 'RacialSkills') ?? []).map((skill) => ({
        requiredLevel: prop(skill, 'RequiredLevel') ?? 0,
        name: textOf(prop(skill, 'GroupName')) ?? '',
        effects: effectList(prop(skill, 'Attributes')),
      })),
    };
  }
  return races;
}

// ---------------------------------------------------------------------------
// Weapon stance skills (DT_Skills_* — STR_SkillInstance rows)
//
// Same row struct as cards: one SkillLevels entry whose BonusAttributes apply
// per skill level (paragon nodes scale linearly to MaxLevel). Buff-type skills
// have empty BonusAttributes; their magnitudes live in DT_StatusEffects under
// the same rowName and are joined in as `buff`.
// ---------------------------------------------------------------------------

const WEAPON_TABLES = {
  'DT_Skills_Spear.json': 'spear',
  'DT_Skills_Mauls.json': 'mauls',
  'DT_Skills_OneHand.json': 'oneHand',
  'DT_Skills_TwoHand.json': 'twoHand',
  'DT_Skills_Archery.json': 'archery',
  'DT_Skills_Magery.json': 'magery',
  'DT_Skills_Scythe.json': 'scythe',
  'DT_Skills_Unarmed.json': 'unarmed',
};

function generateWeaponSkills(statusEffects) {
  const skills = {};
  const statusEffectsLower = Object.fromEntries(
    Object.entries(statusEffects).map(([k, v]) => [k.toLowerCase(), v]),
  );
  for (const [fileName, weapon] of Object.entries(WEAPON_TABLES)) {
    let rows;
    try {
      rows = loadTable(fileName);
    } catch {
      console.warn(`  (skipping ${fileName} — not present)`);
      continue;
    }
    for (const [rowName, row] of Object.entries(rows)) {
      const levels = prop(row, 'SkillLevels') ?? [];
      const levelDesc = (prop(levels[0] ?? {}, 'Description') ?? '');
      const description = (typeof levelDesc === 'string' ? levelDesc : textOf(levelDesc) ?? '').trim() || null;

      const entry = {
        weapon,
        maxLevel: prop(row, 'MaxLevel') ?? 0,
        ...(description ? { description } : {}),
        // Per-level effects (multiply by skill level for paragon nodes)
        effects: effectList(prop(levels[0] ?? {}, 'BonusAttributes')),
      };

      // Join buff magnitudes from the status-effect lexicon (same rowName).
      // UE row names are case-insensitive and the tables disagree on casing
      // (skill row "Spear_Crit_Damage_Buff" vs status row
      // "Spear_Crit_Damage_buff"), so match lowercased.
      const status = statusEffects[rowName]
        ?? statusEffectsLower[rowName.toLowerCase()];
      if (status && (status.effects.length || status.duration)) {
        entry.buff = {
          ...(status.name ? { name: status.name } : {}),
          duration: status.duration,
          maxStack: status.maxStack,
          effects: status.effects,
        };
      }

      skills[rowName] = entry;
    }
  }
  return skills;
}

// ---------------------------------------------------------------------------
// Status effects (DT_StatusEffects — buff/debuff lexicon)
// ---------------------------------------------------------------------------

function generateStatusEffects(statusRows) {
  const statusEffects = {};
  for (const [rowName, row] of Object.entries(statusRows)) {
    const name = textOf(prop(row, 'AttributeName'));
    const description = (textOf(prop(row, 'Description')) ?? '')
      .replace(/\r\n/g, ' ').replace(/\n/g, ' ').trim() || null;
    statusEffects[rowName] = {
      ...(name ? { name } : {}),
      ...(description ? { description } : {}),
      positive: prop(row, 'IsPositiveEffect') ?? true,
      duration: prop(row, 'Duration') ?? 0,
      maxStack: prop(row, 'MaxStack') ?? 1,
      effects: [
        ...effectList(prop(row, 'CharacterAttributes')),
        ...effectList(prop(row, 'EffectAttributes')),
      ],
    };
  }
  return statusEffects;
}

// ---------------------------------------------------------------------------
// Drift report: affix tags vs STAT_REGISTRY patterns
// ---------------------------------------------------------------------------

async function driftReport(affixes) {
  const { findStatForAttribute } = await import(path.join(REPO_ROOT, 'src', 'utils', 'statRegistry.js'));

  const lines = ['# Affix drift report', '',
    'Rollable affixes from DT_Base_Item_Attributes whose save tag is not',
    'recognized by findStatForAttribute() — i.e. tags the app cannot classify.', ''];
  let missing = 0;

  for (const [rowName, affix] of Object.entries(affixes)) {
    if (!affix.canRoll || !affix.tag) continue;
    if (!findStatForAttribute(affix.tag)) {
      missing += 1;
      lines.push(`- \`${rowName}\` → \`${affix.tag}\` (base ${affix.value}, +${affix.valuePerLevel}/lvl, minLvl ${affix.minItemLevel})`);
    }
  }
  lines.splice(5, 0, `Unmatched rollable affixes: ${missing}`, '');

  fs.mkdirSync(OUT_DIR, { recursive: true });
  const reportPath = path.join(OUT_DIR, 'drift-report.md');
  fs.writeFileSync(reportPath, lines.join('\n'));
  return { reportPath, missing };
}

// ---------------------------------------------------------------------------

const attributeRows = loadTable('DT_Attributes.json');
const affixRows = loadTable('DT_Base_Item_Attributes.json');
const poolRows = loadTable('DT_Yellow_Orange_Modifiers.json');
const cardRows = loadTable('DT_Crystal_Cards_Skills.json');
const statusRows = loadTable('DT_StatusEffects.json');
let mainTreeAttributes = null;
let mainTreeHealth = null;
let mainTreeAffinity = null;
let mainTreeModifiers = null;
try {
  const mainTreeRows = loadTable('DT_GENERATED_SkillTree_Main.json');
  mainTreeAttributes = generateMainTreeAttributes(mainTreeRows);
  mainTreeHealth = generateMainTreeHealth(mainTreeRows);
  mainTreeAffinity = generateMainTreeAffinity(mainTreeRows);
  mainTreeModifiers = generateMainTreeModifiers(mainTreeRows);
} catch {
  console.warn('  (skipping DT_GENERATED_SkillTree_Main.json — not present)');
}
let playerAbilities = null;
try {
  playerAbilities = generatePlayerAbilities(loadTable('DT_PlayerAbilities.json'));
} catch {
  console.warn('  (skipping DT_PlayerAbilities.json — not present)');
}
let playerRaces = null;
try {
  playerRaces = generatePlayerRaces(loadTable('DT_PlayerRaces.json'), loadEnum('E_CharacterRace.json'));
} catch {
  console.warn('  (skipping DT_PlayerRaces.json / E_CharacterRace.json — not present)');
}

const monograms = generateMonograms(attributeRows);
const attributeBonuses = generateAttributeBonuses(attributeRows);
const affixes = generateAffixes(affixRows);
const pools = generatePools(poolRows);
const cards = generateCards(cardRows);
const statusEffects = generateStatusEffects(statusRows);
const weaponSkills = generateWeaponSkills(statusEffects);

fs.mkdirSync(GEN_DIR, { recursive: true });
const banner = { _generated: 'by extraction/generate-registries.mjs — do not edit by hand' };

fs.writeFileSync(path.join(GEN_DIR, 'attributeBonuses.generated.json'),
  JSON.stringify({ ...banner, _source: 'DT_Attributes primary-characteristic dependencies', attributeBonuses }, null, 2));
fs.writeFileSync(path.join(GEN_DIR, 'monograms.generated.json'),
  JSON.stringify({ ...banner, monograms }, null, 2));
fs.writeFileSync(path.join(GEN_DIR, 'affixes.generated.json'),
  JSON.stringify({ ...banner, affixes }, null, 2));
fs.writeFileSync(path.join(GEN_DIR, 'modifierPools.generated.json'),
  JSON.stringify({ ...banner, pools }, null, 2));
fs.writeFileSync(path.join(GEN_DIR, 'cards.generated.json'),
  JSON.stringify({ ...banner, cards }, null, 2));
fs.writeFileSync(path.join(GEN_DIR, 'weaponSkills.generated.json'),
  JSON.stringify({ ...banner, weaponSkills }, null, 2));
fs.writeFileSync(path.join(GEN_DIR, 'statusEffects.generated.json'),
  JSON.stringify({ ...banner, statusEffects }, null, 2));
if (mainTreeAttributes) {
  fs.writeFileSync(path.join(GEN_DIR, 'mainTreeAttributes.generated.json'),
    JSON.stringify({ ...banner, _source: 'DT_GENERATED_SkillTree_Main (numeric attribute grants by node level)', effectsByRow: mainTreeAttributes }, null, 2));
}
if (mainTreeHealth) {
  fs.writeFileSync(path.join(GEN_DIR, 'mainTreeHealth.generated.json'),
    JSON.stringify({ ...banner, _source: 'DT_GENERATED_SkillTree_Main (MaxHealth effects only)', effectsByRow: mainTreeHealth }, null, 2));
}
if (mainTreeAffinity) {
  fs.writeFileSync(path.join(GEN_DIR, 'mainTreeAffinity.generated.json'),
    JSON.stringify({
      ...banner,
      _source: 'DT_GENERATED_SkillTree_Main (EasyRPG.OffhandCategories.* effects only)',
      effectsByRow: mainTreeAffinity.effectsByRow,
      namesByRow: mainTreeAffinity.namesByRow,
    }, null, 2));
}
if (playerAbilities) {
  fs.writeFileSync(path.join(GEN_DIR, 'playerAbilities.generated.json'),
    JSON.stringify({ ...banner, _source: 'DT_PlayerAbilities', abilities: playerAbilities }, null, 2));
}
if (playerRaces) {
  fs.writeFileSync(path.join(GEN_DIR, 'races.generated.json'),
    JSON.stringify({ ...banner, _source: 'DT_PlayerRaces + E_CharacterRace enum', races: playerRaces }, null, 2));
}
if (mainTreeModifiers) {
  fs.writeFileSync(path.join(GEN_DIR, 'mainTreeModifiers.generated.json'),
    JSON.stringify({
      ...banner,
      _source: 'DT_GENERATED_SkillTree_Main (EasyRPG.Items.Modifiers.* grants, _TextTag stripped)',
      grantsByRow: mainTreeModifiers.grantsByRow,
      namesByRow: mainTreeModifiers.namesByRow,
    }, null, 2));
}

console.log(`Attributes:     ${Object.keys(attributeBonuses).length}`);
console.log(`Monograms:      ${Object.keys(monograms).length}`);
console.log(`Affixes:        ${Object.keys(affixes).length}`);
console.log(`Pools:          ${Object.keys(pools).length}`);
console.log(`Cards:          ${Object.keys(cards).length}`);
console.log(`Weapon skills:  ${Object.keys(weaponSkills).length}`);
console.log(`Status effects: ${Object.keys(statusEffects).length}`);
if (mainTreeHealth) console.log(`Main-tree health nodes: ${Object.keys(mainTreeHealth).length}`);
if (mainTreeAffinity) console.log(`Main-tree affinity nodes: ${Object.keys(mainTreeAffinity.effectsByRow).length}`);
if (playerAbilities) console.log(`Player abilities: ${Object.keys(playerAbilities).length}`);
if (playerRaces) console.log(`Player races: ${Object.keys(playerRaces).length}`);
if (mainTreeModifiers) console.log(`Main-tree modifier-grant nodes: ${Object.keys(mainTreeModifiers.grantsByRow).length}`);

const { reportPath, missing } = await driftReport(affixes);
console.log(`Drift:     ${missing} rollable affixes unmatched by STAT_REGISTRY patterns`);
console.log(`Report:    ${reportPath}`);
