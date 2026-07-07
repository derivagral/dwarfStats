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
 * Outputs (committed, consumed by src/):
 *   src/data/monograms.generated.json
 *   src/data/affixes.generated.json
 *   src/data/modifierPools.generated.json
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

const monograms = generateMonograms(attributeRows);
const affixes = generateAffixes(affixRows);
const pools = generatePools(poolRows);

fs.mkdirSync(GEN_DIR, { recursive: true });
const banner = { _generated: 'by extraction/generate-registries.mjs — do not edit by hand' };

fs.writeFileSync(path.join(GEN_DIR, 'monograms.generated.json'),
  JSON.stringify({ ...banner, monograms }, null, 2));
fs.writeFileSync(path.join(GEN_DIR, 'affixes.generated.json'),
  JSON.stringify({ ...banner, affixes }, null, 2));
fs.writeFileSync(path.join(GEN_DIR, 'modifierPools.generated.json'),
  JSON.stringify({ ...banner, pools }, null, 2));

console.log(`Monograms: ${Object.keys(monograms).length}`);
console.log(`Affixes:   ${Object.keys(affixes).length}`);
console.log(`Pools:     ${Object.keys(pools).length}`);

const { reportPath, missing } = await driftReport(affixes);
console.log(`Drift:     ${missing} rollable affixes unmatched by STAT_REGISTRY patterns`);
console.log(`Report:    ${reportPath}`);
