import React, { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import { ItemDetailTooltip } from '../character/ItemDetailTooltip';
import { ItemEditor } from '../character/ItemEditor';
import { analyzeUeSaveJson } from '../../utils/dwarfFilter';
import { useItemOverrides } from '../../hooks/useItemOverrides';

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

const SLOT_OPTIONS = [
  { key: 'weapon', label: 'Weapon' },
  { key: 'head', label: 'Head' },
  { key: 'chest', label: 'Chest' },
  { key: 'hands', label: 'Hands' },
  { key: 'pants', label: 'Pants' },
  { key: 'boots', label: 'Boots' },
  { key: 'neck', label: 'Neck' },
  { key: 'bracer', label: 'Bracer' },
  { key: 'ring', label: 'Ring' },
  { key: 'relic', label: 'Relic' },
  { key: 'fossil', label: 'Fossil' },
  { key: 'dragon', label: 'Dragon' },
  { key: 'offhand', label: 'Offhand' },
  { key: 'unknown', label: 'Unknown' },
];

function parseFilterString(filterStr) {
  if (!filterStr || filterStr.trim() === '') return [];
  return filterStr.split(',').map(pattern => pattern.trim()).filter(Boolean);
}

export function ItemsTab({ saveData, onLog }) {
  const [filterValue, setFilterValue] = useState(DEFAULT_FILTERS);
  const [filterPatterns, setFilterPatterns] = useState(parseFilterString(DEFAULT_FILTERS));
  const [showEquippedOnly, setShowEquippedOnly] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [selectedItemKey, setSelectedItemKey] = useState(null);
  const [selectedItemKeys, setSelectedItemKeys] = useState(new Set());
  const [singleSelectMode, setSingleSelectMode] = useState(true);
  const [selectedSlots, setSelectedSlots] = useState(new Set());

  // Item overrides for editing
  const {
    overrides,
    hasSlotOverrides,
    getSlotOverrides,
    applyOverridesToItem,
    updateMod,
    addMod,
    removeMod,
    removeBaseStat,
    restoreBaseStat,
    clearSlot,
  } = useItemOverrides();

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

  const equippedSlotLookup = useMemo(() => {
    const lookup = new Map();
    if (!saveData?.equippedItems) return lookup;

    for (const item of saveData.equippedItems) {
      if (!item?.itemRow) continue;
      lookup.set(item.itemRow, item.slot || 'unknown');
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
      // Filter out invalid/empty items (no name or "None")
      const name = item.name || item.item?.generated_name;
      if (!name || name === 'None' || name === '(unknown)') return false;

      if (!matchesFilter(item)) return false;
      if (!showEquippedOnly) return true;
      return equippedLookup.has(item.item?.item_row);
    });
  }, [items, showEquippedOnly, equippedLookup, filterPatterns]);

  const slotFilteredItems = useMemo(() => {
    if (selectedSlots.size === 0) return filteredItems;
    return filteredItems.filter(item => {
      const slotKey = equippedSlotLookup.get(item.item?.item_row) || 'unknown';
      return selectedSlots.has(slotKey);
    });
  }, [filteredItems, selectedSlots, equippedSlotLookup]);

  const equippedCount = useMemo(() => {
    return slotFilteredItems.reduce((count, item) => count + (equippedLookup.has(item.item?.item_row) ? 1 : 0), 0);
  }, [slotFilteredItems, equippedLookup]);

  useEffect(() => {
    if (!selectedItemKeys.size) return;

    const filteredKeys = new Set();
    slotFilteredItems.forEach((item, index) => {
      filteredKeys.add(`${item.item?.item_row || item.name}-${index}`);
    });

    const nextSelectedKeys = new Set(
      Array.from(selectedItemKeys).filter(key => filteredKeys.has(key))
    );

    if (nextSelectedKeys.size !== selectedItemKeys.size) {
      setSelectedItemKeys(nextSelectedKeys);
    }

    if (selectedItemKey && !filteredKeys.has(selectedItemKey)) {
      const [nextKey] = nextSelectedKeys;
      setSelectedItemKey(nextKey || null);
      if (!nextKey) {
        setSelectedItem(null);
      }
    }
  }, [slotFilteredItems, selectedItemKey, selectedItemKeys]);

  const handleFilterChange = useCallback((value) => {
    setFilterValue(value);
    const patterns = parseFilterString(value);
    setFilterPatterns(patterns);
    if (patterns.length === 0) {
      onLog?.('🧰 Item filters cleared (showing all items)');
    }
  }, [onLog]);

  // Build item attributes for display, applying any overrides
  // Uses model.baseStats which excludes affix pools and monograms
  const itemAttributes = useMemo(() => {
    if (!selectedItem?.item) return [];

    const model = selectedItem.item.model;
    let baseAttributes;
    if (model?.baseStats?.length) {
      baseAttributes = model.baseStats.map(s => ({
        name: s.rawTag || s.stat,
        value: s.value,
      }));
    } else if (selectedItem.item.generated_attributes_with_values?.length) {
      baseAttributes = selectedItem.item.generated_attributes_with_values;
    } else {
      baseAttributes = [];
    }

    // Apply overrides if we have a selected item key
    if (selectedItemKey && hasSlotOverrides(selectedItemKey)) {
      return applyOverridesToItem(selectedItemKey, baseAttributes);
    }
    return baseAttributes;
  }, [selectedItem, selectedItemKey, hasSlotOverrides, applyOverridesToItem]);

  // Build item object for ItemEditor (matches character tab format)
  // Uses model.baseStats which excludes affix pools and monograms
  const editorItem = useMemo(() => {
    if (!selectedItem) return null;

    // Prefer the clean model's baseStats (excludes affix pools and monograms)
    const model = selectedItem.item?.model;
    let attributes;
    if (model?.baseStats?.length) {
      // Convert model.baseStats format to editor format
      attributes = model.baseStats.map(s => ({
        name: s.rawTag || s.stat,
        value: s.value,
      }));
    } else if (selectedItem.item?.generated_attributes_with_values?.length) {
      // Fallback to generated attributes only (not all_attributes which includes pools)
      attributes = selectedItem.item.generated_attributes_with_values;
    } else {
      attributes = [];
    }

    return {
      name: selectedItem.name,
      itemType: selectedItem.type,
      itemRow: selectedItem.item?.item_row,
      attributes,
    };
  }, [selectedItem]);

  // Handle closing the editor
  const handleCloseEditor = useCallback(() => {
    setSelectedItem(null);
    setSelectedItemKey(null);
    setSelectedItemKeys(new Set());
  }, []);

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
          <label className="checkbox-toggle">
            <input
              type="checkbox"
              checked={singleSelectMode}
              onChange={(event) => {
                const isSingle = event.target.checked;
                setSingleSelectMode(isSingle);
                if (isSingle && selectedItemKey) {
                  setSelectedItemKeys(new Set([selectedItemKey]));
                }
              }}
            />
            Single-select
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
        <div className="control-row items-slot-row">
          <span className="items-slot-label">Slots:</span>
          <button
            type="button"
            className="items-slot-clear"
            onClick={() => setSelectedSlots(new Set())}
            disabled={selectedSlots.size === 0}
          >
            All
          </button>
          <div className="items-slot-options">
            {SLOT_OPTIONS.map(({ key, label }) => (
              <label key={key} className="items-slot-option">
                <input
                  type="checkbox"
                  checked={selectedSlots.has(key)}
                  onChange={(event) => {
                    setSelectedSlots(prev => {
                      const next = new Set(prev);
                      if (event.target.checked) {
                        next.add(key);
                      } else {
                        next.delete(key);
                      }
                      return next;
                    });
                  }}
                />
                <span>{label}</span>
              </label>
            ))}
          </div>
        </div>
      </div>

      <div className="filter-display">
        <strong>Active Filters:</strong> {filterPatterns.length > 0 ? filterPatterns.join(', ') : 'None'}
        <div style={{ marginTop: '0.5rem', fontSize: '0.9em', color: 'var(--text-secondary)' }}>
          {slotFilteredItems.length} of {totalItems} items shown | {equippedCount} equipped highlighted
        </div>
      </div>

      <div className="items-layout">
        <div className="items-list">
          {slotFilteredItems.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon">📦</div>
              <div>No items match the current filters.</div>
            </div>
          ) : (
            slotFilteredItems.map((item, index) => {
              const itemKey = `${item.item?.item_row || item.name}-${index}`;
              const equippedLabel = equippedLookup.get(item.item?.item_row);
              return (
                <ItemListRow
                  key={itemKey}
                  item={item}
                  equippedLabel={equippedLabel}
                  isSelected={selectedItemKeys.has(itemKey)}
                  hasOverrides={hasSlotOverrides(itemKey)}
                  onSelect={() => {
                    setSelectedItem(item);
                    setSelectedItemKey(itemKey);
                    setSelectedItemKeys(prev => {
                      if (singleSelectMode) {
                        return new Set([itemKey]);
                      }
                      const next = new Set(prev);
                      if (next.has(itemKey)) {
                        next.delete(itemKey);
                      } else {
                        next.add(itemKey);
                      }
                      return next;
                    });
                  }}
                />
              );
            })
          )}
        </div>

        <div className="items-editor-panel">
          {selectedItem && editorItem ? (
            <ItemEditor
              item={editorItem}
              slotKey={selectedItemKey}
              slotOverrides={getSlotOverrides(selectedItemKey)}
              onUpdateMod={(modIndex, updates) => updateMod(selectedItemKey, modIndex, updates)}
              onAddMod={(mod) => addMod(selectedItemKey, mod)}
              onRemoveMod={(modIndex) => removeMod(selectedItemKey, modIndex)}
              onRemoveBaseStat={(index) => removeBaseStat(selectedItemKey, index)}
              onRestoreBaseStat={(index) => restoreBaseStat(selectedItemKey, index)}
              onClearSlot={() => clearSlot(selectedItemKey)}
              onClose={handleCloseEditor}
            />
          ) : (
            <div className="items-editor-empty-state">
              <div className="empty-state-icon">✎</div>
              <div>Select an item to view and edit stats.</div>
              <div className="empty-state-hint">
                Use the editor to add, modify, or remove stat values for theorycrafting.
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function ItemListRow({ item, equippedLabel, isSelected, hasOverrides, onSelect }) {
  const [isSlotHovered, setIsSlotHovered] = useState(false);
  const [isTooltipHovered, setIsTooltipHovered] = useState(false);
  const rowRef = useRef(null);
  const closeTimeoutRef = useRef(null);
  const hoverStateRef = useRef({ row: false, tooltip: false });
  const showTooltip = (isSlotHovered || isTooltipHovered) && !isSelected;

  const tooltipItem = useMemo(() => {
    // Prefer clean model's baseStats (excludes affix pools and monograms)
    const model = item.item?.model;
    let attributes;
    if (model?.baseStats?.length) {
      attributes = model.baseStats.map(s => ({
        name: s.rawTag || s.stat,
        value: s.value,
      }));
    } else if (item.item?.generated_attributes_with_values?.length) {
      attributes = item.item.generated_attributes_with_values;
    } else {
      attributes = [];
    }

    return {
      name: item.name,
      itemType: item.type,
      itemRow: item.item?.item_row,
      attributes,
    };
  }, [item]);

  return (
    <div
      ref={rowRef}
      className={`items-list-row${isSelected ? ' selected' : ''}${hasOverrides ? ' has-overrides' : ''}`}
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
      {hasOverrides && <span className="item-badge modified" title="Has modifications">✎</span>}
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
