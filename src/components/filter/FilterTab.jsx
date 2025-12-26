import React, { useState, useCallback, useRef } from 'react';
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

export function FilterTab({ onLog, onStatusChange }) {
  const [results, setResults] = useState(new Map());
  const [filterValue, setFilterValue] = useState(DEFAULT_FILTERS);
  const [filterPatterns, setFilterPatterns] = useState(parseFilterString(DEFAULT_FILTERS));
  const [configVisible, setConfigVisible] = useState(false);
  const [lastFiles, setLastFiles] = useState([]);
  const [dirHandle, setDirHandle] = useState(null);
  const [watching, setWatching] = useState(false);
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
    <div className="tab-content">
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
