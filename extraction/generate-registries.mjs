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
 *
 * Outputs (committed, consumed by src/):
 *   src/data/monograms.generated.json
 *   src/data/affixes.generated.json
 *   src/data/modifierPools.generated.json
 *   src/data/cards.generated.json
 *   src/data/weaponSkills.generated.json
 *   src/data/statusEffects.generated.json
 *   src/data/mainTreeHealth.generated.json (when the optional export exists)
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
let mainTreeHealth = null;
try {
  mainTreeHealth = generateMainTreeHealth(loadTable('DT_GENERATED_SkillTree_Main.json'));
} catch {
  console.warn('  (skipping DT_GENERATED_SkillTree_Main.json — not present)');
}

const monograms = generateMonograms(attributeRows);
const affixes = generateAffixes(affixRows);
const pools = generatePools(poolRows);
const cards = generateCards(cardRows);
const statusEffects = generateStatusEffects(statusRows);
const weaponSkills = generateWeaponSkills(statusEffects);

fs.mkdirSync(GEN_DIR, { recursive: true });
const banner = { _generated: 'by extraction/generate-registries.mjs — do not edit by hand' };

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
if (mainTreeHealth) {
  fs.writeFileSync(path.join(GEN_DIR, 'mainTreeHealth.generated.json'),
    JSON.stringify({ ...banner, _source: 'DT_GENERATED_SkillTree_Main (MaxHealth effects only)', effectsByRow: mainTreeHealth }, null, 2));
}

console.log(`Monograms:      ${Object.keys(monograms).length}`);
console.log(`Affixes:        ${Object.keys(affixes).length}`);
console.log(`Pools:          ${Object.keys(pools).length}`);
console.log(`Cards:          ${Object.keys(cards).length}`);
console.log(`Weapon skills:  ${Object.keys(weaponSkills).length}`);
console.log(`Status effects: ${Object.keys(statusEffects).length}`);
if (mainTreeHealth) console.log(`Main-tree health nodes: ${Object.keys(mainTreeHealth).length}`);

const { reportPath, missing } = await driftReport(affixes);
console.log(`Drift:     ${missing} rollable affixes unmatched by STAT_REGISTRY patterns`);
console.log(`Report:    ${reportPath}`);
