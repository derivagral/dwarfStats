#!/usr/bin/env node
/**
 * Summarize an FModel DataTable JSON export: row names, property key/type
 * union, and a sample row. Use this to understand a table's schema before
 * writing a transform for it.
 *
 * Usage:
 *   node extraction/summarize-datatable.mjs path/to/DT_Crystal_Cards_Skills.json [--rows]
 *
 *   --rows   also print every row name (default caps at 50)
 */

import fs from 'node:fs';

const args = process.argv.slice(2);
const showAllRows = args.includes('--rows');
const filePath = args.find((a) => !a.startsWith('--'));

if (!filePath) {
  console.error('Usage: node extraction/summarize-datatable.mjs <fmodel-export.json> [--rows]');
  process.exit(1);
}

const raw = JSON.parse(fs.readFileSync(filePath, 'utf8'));

/**
 * FModel exports are usually an array of exported objects; a DataTable object
 * has a `Rows` map. Older exports sometimes put rows at the top level.
 */
function findTables(data) {
  const objects = Array.isArray(data) ? data : [data];
  const tables = objects.filter((o) => o && typeof o === 'object' && o.Rows && typeof o.Rows === 'object');
  if (tables.length > 0) return tables;
  // Fallback: treat the whole object as a row map if values look like structs.
  if (!Array.isArray(data) && typeof data === 'object') {
    return [{ Name: '(top-level object)', Type: 'unknown', Rows: data }];
  }
  return [];
}

function typeOf(value) {
  if (value === null) return 'null';
  if (Array.isArray(value)) return `array[${value.length ? typeOf(value[0]) : ''}]`;
  return typeof value;
}

const tables = findTables(raw);
if (tables.length === 0) {
  console.error('No DataTable-shaped object (with a Rows map) found in this export.');
  process.exit(1);
}

for (const table of tables) {
  const rows = table.Rows;
  const rowNames = Object.keys(rows);
  console.log('='.repeat(70));
  console.log(`Table: ${table.Name ?? '(unnamed)'}  (Type: ${table.Type ?? '?'})`);
  console.log(`Row struct: ${table.Properties?.RowStruct?.ObjectName ?? '?'}`);
  console.log(`Rows: ${rowNames.length}`);

  // Union of property keys across all rows, with observed types + fill rate.
  const keyInfo = new Map();
  for (const name of rowNames) {
    const row = rows[name];
    if (!row || typeof row !== 'object') continue;
    for (const [key, value] of Object.entries(row)) {
      const info = keyInfo.get(key) ?? { types: new Set(), count: 0 };
      info.types.add(typeOf(value));
      info.count += 1;
      keyInfo.set(key, info);
    }
  }

  console.log('\nProperty keys (key : types : present-in-rows):');
  for (const [key, info] of keyInfo) {
    console.log(`  ${key} : ${[...info.types].join(' | ')} : ${info.count}/${rowNames.length}`);
  }

  const rowCap = showAllRows ? rowNames.length : Math.min(rowNames.length, 50);
  console.log(`\nRow names (${rowCap}/${rowNames.length}):`);
  for (const name of rowNames.slice(0, rowCap)) console.log(`  ${name}`);
  if (rowCap < rowNames.length) console.log(`  ... (${rowNames.length - rowCap} more; use --rows)`);

  console.log('\nSample row:');
  console.log(JSON.stringify({ [rowNames[0]]: rows[rowNames[0]] }, null, 2));
}
