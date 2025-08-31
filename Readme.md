# DwarfStats - UE Save File Analyzer

A browser-based tool for converting Unreal Engine .sav files to JSON and filtering game inventory items by attributes.

**Live Tool:** https://derivagral.github.io/dwarfStats/

## Quick Start

### Processing Files

**Drag & Drop** - Simply drag .sav files onto the drop zone
- Processes files immediately
- Multiple files can be dropped at once
- Results accumulate (previous results are kept)
- Each file downloads as JSON automatically

**Folder Selection** (Chrome/Edge only)
- Click "Pick Folder" to select a directory
- Use "Scan Now" to process all .sav files
- "Start Watching" polls the folder every 10 seconds for changes

### Managing Results

**Clear Results** - Removes all processed results and file history
- Clears the display
- Resets the file cache
- Empties the processed file list

**Re-run Last** - Reprocesses the most recent files
- Forces refresh even if files haven't changed
- Useful after changing filters
- Maintains file accumulation

### Filter Configuration

Click **Configure Filters** to customize which attributes you're searching for.

**Default Filters:**
```
Fiery*Totem*Damage, Wisdom, MageryCriticalDamage, LifeStealChance, LifeStealAmount, CriticalChance
```

**Filter Syntax:**
- Comma-separated list of attributes
- Use `*` as wildcards (e.g., `Fiery*Totem*Damage`)
- Case-insensitive matching
- Applied to all 3 attribute pools

**Actions:**
- **Apply & Re-scan** - Updates filters and reprocesses loaded files
- **Reset to Defaults** - Restores original filter set

### Understanding Results

Items are scored based on how many of your filtered attributes appear in each pool:

- **Matches (✅)** - Items with at least 1 match in all 3 pools
- **Near Misses (⚡)** - Items with 2+ total matches but missing a pool
- **Pool Scores** - Shows matches per pool (0, 1, or 2+)

Each item card displays:
- Item name and type
- Score breakdown by pool
- Grouped attributes showing which pool they belong to
- Green highlighting for matching attributes
- Blue styling for inherent attributes

### Platform Support

- **Chrome/Edge/Brave** - Full support including folder watching
- **Firefox/Safari** - Drag & drop and file selection only
- All platforms support downloading JSON conversions

## Notes

- JSON files download automatically after conversion
- Sound notification plays when matches are found
- Results persist until cleared or page refresh
- Files are only reprocessed if they've changed (unless forced)
