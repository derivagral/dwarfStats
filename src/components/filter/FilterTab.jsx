import React, { useState, useCallback, useRef, useEffect } from 'react';
import { Button } from '../common';
import { FilterConfig } from './FilterConfig';
import { ResultsSection, EmptyResultsSection } from './ResultsSection';
import { playNotificationSound } from '../../utils/sound';
import { filterByModel } from '../../utils/itemFilter';
import { transformAllItems } from '../../models/itemTransformer';
import { createFilterModel } from '../../models/FilterModel';
import { useFilterProfiles } from '../../hooks/useFilterProfiles';

// File acquisition (drop/pick/live-watch) is consolidated on the Upload tab —
// this tab is a pure view over the item store: results re-filter reactively
// when the filter model changes or the store reloads (including live watch).
export function FilterTab({ initialSaveData, itemStore, onLog, onStatusChange, sharedFilterModel, onSharedFilterConsumed }) {
  const [results, setResults] = useState(new Map());
  const [filterModel, setFilterModel] = useState(() => createFilterModel('Default'));
  const [configVisible, setConfigVisible] = useState(false);
  const seenFilesRef = useRef(new Set());
  const { profiles, saveProfile, deleteProfile } = useFilterProfiles();

  /**
   * Run filtering against an array of Item models
   */
  const runFilter = useCallback((items, model) => {
    return filterByModel(items, model);
  }, []);

  // Keep the loaded save's results live: re-filter the in-memory inventory
  // whenever the filter model changes or a new save is loaded (uploads and
  // live-watch reloads both land in the item store).
  useEffect(() => {
    if (!itemStore?.hasItems && !initialSaveData) return;

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

    // Only chime when this save first appears, not on every filter tweak
    const isNew = !seenFilesRef.current.has(filename);
    seenFilesRef.current.add(filename);
    if (isNew && hits.length > 0) playNotificationSound();

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

  }, [initialSaveData, itemStore?.inventory, itemStore?.metadata?.filename, filterModel, runFilter]);

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

  const handleClear = useCallback(() => {
    setResults(new Map());
    seenFilesRef.current.clear();
    onLog('Results cleared');
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

  // The reactive effect above re-filters on every model change; Apply/Reset
  // just close the panel and log.
  const handleApplyConfig = useCallback(() => {
    if (filterModel.affixes.length === 0 && filterModel.monograms.length === 0) {
      onLog('No filter criteria selected');
      return;
    }
    setConfigVisible(false);
    onLog(`Filters updated: ${filterModel.affixes.length} affixes, ${filterModel.monograms.length} monograms`);
  }, [filterModel, onLog]);

  const handleResetConfig = useCallback(() => {
    setFilterModel(createFilterModel('Default'));
    setConfigVisible(false);
    onLog('Filters reset');
  }, [onLog]);

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
      <div className="controls">
        <div className="control-row">
          <Button icon="⚙️" variant="primary" onClick={() => setConfigVisible(!configVisible)}>
            Configure Filters
          </Button>
          <Button icon="🗑️" onClick={handleClear} disabled={results.size === 0}>
            Clear Results
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
                  Load a save on the <strong>Upload</strong> tab (or enable <strong>Live watch</strong> there) to apply this filter.
                </div>
              </>
            ) : (
              <>
                <div className="empty-state-icon">🔭</div>
                <div>No results yet. Load a save on the <strong>Upload</strong> tab, then configure filters here.</div>
              </>
            )}
          </div>
        ) : (
          <>
            <div className="filter-display">
              {profileLabel && <div className="filter-profile-name">{profileLabel}</div>}
              <strong>Active Filters:</strong> {filterSummary}
              <div style={{ marginTop: '0.5rem', fontSize: '0.9em', color: 'var(--text-secondary)' }}>
                {results.size} save(s) scanned — results update live as filters change or the save reloads
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
