import React, { useState, useCallback, useRef, useEffect } from 'react';
import { Button, DropZone } from '../common';
import { FilterConfig } from './FilterConfig';
import { ResultsSection, EmptyResultsSection } from './ResultsSection';
import { useFileProcessor } from '../../hooks/useFileProcessor';
import { hasDirPicker } from '../../utils/platform';
import { playNotificationSound } from '../../utils/sound';
import { filterByModel } from '../../utils/itemFilter';
import { transformAllItems } from '../../models/itemTransformer';
import { createFilterModel } from '../../models/FilterModel';
import { useFilterProfiles } from '../../hooks/useFilterProfiles';

export function FilterTab({ initialSaveData, itemStore, onLog, onStatusChange, sharedFilterModel, onSharedFilterConsumed }) {
  const [results, setResults] = useState(new Map());
  const [filterModel, setFilterModel] = useState(() => createFilterModel('Default'));
  const [configVisible, setConfigVisible] = useState(false);
  const [lastFiles, setLastFiles] = useState([]);
  const [dirHandle, setDirHandle] = useState(null);
  const [watching, setWatching] = useState(false);
  const [initialProcessed, setInitialProcessed] = useState(false);
  const watchTimerRef = useRef(null);
  const fileInputRef = useRef(null);
  const { processFile, isProcessing } = useFileProcessor();
  const { profiles, saveProfile, deleteProfile } = useFilterProfiles();

  /**
   * Run filtering against an array of Item models
   */
  const runFilter = useCallback((items, model) => {
    return filterByModel(items, model);
  }, []);

  /**
   * Process .sav files: parse via WASM, transform to Item models, then filter.
   */
  const processFiles = useCallback(async (files, model = filterModel) => {
    for (const file of files) {
      try {
        onLog(`Converting: ${file.name} (${(file.size / 1024).toFixed(1)} KB)`);
        const result = await processFile(file);

        // Transform raw JSON into Item models (equipment arrays are
        // automatically excluded by the transformer)
        const { items: searchableItems } = transformAllItems(result.json);
        const { hits, close, totalItems } = runFilter(searchableItems, model);

        setResults(prev => {
          const next = new Map(prev);
          next.set(file.name, {
            hits,
            close,
            totalItems,
            timestamp: Date.now(),
            filterModel: model,
          });
          return next;
        });

        onLog(`Found ${hits.length} matches, ${close.length} near-misses from ${totalItems} items`);

        if (hits.length > 0) {
          playNotificationSound();
        }
      } catch (e) {
        onLog(`Error: ${e.message}`);
      }
    }
  }, [filterModel, processFile, onLog, runFilter]);

  // Process initial save data when tab is first accessed
  useEffect(() => {
    if (!initialProcessed && (itemStore?.hasItems || initialSaveData)) {
      setInitialProcessed(true);

      const filename = itemStore?.metadata?.filename || initialSaveData?.filename || 'unknown.sav';

      // Prefer itemStore.inventory (already Item models)
      let items;
      if (itemStore?.inventory?.length) {
        items = itemStore.inventory;
      } else if (initialSaveData?.json) {
        const result = transformAllItems(initialSaveData.json);
        items = result.items;
      } else {
        return;
      }

      const { hits, close, totalItems } = runFilter(items, filterModel);

      setResults(prev => {
        const next = new Map(prev);
        next.set(filename, {
          hits,
          close,
          totalItems,
          timestamp: Date.now(),
          filterModel,
        });
        return next;
      });

      if (initialSaveData?.file) {
        setLastFiles([initialSaveData.file]);
      }

      onLog(`Found ${hits.length} matches, ${close.length} near-misses from ${totalItems} items in ${filename}`);

      if (hits.length > 0) {
        playNotificationSound();
      }
    }
  }, [initialSaveData, itemStore, initialProcessed, filterModel, onLog, runFilter]);

  // Load shared filter model from URL and auto-save to profiles
  useEffect(() => {
    if (!sharedFilterModel) return;
    const model = {
      ...sharedFilterModel,
      id: `filter-${Date.now()}-shared`,
    };
    setFilterModel(model);
    setConfigVisible(true);
    saveProfile(model);
    onLog(`Loaded shared filter: "${sharedFilterModel.name}" (${sharedFilterModel.affixes.length} affixes, ${sharedFilterModel.monograms.length} monograms) — saved to profiles`);
    if (onSharedFilterConsumed) onSharedFilterConsumed();
  }, [sharedFilterModel, onLog, onSharedFilterConsumed, saveProfile]);

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
      onLog('Folder granted (Chromium)');
      onStatusChange('Folder selected', 'active');

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
      onLog(`Pick canceled: ${e?.message || e}`);
    }
  }, [processFiles, onLog, onStatusChange]);

  const handleStartWatch = useCallback(async () => {
    if (!hasDirPicker()) {
      alert('Directory watching requires Chrome/Edge/Brave.');
      return;
    }

    if (watching) {
      if (watchTimerRef.current) {
        clearInterval(watchTimerRef.current);
        watchTimerRef.current = null;
      }
      setWatching(false);
      onLog('Stopped watching');
      onStatusChange('Ready', 'ready');
      return;
    }

    let handle = dirHandle;
    if (!handle) {
      try {
        handle = await window.showDirectoryPicker({ mode: 'read' });
        setDirHandle(handle);
      } catch {
        return;
      }
    }

    onLog('Watching... (poll every 10s)');
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
      onLog('No files to re-run');
      return;
    }
    onLog(`Re-running ${lastFiles.length} file(s)`);
    onStatusChange('Re-running...', 'scanning');
    await processFiles(lastFiles);
    onStatusChange('Ready', 'ready');
  }, [lastFiles, processFiles, onLog, onStatusChange]);

  const handleClear = useCallback(() => {
    setResults(new Map());
    setLastFiles([]);
    onLog('Results and file history cleared');
  }, [onLog]);

  // --- Filter model updates from the config panel ---
  const handleProfileNameChange = useCallback((name) => {
    setFilterModel(prev => ({ ...prev, name }));
  }, []);

  const handleAffixChange = useCallback((affixIds) => {
    setFilterModel(prev => ({
      ...prev,
      affixes: affixIds.map(id => ({ affixId: id })),
    }));
  }, []);

  const handleMonogramChange = useCallback((monoIds) => {
    setFilterModel(prev => ({
      ...prev,
      monograms: monoIds.map(id => ({ monogramId: id, minCount: null })),
    }));
  }, []);

  const handleMinTotalMonogramsChange = useCallback((value) => {
    setFilterModel(prev => ({
      ...prev,
      options: { ...prev.options, minTotalMonograms: value },
    }));
  }, []);

  const handleSaveProfile = useCallback(() => {
    if (!filterModel.name || !filterModel.name.trim()) {
      onLog('Enter a profile name before saving');
      return;
    }
    saveProfile(filterModel);
    onLog(`Profile "${filterModel.name}" saved`);
  }, [filterModel, saveProfile, onLog]);

  const handleLoadProfile = useCallback((profile) => {
    setFilterModel({
      ...profile,
      id: `filter-${Date.now()}-loaded`,
    });
    onLog(`Profile "${profile.name}" loaded`);
  }, [onLog]);

  const handleDeleteProfile = useCallback((name) => {
    deleteProfile(name);
    onLog(`Profile "${name}" deleted`);
  }, [deleteProfile, onLog]);

  const handleApplyConfig = useCallback(async () => {
    if (filterModel.affixes.length === 0 && filterModel.monograms.length === 0) {
      onLog('No filter criteria selected');
      return;
    }
    setConfigVisible(false);
    onLog(`Filters updated: ${filterModel.affixes.length} affixes, ${filterModel.monograms.length} monograms`);

    if (lastFiles.length > 0) {
      onLog('Re-scanning with new filters...');
      onStatusChange('Applying filters...', 'scanning');
      setResults(new Map());
      await processFiles(lastFiles, filterModel);
      onStatusChange('Ready', 'ready');
    } else if (itemStore?.inventory?.length) {
      // Re-filter existing inventory (already excludes equipped items)
      const filename = itemStore?.metadata?.filename || 'loaded.sav';
      const { hits, close, totalItems } = runFilter(itemStore.inventory, filterModel);
      setResults(new Map([[filename, {
        hits, close, totalItems,
        timestamp: Date.now(),
        filterModel,
      }]]));
      onLog(`Found ${hits.length} matches, ${close.length} near-misses from ${totalItems} items`);
      if (hits.length > 0) playNotificationSound();
    }
  }, [filterModel, lastFiles, processFiles, onLog, onStatusChange, itemStore, runFilter]);

  const handleResetConfig = useCallback(async () => {
    const newModel = createFilterModel('Default');
    setFilterModel(newModel);
    setConfigVisible(false);
    onLog('Filters reset');

    if (lastFiles.length > 0) {
      onLog('Re-scanning with cleared filters...');
      onStatusChange('Applying filters...', 'scanning');
      setResults(new Map());
      await processFiles(lastFiles, newModel);
      onStatusChange('Ready', 'ready');
    }
  }, [lastFiles, processFiles, onLog, onStatusChange]);

  const sortedResults = Array.from(results.entries()).sort((a, b) => b[1].timestamp - a[1].timestamp);

  // Build a summary string for the active filters display
  const filterSummary = (() => {
    const parts = [];
    if (filterModel.affixes.length > 0) {
      parts.push(`${filterModel.affixes.length} affix(es)`);
    }
    if (filterModel.monograms.length > 0) {
      parts.push(`${filterModel.monograms.length} monogram(s)`);
    }
    if (filterModel.options.minTotalMonograms != null) {
      parts.push(`min ${filterModel.options.minTotalMonograms} total mono`);
    }
    return parts.length > 0 ? parts.join(', ') : 'None configured';
  })();

  const profileLabel = filterModel.name && filterModel.name !== 'Default'
    ? filterModel.name
    : null;

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
        filterModel={filterModel}
        profileName={filterModel.name}
        selectedAffixes={filterModel.affixes.map(a => a.affixId)}
        selectedMonograms={filterModel.monograms.map(m => m.monogramId)}
        minTotalMonograms={filterModel.options.minTotalMonograms}
        onProfileNameChange={handleProfileNameChange}
        onAffixChange={handleAffixChange}
        onMonogramChange={handleMonogramChange}
        onMinTotalMonogramsChange={handleMinTotalMonogramsChange}
        onApply={handleApplyConfig}
        onReset={handleResetConfig}
        savedProfiles={profiles}
        onSaveProfile={handleSaveProfile}
        onLoadProfile={handleLoadProfile}
        onDeleteProfile={handleDeleteProfile}
        onLog={onLog}
      />

      <DropZone
        icon="📦"
        text="Drop .sav files here or use the Pick button above"
        onFileDrop={handleFileDrop}
      />

      <div className="results-container">
        {results.size === 0 ? (
          <div className="empty-state">
            {(filterModel.affixes.length > 0 || filterModel.monograms.length > 0) ? (
              <>
                <div className="empty-state-icon">🔍</div>
                <div className="filter-display" style={{ textAlign: 'left', display: 'inline-block' }}>
                  {profileLabel && <div className="filter-profile-name">{profileLabel}</div>}
                  <strong>Filter Ready:</strong> {filterSummary}
                </div>
                <div style={{ marginTop: '1rem', color: 'var(--text-secondary)' }}>
                  Drop a <code>.sav</code> file above or use <strong>Pick .sav File</strong> to apply this filter.
                </div>
              </>
            ) : (
              <>
                <div className="empty-state-icon">🔭</div>
                <div>No results yet. Select a .sav file or drop one here to begin.</div>
              </>
            )}
          </div>
        ) : (
          <>
            <div className="filter-display">
              {profileLabel && <div className="filter-profile-name">{profileLabel}</div>}
              <strong>Active Filters:</strong> {filterSummary}
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
                    filterModel={data.filterModel || filterModel}
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
                    filterModel={data.filterModel || filterModel}
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
