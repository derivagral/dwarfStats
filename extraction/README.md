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
   properties: dump a `.usmap` with UE4SS (see "Dumping a .usmap" below), then
   point FModel at it (Settings → Mapping file path).
4. If the pak listing itself fails, an AES key is required (uncommon for indie
   titles) — FModel's AES tab; keys are usually community-known if needed.
5. Navigate to the asset paths found in step 0 (e.g. search `DT_Crystal_Cards`),
   right-click → **Save Properties (.json)**.

Exports land in FModel's `Output/Exports/...` folder. Copy the JSONs somewhere
handy (NOT into the repo; they're raw game data).

### Dumping a .usmap with UE4SS

Confirmed needed for Dwarven Realms: the packages have unversioned properties
and no `.usmap` ships with the game. The exe is
`ProjectAlpha\Binaries\Win64\ProjectAlpha-Win64-Shipping.exe` and appears to be
UE ~5.5, so use a **recent experimental UE4SS build** — the old stable (v3.0.1)
predates 5.4/5.5 support and will likely crash on inject.

1. Download the latest **experimental** release zip from
   https://github.com/UE4SS-RE/RE-UE4SS/releases (the `UE4SS_v...` /
   `zDEV-UE4SS` standard zip, not the source).
2. Extract it next to the shipping exe:
   `...\Dwarven Realms\ProjectAlpha\Binaries\Win64\`
   (you should end up with `dwmapi.dll` and a `ue4ss\` folder beside
   `ProjectAlpha-Win64-Shipping.exe`).
3. In `ue4ss\UE4SS-settings.ini`, set under `[Debug]`:
   `ConsoleEnabled = 0`, `GuiConsoleEnabled = 1`, `GuiConsoleVisible = 1`.
4. Launch the game (Steam offline mode is a reasonable precaution; it's a
   single-player title). A separate UE4SS debug window opens alongside the game.
5. In that window: **Dumpers tab → "Generate .usmap file"**. The file lands as
   `Mappings.usmap` next to the exe (or inside the `ue4ss\` folder, depending
   on build).
6. In FModel: Settings → set **Mappings file path** to that `Mappings.usmap`,
   restart/reload the archive, and the DataTables will deserialize.
7. Cleanup: delete `dwmapi.dll` and the `ue4ss\` folder to restore a vanilla
   install.

Troubleshooting: if the game crashes on launch with UE4SS installed, try a
newer/older experimental build first; failing that set
`bUseUObjectArrayCache = false` in `UE4SS-settings.ini`.

Known asset path for the card table (from FModel browsing):
`ProjectAlpha/Content/EasySurvivalRPG/Blueprints/DataTables/StanceSkills/DT_Crystal_Cards_Skills.uasset`
— note the base pack is **EasySurvivalRPG**, so sibling folders under
`EasySurvivalRPG/Blueprints/DataTables/` are where the other registries'
tables (skill tree, item modifiers/monograms) will live.

### Step 2 — Inspect an export

```
node extraction/summarize-datatable.mjs path\to\DT_Crystal_Cards_Skills.json
```

Prints row names, the union of property keys/types, and a sample row — enough to
design the effect mapping without eyeballing megabytes of JSON.

### Step 3 — Generate registry data

```
node extraction/transform-cards.mjs path\to\DT_Crystal_Cards_Skills.json
```

Writes:
- `extraction/out/cards.extracted.json` — flattened per-row data (full detail,
  gitignored; feed it back into a Claude session to finish the mapping)
- `extraction/out/cardRegistry.draft.js` — draft `CARD_REGISTRY` entries in the
  shape `src/utils/skillTreeRegistry.js` expects (name/description auto-filled
  where the table provides them; `effects` mapping is the follow-up step)

For the app's committed generated registries, place the reviewed DataTable
exports under `extraction/data/` and run:

```
node extraction/generate-registries.mjs
```

`DT_GENERATED_SkillTree_Main.json` is optional. When present, the generator
emits compact maps keyed by the opaque `UI_SkillTreeNode_*` save row names:
`mainTreeHealth.generated.json` (MaxHealth/MaxHealth% effects) and
`mainTreeAffinity.generated.json` (EasyRPG.OffhandCategories.* affinity
damage%/cooldown effects, plus node display names).

`DT_PlayerAbilities.json` is optional. When present, the generator emits
`playerAbilities.generated.json` — the 26 offhand proc abilities with their
affinity categories, element, base damage multiplier, offhand-count cooldown
steps, and `AffinityBehaviours` (ability modifiers that add an affinity when
rolled on an offhand item).

## Handing data back to a remote Claude session

Remote sessions can't see your filesystem — use the branch as the transport:

1. Run the transform locally (step 3). Review `extraction/out/cards.extracted.json`
   — it should contain only row names, effect ids/tags, numbers, and display
   strings (derived facts, fine to commit).
2. Copy it into the committed data directory and push:

   ```
   copy extraction\out\cards.extracted.json extraction\data\
   git add extraction/data/cards.extracted.json
   git commit -m "Add extracted card data"
   git push
   ```

3. Tell the session it's there — it can then design the effects mapping and
   regenerate `CARD_REGISTRY`.

`extraction/out/` stays gitignored (raw FModel exports, probe reports);
`extraction/data/` is the reviewed, committable subset.

## Follow-ups once exports exist

- Cards: map extracted magnitudes → `effects` arrays, replace the skeleton
  `CARD_REGISTRY`.
- Monograms: export the GameplayTags table / item-modifier DataTables to resolve
  the unconfirmed `EasyRPG.Items.Modifiers.*` placeholder keys (see CLAUDE.md
  "Integration TODOs").
- Main skill tree: MaxHealth nodes are generated from
  `DT_GENERATED_SkillTree_Main`; extend the same compact mapping approach for
  additional numeric effects and replace the remaining manual keystone checklist.
- Locres: export `Game.locres` (FModel saves it as JSON too) for display
  names/descriptions if the DataTables only store string-table keys.
