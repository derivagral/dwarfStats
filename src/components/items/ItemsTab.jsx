import React, { useState, useMemo, useCallback } from 'react';
import { Button } from '../common';
import { FilterConfig } from '../filter/FilterConfig';
import { ItemCard } from '../filter/ItemCard';
import { analyzeUeSaveJson } from '../../utils/dwarfFilter';

const DEFAULT_FILTERS = '';

const SLOT_LABELS = {
  head: 'Head',
  chest: 'Chest',
  hands: 'Hands',
  pants: 'Pants',
  boots: 'Boots',
  weapon: 'Weapon',
  neck: 'Neck',
  bracer: 'Bracer',
  ring: 'Ring',
  relic: 'Relic',
  fossil: 'Fossil',
  dragon: 'Dragon',
  offhand: 'Offhand',
  unknown: 'Equipped'
};

function parseFilterString(filterStr) {
  if (!filterStr || filterStr.trim() === '') return [];
  return filterStr.split(',').map(pattern => pattern.trim()).filter(Boolean);
}

export function ItemsTab({ saveData, onLog }) {
  const [filterValue, setFilterValue] = useState(DEFAULT_FILTERS);
  const [filterPatterns, setFilterPatterns] = useState(parseFilterString(DEFAULT_FILTERS));
  const [configVisible, setConfigVisible] = useState(false);
  const [showEquippedOnly, setShowEquippedOnly] = useState(false);

  const equippedLookup = useMemo(() => {
    const lookup = new Map();
    if (!saveData?.equippedItems) return lookup;

    for (const item of saveData.equippedItems) {
      if (!item?.itemRow) continue;
      const label = SLOT_LABELS[item.slot] || item.slot || SLOT_LABELS.unknown;
      lookup.set(item.itemRow, label);
    }

    return lookup;
  }, [saveData]);

  const { items, totalItems } = useMemo(() => {
    if (!saveData?.raw && !saveData?.json) {
      return { items: [], totalItems: 0 };
    }

    const patterns = filterPatterns;
    const minHits = patterns.length === 0 ? 0 : 1;

    const { hits, totalItems: total } = analyzeUeSaveJson(saveData.raw || saveData.json, {
      slot1: patterns,
      slot2: patterns,
      slot3: patterns,
      includeWeapons: true,
      showClose: false,
      minHits,
      debug: false,
    });

    return { items: hits, totalItems: total };
  }, [saveData, filterPatterns]);

  const filteredItems = useMemo(() => {
    if (!showEquippedOnly) return items;
    return items.filter(item => equippedLookup.has(item.item?.item_row));
  }, [items, showEquippedOnly, equippedLookup]);

  const equippedCount = useMemo(() => {
    return filteredItems.reduce((count, item) => count + (equippedLookup.has(item.item?.item_row) ? 1 : 0), 0);
  }, [filteredItems, equippedLookup]);

  const handleApplyConfig = useCallback(async () => {
    const patterns = parseFilterString(filterValue);
    setFilterPatterns(patterns);
    setConfigVisible(false);
    if (patterns.length === 0) {
      onLog?.('🧰 Item filters cleared (showing all items)');
    } else {
      onLog?.('🧰 Item filters updated:', patterns.join(', '));
    }
  }, [filterValue, onLog]);

  const handleResetConfig = useCallback(async () => {
    setFilterValue(DEFAULT_FILTERS);
    const patterns = parseFilterString(DEFAULT_FILTERS);
    setFilterPatterns(patterns);
    setConfigVisible(false);
    onLog?.('🧰 Item filters reset');
  }, [onLog]);

  if (!saveData) {
    return (
      <div className="tab-content active">
        <div className="empty-state">
          <div className="empty-state-icon">🎒</div>
          <div>Load a .sav file to browse items.</div>
        </div>
      </div>
    );
  }

  return (
    <div className="tab-content active">
      <div className="items-header">
        <h2>Items</h2>
        <p className="items-description">
          Browse all items parsed from your save file. Equipped items are tagged and can be filtered.
        </p>
      </div>

      <div className="controls">
        <div className="control-row">
          <Button icon="⚙️" onClick={() => setConfigVisible(!configVisible)}>
            Configure Filters
          </Button>
          <label className="checkbox-toggle">
            <input
              type="checkbox"
              checked={showEquippedOnly}
              onChange={(event) => setShowEquippedOnly(event.target.checked)}
            />
            Show Equipped Only
          </label>
        </div>
      </div>

      <FilterConfig
        visible={configVisible}
        filterValue={filterValue}
        onFilterChange={setFilterValue}
        onApply={handleApplyConfig}
        onReset={handleResetConfig}
      />

      <div className="filter-display">
        <strong>Active Filters:</strong> {filterPatterns.length > 0 ? filterPatterns.join(', ') : 'None'}
        <div style={{ marginTop: '0.5rem', fontSize: '0.9em', color: 'var(--text-secondary)' }}>
          {filteredItems.length} of {totalItems} items shown | {equippedCount} equipped highlighted
        </div>
      </div>

      {filteredItems.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">📦</div>
          <div>No items match the current filters.</div>
        </div>
      ) : (
        <div className="item-grid">
          {filteredItems.map((item, index) => {
            const equippedLabel = equippedLookup.get(item.item?.item_row);
            return (
              <ItemCard
                key={`${item.item?.item_row || item.name}-${index}`}
                item={item}
                type=""
                filterPatterns={filterPatterns}
                equippedLabel={equippedLabel}
                showScores={filterPatterns.length > 0}
              />
            );
          })}
        </div>
      )}
    </div>
  );
}
