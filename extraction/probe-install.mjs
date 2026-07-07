#!/usr/bin/env node
/**
 * Probe a Dwarven Realms install for extraction-relevant files.
 *
 * Usage:
 *   node extraction/probe-install.mjs "C:\Program Files (x86)\Steam\steamapps\common\Dwarven Realms"
 *
 * Reads Manifest_UFSFiles_Win64.txt (a plain-text index of every cooked asset
 * inside the paks) plus the Paks directory, and writes a report to
 * extraction/out/probe-report.md. No game data is copied — only file paths,
 * names, and sizes.
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const SCRIPT_DIR = path.dirname(fileURLToPath(import.meta.url));
const OUT_DIR = path.join(SCRIPT_DIR, 'out');
const REPORT_PATH = path.join(OUT_DIR, 'probe-report.md');

// Asset-path patterns we care about, in report order.
const CATEGORIES = [
  { key: 'cards', label: 'Card-related assets', re: /crystal|card/i },
  { key: 'skillTree', label: 'Skill tree assets', re: /skilltree|dt_skills/i },
  { key: 'monograms', label: 'Monogram / item-modifier assets', re: /monogram|modifier|affix/i },
  { key: 'gameplayTags', label: 'GameplayTags sources', re: /gameplaytag|nativetag|tagtable/i },
  { key: 'curveTables', label: 'Curve tables', re: /curvetable|\/ct_|_curve/i },
  { key: 'locres', label: 'Localization (.locres)', re: /\.locres/i },
  { key: 'dataTables', label: 'All DataTables (DT_*)', re: /\/DT_[^/]*\.(uasset|umap)/i },
];

const MAX_LINES_PER_CATEGORY = 400; // keep the report pasteable

function fail(msg) {
  console.error(`ERROR: ${msg}`);
  process.exit(1);
}

function fmtSize(bytes) {
  if (bytes >= 1024 * 1024 * 1024) return `${(bytes / 1024 ** 3).toFixed(2)} GB`;
  if (bytes >= 1024 * 1024) return `${(bytes / 1024 ** 2).toFixed(1)} MB`;
  if (bytes >= 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${bytes} B`;
}

/** Recursively find files matching a predicate, without following symlinks. */
function findFiles(dir, predicate, results = [], depth = 0) {
  if (depth > 6) return results;
  let entries;
  try {
    entries = fs.readdirSync(dir, { withFileTypes: true });
  } catch {
    return results;
  }
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      findFiles(full, predicate, results, depth + 1);
    } else if (entry.isFile() && predicate(entry.name)) {
      results.push(full);
    }
  }
  return results;
}

// --- main ---

const gameRoot = process.argv[2];
if (!gameRoot) fail('Pass the game install directory as the first argument.');
if (!fs.existsSync(gameRoot)) fail(`Directory not found: ${gameRoot}`);

const report = [];
report.push('# Dwarven Realms install probe');
report.push(`- Root: \`${gameRoot}\``);
report.push(`- Generated: ${new Date().toISOString()}`);
report.push('');

// 1. Locate the project folder and Paks directory.
const pakDirs = findFiles(gameRoot, (n) => /\.(pak|ucas|utoc)$/i.test(n))
  .map((f) => path.dirname(f));
const uniquePakDirs = [...new Set(pakDirs)];

report.push('## Pak archives');
if (uniquePakDirs.length === 0) {
  report.push('No .pak/.ucas/.utoc files found — check the path.');
} else {
  for (const dir of uniquePakDirs) {
    report.push(`\n\`${dir}\``);
    report.push('');
    report.push('| File | Size |');
    report.push('|------|------|');
    for (const name of fs.readdirSync(dir).sort()) {
      const full = path.join(dir, name);
      const st = fs.statSync(full);
      if (st.isFile()) report.push(`| ${name} | ${fmtSize(st.size)} |`);
    }
  }
}
report.push('');

// 2. Mappings file (.usmap) anywhere in the install?
const usmaps = findFiles(gameRoot, (n) => /\.usmap$/i.test(n));
report.push('## Mappings (.usmap)');
report.push(usmaps.length
  ? usmaps.map((f) => `- \`${f}\``).join('\n')
  : 'None found in install. If FModel reports mapping errors, dump one with Dumper-7.');
report.push('');

// 3. Engine version hints.
report.push('## Engine version hints');
const versionHints = [];
const buildVersionFiles = findFiles(gameRoot, (n) => /^Build\.version$/i.test(n));
for (const f of buildVersionFiles) {
  try {
    const v = JSON.parse(fs.readFileSync(f, 'utf8'));
    versionHints.push(`- \`${f}\`: ${v.MajorVersion}.${v.MinorVersion}.${v.PatchVersion}`);
  } catch { /* ignore unparseable */ }
}
report.push(versionHints.length
  ? versionHints.join('\n')
  : 'No Build.version file found — check the exe: right-click ProjectAlpha.exe → Properties → Details.');
report.push('');

// 4. Scan the UFS manifest for interesting asset paths.
const manifestCandidates = fs.readdirSync(gameRoot)
  .filter((n) => /^Manifest_UFSFiles.*\.txt$/i.test(n))
  .map((n) => path.join(gameRoot, n));

report.push('## Manifest scan');
if (manifestCandidates.length === 0) {
  report.push('No Manifest_UFSFiles_*.txt found at the install root.');
} else {
  const manifestPath = manifestCandidates[0];
  report.push(`Source: \`${manifestPath}\``);
  const text = fs.readFileSync(manifestPath, 'utf8');
  const lines = text.split(/\r?\n/);
  report.push(`Total entries: ${lines.length}`);
  report.push('');

  for (const cat of CATEGORIES) {
    const matches = [];
    for (const line of lines) {
      if (!line) continue;
      if (cat.re.test(line)) {
        // Manifest lines are `"Path/To/Asset.uasset"<tab>metadata` — keep just the path.
        const quoted = line.match(/"([^"]+)"/);
        matches.push(quoted ? quoted[1] : line.trim());
      }
    }
    report.push(`### ${cat.label} (${matches.length})`);
    if (matches.length === 0) {
      report.push('_none_');
    } else {
      const shown = matches.slice(0, MAX_LINES_PER_CATEGORY);
      report.push('```');
      report.push(...shown);
      if (matches.length > shown.length) {
        report.push(`... and ${matches.length - shown.length} more`);
      }
      report.push('```');
    }
    report.push('');
  }
}

fs.mkdirSync(OUT_DIR, { recursive: true });
fs.writeFileSync(REPORT_PATH, report.join('\n'));
console.log(`Report written to ${REPORT_PATH}`);
console.log('Paste it (or the interesting sections) back into a Claude session to plan the FModel export.');
