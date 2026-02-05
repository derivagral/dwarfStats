import React, { useState, useCallback, useRef, useEffect } from 'react';
import { Button, DropZone } from '../common';
import { FilterConfig } from './FilterConfig';
import { ResultsSection, EmptyResultsSection } from './ResultsSection';
import { useFileProcessor } from '../../hooks/useFileProcessor';
import { hasDirPicker } from '../../utils/platform';
import { playNotificationSound } from '../../utils/sound';
import { analyzeUeSaveJson } from '../../utils/dwarfFilter';

const DEFAULT_FILTERS = [
  "Fiery*Totem*Damage", "Wisdom", "MageryCriticalDamage", "MageryCriticalChance",
  "\\bLifeSteal\\b", "LifeStealAmount", "\\bCriticalChance"
].join(", ");

function parseFilterString(filterStr) {
  if (!filterStr || filterStr.trim() === '') return [];
  return filterStr.split(',').map(pattern => pattern.trim()).filter(Boolean);
}

/**
 * Score items from inventory against filter patterns
 * Used when filtering itemStore.inventory (already processed items)
 * @param {Array} items - Items from itemStore.inventory
 * @param {Array} patterns - Filter patterns as strings
 * @param {Object} options - Filtering options
 * @returns {{ hits: Array, close: Array, totalItems: number }}
 */
function filterInventoryItems(items, patterns, options = {}) {
  const { closeMinTotal = 2, minHits = 1 } = options;

  // Compile patterns to regex
  const regexList = patterns.map(p => {
    if (p instanceof RegExp) return p;
    return new RegExp(p.replace(/\*/g, '.*'), 'i');
  });

  const countHits = (attrs) => {
    if (!Array.isArray(attrs) || !regexList.length) return 0;
    let hits = 0;
    for (const attr of attrs) {
      for (const regex of regexList) {
        if (regex.test(attr)) {
          hits++;
          break;
        }
      }
    }
    return hits;
  };

  const hits = [];
  const close = [];

  for (const item of items) {
    const pool1 = item.item?.pool1_attributes || [];
    const pool2 = item.item?.pool2_attributes || [];
    const pool3 = item.item?.pool3_attributes || [];

    const s1 = countHits(pool1);
    const s2 = countHits(pool2);
    const s3 = countHits(pool3);
    const total = s1 + s2 + s3;

    const scored = { ...item, s1, s2, s3, total };

    if (s1 >= minHits && s2 >= minHits && s3 >= minHits) {
      hits.push(scored);
    } else if (total >= closeMinTotal) {
      close.push(scored);
    }
  }

  return { hits, close, totalItems: items.length };
}

export function FilterTab({ initialSaveData, itemStore, onLog, onStatusChange }) {
  const [results, setResults] = useState(new Map());
  const [filterValue, setFilterValue] = useState(DEFAULT_FILTERS);
  const [filterPatterns, setFilterPatterns] = useState(parseFilterString(DEFAULT_FILTERS));
  const [configVisible, setConfigVisible] = useState(false);
  const [lastFiles, setLastFiles] = useState([]);
  const [dirHandle, setDirHandle] = useState(null);
  const [watching, setWatching] = useState(false);
  const [initialProcessed, setInitialProcessed] = useState(false);
  const watchTimerRef = useRef(null);
  const fileInputRef = useRef(null);
  const { processFile, isProcessing } = useFileProcessor();

  const processFiles = useCallback(async (files, patterns = filterPatterns) => {
    for (const file of files) {
      try {
        onLog(`📄 Converting: ${file.name} (${(file.size / 1024).toFixed(1)} KB)`);
        const result = await processFile(file);

        const filterOptions = {
          slot1: patterns,
          slot2: patterns,
          slot3: patterns,
          includeWeapons: true,
          showClose: true,
          closeMinTotal: 2,
          debug: false,
        };

        const { hits, close, totalItems } = analyzeUeSaveJson(result.json, filterOptions);

        setResults(prev => {
          const next = new Map(prev);
          next.set(file.name, {
            hits,
            close,
            totalItems,
            timestamp: Date.now(),
            filters: [...patterns]
          });
          return next;
        });

        onLog(`✅ Found ${hits.length} matches, ${close.length} near-misses from ${totalItems} items`);

        if (hits.length > 0) {
          playNotificationSound();
        }
      } catch (e) {
        onLog(`❌ ${e.message}`);
      }
    }
  }, [filterPatterns, processFile, onLog]);

  // Process initial save data when tab is first accessed
  useEffect(() => {
    if (!initialProcessed && (itemStore?.hasItems || initialSaveData)) {
      setInitialProcessed(true);

      const filename = itemStore?.metadata?.filename || initialSaveData?.filename || 'unknown.sav';
      let hits, close, totalItems;

      // Prefer itemStore.inventory (already processed, avoids re-parsing)
      if (itemStore?.inventory?.length) {
        const result = filterInventoryItems(itemStore.inventory, filterPatterns, {
          closeMinTotal: 2,
          minHits: 1,
        });
        hits = result.hits;
        close = result.close;
        totalItems = result.totalItems;
      } else if (initialSaveData?.json) {
        // Fallback to raw JSON analysis
        const filterOptions = {
          slot1: filterPatterns,
          slot2: filterPatterns,
          slot3: filterPatterns,
          includeWeapons: true,
          showClose: true,
          closeMinTotal: 2,
          debug: false,
        };
        const result = analyzeUeSaveJson(initialSaveData.json, filterOptions);
        hits = result.hits;
        close = result.close;
        totalItems = result.totalItems;
      } else {
        return; // No data to process
      }

      setResults(prev => {
        const next = new Map(prev);
        next.set(filename, {
          hits,
          close,
          totalItems,
          timestamp: Date.now(),
          filters: [...filterPatterns]
        });
        return next;
      });

      if (initialSaveData?.file) {
        setLastFiles([initialSaveData.file]);
      }

      onLog(`✅ Found ${hits.length} matches, ${close.length} near-misses from ${totalItems} items in ${filename}`);

      if (hits.length > 0) {
        playNotificationSound();
      }
    }
  }, [initialSaveData, itemStore, initialProcessed, filterPatterns, onLog]);

  const handleFileDrop = useCallback(async (files) => {
    setLastFiles(files);
    onStatusChange('Processing...', 'scanning');
    await processFiles(files);
    onStatusChange('Ready', 'ready');
  }, [processFiles, onStatusChange]);

  const handlePickFile = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const handleFileInputChange = useCallback(async (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setLastFiles([file]);
      onStatusChange('Processing...', 'scanning');
      await processFiles([file]);
      onStatusChange('Ready', 'ready');
    }
    e.target.value = '';
  }, [processFiles, onStatusChange]);

  const handlePickDir = useCallback(async () => {
    if (!hasDirPicker()) return;

    try {
      const handle = await window.showDirectoryPicker({ mode: 'read' });
      setDirHandle(handle);
      onLog('📁 Folder granted (Chromium)');
      onStatusChange('Folder selected', 'active');

      // Scan once
      const files = [];
      for await (const [name, h] of handle.entries()) {
        if (/\.sav$/i.test(name)) {
          const file = await h.getFile();
          files.push(file);
        }
      }

      if (files.length > 0) {
        setLastFiles(files);
        await processFiles(files);
      }
      onStatusChange('Ready', 'ready');
    } catch (e) {
      onLog(`❌ Pick canceled: ${e?.message || e}`);
    }
  }, [processFiles, onLog, onStatusChange]);

  const handleStartWatch = useCallback(async () => {
    if (!hasDirPicker()) {
      alert('Directory watching requires Chrome/Edge/Brave.');
      return;
    }

    if (watching) {
      // Stop watching
      if (watchTimerRef.current) {
        clearInterval(watchTimerRef.current);
        watchTimerRef.current = null;
      }
      setWatching(false);
      onLog('⏹️ Stopped watching');
      onStatusChange('Ready', 'ready');
      return;
    }

    // Start watching
    let handle = dirHandle;
    if (!handle) {
      try {
        handle = await window.showDirectoryPicker({ mode: 'read' });
        setDirHandle(handle);
      } catch {
        return;
      }
    }

    onLog('👁️ Watching... (poll every 10s)');
    onStatusChange('Watching', 'active');
    setWatching(true);

    const scanOnce = async () => {
      const files = [];
      for await (const [name, h] of handle.entries()) {
        if (/\.sav$/i.test(name)) {
          const file = await h.getFile();
          files.push(file);
        }
      }
      if (files.length > 0) {
        setLastFiles(files);
        await processFiles(files);
      }
    };

    await scanOnce();
    watchTimerRef.current = setInterval(scanOnce, 10000);
  }, [watching, dirHandle, processFiles, onLog, onStatusChange]);

  const handleRerun = useCallback(async () => {
    if (lastFiles.length === 0) {
      onLog('⚠️ No files to re-run');
      return;
    }
    onLog(`🔄 Re-running ${lastFiles.length} file(s)`);
    onStatusChange('Re-running...', 'scanning');
    await processFiles(lastFiles);
    onStatusChange('Ready', 'ready');
  }, [lastFiles, processFiles, onLog, onStatusChange]);

  const handleClear = useCallback(() => {
    setResults(new Map());
    setLastFiles([]);
    onLog('🗑️ Results and file history cleared');
  }, [onLog]);

  const handleApplyConfig = useCallback(async () => {
    const patterns = parseFilterString(filterValue);
    if (patterns.length === 0) {
      onLog('⚠️ No valid filters provided');
      return;
    }
    setFilterPatterns(patterns);
    setConfigVisible(false);
    onLog('⚙️ Filters updated:', patterns.join(', '));

    if (lastFiles.length > 0) {
      onLog('🔄 Re-scanning with new filters...');
      onStatusChange('Applying filters...', 'scanning');
      setResults(new Map());
      await processFiles(lastFiles, patterns);
      onStatusChange('Ready', 'ready');
    }
  }, [filterValue, lastFiles, processFiles, onLog, onStatusChange]);

  const handleResetConfig = useCallback(async () => {
    setFilterValue(DEFAULT_FILTERS);
    const patterns = parseFilterString(DEFAULT_FILTERS);
    setFilterPatterns(patterns);
    setConfigVisible(false);
    onLog('🔄 Filters reset to defaults');

    if (lastFiles.length > 0) {
      onLog('🔄 Re-scanning with default filters...');
      onStatusChange('Applying filters...', 'scanning');
      setResults(new Map());
      await processFiles(lastFiles, patterns);
      onStatusChange('Ready', 'ready');
    }
  }, [lastFiles, processFiles, onLog, onStatusChange]);

  const sortedResults = Array.from(results.entries()).sort((a, b) => b[1].timestamp - a[1].timestamp);

  return (
    <div className="tab-content active">
      <input
        ref={fileInputRef}
        type="file"
        accept=".sav"
        hidden
        onChange={handleFileInputChange}
      />

      <div className="controls">
        <div className="control-row">
          <Button icon="📄" variant="primary" onClick={handlePickFile} disabled={isProcessing}>
            Pick .sav File
          </Button>
          <Button icon="📁" onClick={handlePickDir} hidden={!hasDirPicker()} disabled={isProcessing}>
            Pick Folder
          </Button>
          <Button
            icon={watching ? '⏹️' : '👁️'}
            onClick={handleStartWatch}
            hidden={!hasDirPicker()}
          >
            {watching ? 'Stop Watching' : 'Start Watching'}
          </Button>
          <Button icon="🔄" onClick={handleRerun} disabled={lastFiles.length === 0}>
            Re-run Last
          </Button>
        </div>
        <div className="control-row">
          <Button icon="🗑️" onClick={handleClear} disabled={results.size === 0}>
            Clear Results
          </Button>
          <Button icon="⚙️" onClick={() => setConfigVisible(!configVisible)}>
            Configure Filters
          </Button>
        </div>
      </div>

      <FilterConfig
        visible={configVisible}
        filterValue={filterValue}
        onFilterChange={setFilterValue}
        onApply={handleApplyConfig}
        onReset={handleResetConfig}
      />

      <DropZone
        icon="📦"
        text="Drop .sav files here or use the Pick button above"
        onFileDrop={handleFileDrop}
      />

      <div className="results-container">
        {results.size === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">🔭</div>
            <div>No results yet. Select a .sav file or drop one here to begin.</div>
          </div>
        ) : (
          <>
            <div className="filter-display">
              <strong>Active Filters:</strong> {filterPatterns.join(', ')}
              <div style={{ marginTop: '0.5rem', fontSize: '0.9em', color: 'var(--text-secondary)' }}>
                {results.size} file(s) processed | {lastFiles.length} file(s) in memory
              </div>
            </div>

            {sortedResults.map(([filename, data]) => (
              <React.Fragment key={filename}>
                {data.hits.length > 0 && (
                  <ResultsSection
                    title="Matches"
                    icon="✅"
                    filename={filename}
                    items={data.hits}
                    totalItems={data.totalItems}
                    timestamp={data.timestamp}
                    filterPatterns={filterPatterns}
                    type="hit"
                  />
                )}
                {data.close.length > 0 && (
                  <ResultsSection
                    title="Near Misses"
                    icon="⚡"
                    filename={filename}
                    items={data.close}
                    totalItems={data.totalItems}
                    timestamp={data.timestamp}
                    filterPatterns={filterPatterns}
                    type="close"
                  />
                )}
                {data.hits.length === 0 && data.close.length === 0 && (
                  <EmptyResultsSection
                    filename={filename}
                    totalItems={data.totalItems}
                    timestamp={data.timestamp}
                  />
                )}
              </React.Fragment>
            ))}
          </>
        )}
      </div>
    </div>
  );
}
