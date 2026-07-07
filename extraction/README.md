# Game Data Extraction Helpers

Scripts for pulling the id→effect mapping (cards, skill tree nodes, monogram tags)
out of the Dwarven Realms install instead of reverse-engineering it via save states.

The save file stores `DataTableRowHandle`s — a full object path to a cooked
DataTable asset plus a row name. The effect payloads live in those DataTables
inside the game's pak files. We export the tables to JSON and generate registry
entries from them.

**Compliance note:** commit only *derived facts* (row names, effect ids, numbers,
display strings) — never raw exported assets, art, audio, or pak contents.
Everything under `extraction/out/` and any raw FModel exports are gitignored.

## Game install layout (Steam)

```
C:\Program Files (x86)\Steam\steamapps\common\Dwarven Realms\
├── ProjectAlpha.exe               ← exe properties → Details = engine version
├── Manifest_UFSFiles_Win64.txt    ← text index of EVERY cooked asset in the paks
├── ProjectAlpha\Content\Paks\     ← .pak / .ucas / .utoc — what FModel opens
└── Engine\ ...
```

## Workflow

### Step 0 — Recon (no external tools)

On the machine with the game installed, from the repo root:

```
node extraction/probe-install.mjs "C:\Program Files (x86)\Steam\steamapps\common\Dwarven Realms"
```

Scans the manifest + pak directory and writes `extraction/out/probe-report.md` with:
- every DataTable (`DT_*`) asset path, grouped
- card / skill-tree / monogram-related assets
- locres (localization) files
- pak/ucas/utoc inventory, any `.usmap` mappings file
- engine version hints

Paste the report (or the interesting sections) back into a Claude session to plan step 1.

### Step 1 — Export DataTables with FModel

1. Download FModel (fmodel.app). Add directory: `...\Dwarven Realms\ProjectAlpha\Content\Paks`
2. Settings → UE Versions → pick the version matching the exe (e.g. `GAME_UE5_3`).
3. If assets fail to deserialize with "mappings" errors, the game uses unversioned
   properties: dump a `.usmap` with Dumper-7 (via UE4SS injection, offline), then
   point FModel at it (Settings → Mapping file path).
4. If the pak listing itself fails, an AES key is required (uncommon for indie
   titles) — FModel's AES tab; keys are usually community-known if needed.
5. Navigate to the asset paths found in step 0 (e.g. search `DT_Crystal_Cards`),
   right-click → **Save Properties (.json)**.

Exports land in FModel's `Output/Exports/...` folder. Copy the JSONs somewhere
handy (NOT into the repo; they're raw game data).

### Step 2 — Inspect an export

```
node extraction/summarize-datatable.mjs path\to\DT_Crystal_Cards_Skills.json
```

Prints row names, the union of property keys/types, and a sample row — enough to
design the effect mapping without eyeballing megabytes of JSON.

### Step 3 — Generate card registry data

```
node extraction/transform-cards.mjs path\to\DT_Crystal_Cards_Skills.json
```

Writes:
- `extraction/out/cards.extracted.json` — flattened per-row data (full detail,
  gitignored; feed it back into a Claude session to finish the mapping)
- `extraction/out/cardRegistry.draft.js` — draft `CARD_REGISTRY` entries in the
  shape `src/utils/skillTreeRegistry.js` expects (name/description auto-filled
  where the table provides them; `effects` mapping is the follow-up step)

## Follow-ups once exports exist

- Cards: map extracted magnitudes → `effects` arrays, replace the skeleton
  `CARD_REGISTRY`.
- Monograms: export the GameplayTags table / item-modifier DataTables to resolve
  the unconfirmed `EasyRPG.Items.Modifiers.*` placeholder keys (see CLAUDE.md
  "Integration TODOs").
- Main skill tree: export `DT_GENERATED_SkillTree_Main` to de-opaque
  `UI_SkillTreeNode_Small_*` ids and replace the manual `TREE_KEYSTONES` checklist.
- Locres: export `Game.locres` (FModel saves it as JSON too) for display
  names/descriptions if the DataTables only store string-table keys.
