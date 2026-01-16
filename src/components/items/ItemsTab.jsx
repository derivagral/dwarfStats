import React, { useState, useMemo, useCallback, useRef } from 'react';
import { ItemDetailTooltip } from '../character/ItemDetailTooltip';
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
  const [showEquippedOnly, setShowEquippedOnly] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);

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

    if (saveData?.items?.length) {
      return {
        items: saveData.items,
        totalItems: saveData.totalItems || saveData.items.length,
      };
    }

    const { hits, totalItems: total } = analyzeUeSaveJson(saveData.raw || saveData.json, {
      includeWeapons: true,
      showClose: false,
      minHits: 0,
      debug: false,
    });

    return { items: hits, totalItems: total };
  }, [saveData]);

  const filteredItems = useMemo(() => {
    const regexList = filterPatterns.map(pattern => new RegExp(pattern.replace(/\*/g, '.*'), 'i'));

    const matchesFilter = (item) => {
      if (regexList.length === 0) return true;
      const attributes = item.item?.all_attributes || [];
      return attributes.some(attr => regexList.some(regex => regex.test(attr)));
    };

    return items.filter(item => {
      if (!matchesFilter(item)) return false;
      if (!showEquippedOnly) return true;
      return equippedLookup.has(item.item?.item_row);
    });
  }, [items, showEquippedOnly, equippedLookup, filterPatterns]);

  const equippedCount = useMemo(() => {
    return filteredItems.reduce((count, item) => count + (equippedLookup.has(item.item?.item_row) ? 1 : 0), 0);
  }, [filteredItems, equippedLookup]);

  const handleFilterChange = useCallback((value) => {
    setFilterValue(value);
    const patterns = parseFilterString(value);
    setFilterPatterns(patterns);
    if (patterns.length === 0) {
      onLog?.('🧰 Item filters cleared (showing all items)');
    }
  }, [onLog]);

  const itemAttributes = useMemo(() => {
    if (!selectedItem?.item?.all_attributes) return [];
    return selectedItem.item.all_attributes.map(attribute => ({
      name: attribute,
      value: null,
    }));
  }, [selectedItem]);

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
          <label className="checkbox-toggle">
            <input
              type="checkbox"
              checked={showEquippedOnly}
              onChange={(event) => setShowEquippedOnly(event.target.checked)}
            />
            Show Equipped Only
          </label>
          <label className="items-filter-input">
            <span>Filter:</span>
            <input
              type="text"
              value={filterValue}
              onChange={(event) => handleFilterChange(event.target.value)}
              placeholder="Fiery*Totem*Damage, Wisdom, LifeSteal"
            />
          </label>
        </div>
      </div>

      <div className="filter-display">
        <strong>Active Filters:</strong> {filterPatterns.length > 0 ? filterPatterns.join(', ') : 'None'}
        <div style={{ marginTop: '0.5rem', fontSize: '0.9em', color: 'var(--text-secondary)' }}>
          {filteredItems.length} of {totalItems} items shown | {equippedCount} equipped highlighted
        </div>
      </div>

      <div className="items-layout">
        <div className="items-list">
          {filteredItems.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon">📦</div>
              <div>No items match the current filters.</div>
            </div>
          ) : (
            filteredItems.map((item, index) => {
              const equippedLabel = equippedLookup.get(item.item?.item_row);
              return (
                <ItemListRow
                  key={`${item.item?.item_row || item.name}-${index}`}
                  item={item}
                  equippedLabel={equippedLabel}
                  isSelected={selectedItem?.item?.item_row === item.item?.item_row}
                  onSelect={() => setSelectedItem(item)}
                />
              );
            })
          )}
        </div>

        <div className="items-editor-panel">
          <div className="items-editor-header">
            <h3>Item Editor</h3>
            <div className="items-editor-actions">
              <button type="button" className="items-editor-action" disabled>
                New
              </button>
              <button type="button" className="items-editor-action" disabled>
                Edit
              </button>
              <button type="button" className="items-editor-action" disabled>
                Copy
              </button>
            </div>
          </div>

          {selectedItem ? (
            <div className="items-editor-body">
              <div className="items-editor-title">
                <span className="items-editor-name">{selectedItem.name}</span>
                <span className="items-editor-type">{selectedItem.type}</span>
              </div>
              <div className="items-editor-section">
                <div className="items-editor-section-title">Attributes</div>
                {itemAttributes.length === 0 ? (
                  <div className="items-editor-empty">No attributes parsed yet.</div>
                ) : (
                  <ul className="items-editor-attributes">
                    {itemAttributes.map((attr, attrIndex) => (
                      <li key={`${attr.name}-${attrIndex}`}>{attr.name}</li>
                    ))}
                  </ul>
                )}
              </div>
              <div className="items-editor-note">
                Editing tools will be wired up to the shared item workflow.
              </div>
            </div>
          ) : (
            <div className="items-editor-empty-state">
              Select an item to view details and future editing tools.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function ItemListRow({ item, equippedLabel, isSelected, onSelect }) {
  const [isSlotHovered, setIsSlotHovered] = useState(false);
  const [isTooltipHovered, setIsTooltipHovered] = useState(false);
  const rowRef = useRef(null);
  const closeTimeoutRef = useRef(null);
  const hoverStateRef = useRef({ row: false, tooltip: false });
  const showTooltip = (isSlotHovered || isTooltipHovered) && !isSelected;

  const tooltipItem = useMemo(() => ({
    name: item.name,
    itemType: item.type,
    itemRow: item.item?.item_row,
    attributes: (item.item?.all_attributes || []).map(attribute => ({
      name: attribute,
      value: null,
    })),
  }), [item]);

  return (
    <div
      ref={rowRef}
      className={`items-list-row${isSelected ? ' selected' : ''}`}
      onClick={onSelect}
      onMouseEnter={() => {
        if (closeTimeoutRef.current) {
          clearTimeout(closeTimeoutRef.current);
          closeTimeoutRef.current = null;
        }
        hoverStateRef.current.row = true;
        setIsSlotHovered(true);
      }}
      onMouseLeave={() => {
        hoverStateRef.current.row = false;
        closeTimeoutRef.current = setTimeout(() => {
          if (!hoverStateRef.current.tooltip) {
            setIsSlotHovered(false);
          }
        }, 200);
      }}
    >
      <div className="items-list-info">
        <div className="items-list-name">{item.name}</div>
        <div className="items-list-type">{item.type}</div>
      </div>
      {equippedLabel && <span className="item-badge equipped">Equipped: {equippedLabel}</span>}

      <ItemDetailTooltip
        item={{ item: tooltipItem }}
        visible={showTooltip}
        slotRef={rowRef}
        onMouseEnter={() => {
          if (closeTimeoutRef.current) {
            clearTimeout(closeTimeoutRef.current);
            closeTimeoutRef.current = null;
          }
          hoverStateRef.current.tooltip = true;
          setIsTooltipHovered(true);
        }}
        onMouseLeave={() => {
          hoverStateRef.current.tooltip = false;
          closeTimeoutRef.current = setTimeout(() => {
            if (!hoverStateRef.current.row) {
              setIsTooltipHovered(false);
            }
          }, 200);
        }}
      />
    </div>
  );
}
