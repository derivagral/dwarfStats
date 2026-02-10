import React, { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import { ItemDetailTooltip } from '../character/ItemDetailTooltip';
import { ItemEditor } from '../character/ItemEditor';
import { transformAllItems } from '../../models/itemTransformer';
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

export function ItemsTab({ saveData, itemStore, onLog }) {
  const [filterValue, setFilterValue] = useState(DEFAULT_FILTERS);
  const [filterPatterns, setFilterPatterns] = useState(parseFilterString(DEFAULT_FILTERS));
  const [showEquippedOnly, setShowEquippedOnly] = useState(true);
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
    addMonogram,
    removeMonogram,
    addSkillModifier,
    removeSkillModifier,
    clearSlot,
  } = useItemOverrides();

  const equippedLookup = useMemo(() => {
    const lookup = new Map();
    const equippedItems = itemStore?.equipped || [];

    for (const item of equippedItems) {
      if (!item?.rowName) continue;
      const label = SLOT_LABELS[item.slot] || item.slot || SLOT_LABELS.unknown;
      lookup.set(item.rowName, label);
    }

    return lookup;
  }, [itemStore?.equipped]);

  const equippedSlotLookup = useMemo(() => {
    const lookup = new Map();
    const equippedItems = itemStore?.equipped || [];

    for (const item of equippedItems) {
      if (!item?.rowName) continue;
      lookup.set(item.rowName, item.slot || 'unknown');
    }

    return lookup;
  }, [itemStore?.equipped]);

  const { items, totalItems } = useMemo(() => {
    // Prefer itemStore inventory (already processed Item models)
    if (itemStore?.inventory?.length) {
      return {
        items: itemStore.inventory,
        totalItems: itemStore.totalInventoryCount || itemStore.inventory.length,
      };
    }

    // Fallback to saveData — transform to Item models
    if (!saveData?.raw && !saveData?.json) {
      return { items: [], totalItems: 0 };
    }

    const { items: transformed, totalCount } = transformAllItems(saveData.raw || saveData.json);
    return { items: transformed, totalItems: totalCount };
  }, [itemStore?.inventory, itemStore?.totalInventoryCount, saveData]);

  const filteredItems = useMemo(() => {
    const regexList = filterPatterns.map(pattern => new RegExp(pattern.replace(/\*/g, '.*'), 'i'));

    const matchesFilter = (item) => {
      if (regexList.length === 0) return true;
      // Collect all searchable attribute names from the Item model
      const names = [];
      for (const s of (item.baseStats || [])) {
        if (s.stat) names.push(s.stat);
        if (s.rawTag) names.push(s.rawTag);
      }
      for (const pool of [item.affixPools?.pool1, item.affixPools?.pool2, item.affixPools?.pool3, item.affixPools?.inherent]) {
        for (const a of (pool || [])) {
          if (a.rowName) names.push(a.rowName);
        }
      }
      return names.some(attr => regexList.some(regex => regex.test(attr)));
    };

    return items.filter(item => {
      // Filter out invalid/empty items
      const name = item.displayName || item.rowName;
      if (!name || name === 'None' || name === '(unknown)') return false;

      if (!matchesFilter(item)) return false;
      if (!showEquippedOnly) return true;
      return equippedLookup.has(item.rowName);
    });
  }, [items, showEquippedOnly, equippedLookup, filterPatterns]);

  const slotFilteredItems = useMemo(() => {
    if (selectedSlots.size === 0) return filteredItems;
    return filteredItems.filter(item => {
      const slotKey = equippedSlotLookup.get(item.rowName) || 'unknown';
      return selectedSlots.has(slotKey);
    });
  }, [filteredItems, selectedSlots, equippedSlotLookup]);

  const equippedCount = useMemo(() => {
    return slotFilteredItems.reduce((count, item) => count + (equippedLookup.has(item.rowName) ? 1 : 0), 0);
  }, [slotFilteredItems, equippedLookup]);

  useEffect(() => {
    if (!selectedItemKeys.size) return;

    const filteredKeys = new Set();
    slotFilteredItems.forEach((item, index) => {
      filteredKeys.add(`${item.rowName || item.displayName}-${index}`);
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
  const itemAttributes = useMemo(() => {
    if (!selectedItem) return [];

    const baseAttributes = (selectedItem.baseStats || []).map(s => ({
      name: s.rawTag || s.stat,
      value: s.value,
    }));

    // Apply overrides if we have a selected item key
    if (selectedItemKey && hasSlotOverrides(selectedItemKey)) {
      return applyOverridesToItem(selectedItemKey, baseAttributes);
    }
    return baseAttributes;
  }, [selectedItem, selectedItemKey, hasSlotOverrides, applyOverridesToItem]);

  // Build item object for ItemEditor (matches character tab format)
  const editorItem = useMemo(() => {
    if (!selectedItem) return null;

    const attributes = (selectedItem.baseStats || []).map(s => ({
      name: s.rawTag || s.stat,
      value: s.value,
    }));

    return {
      name: selectedItem.displayName,
      itemType: selectedItem.type,
      itemRow: selectedItem.rowName,
      attributes,
    };
  }, [selectedItem]);

  // Handle closing the editor
  const handleCloseEditor = useCallback(() => {
    setSelectedItem(null);
    setSelectedItemKey(null);
    setSelectedItemKeys(new Set());
  }, []);

  if (!itemStore?.hasItems && !saveData) {
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
              const itemKey = `${item.rowName || item.displayName}-${index}`;
              const equippedLabel = equippedLookup.get(item.rowName);
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
              onAddMonogram={(mono) => addMonogram(selectedItemKey, mono)}
              onRemoveMonogram={(index) => removeMonogram(selectedItemKey, index)}
              onAddSkillModifier={(mod) => addSkillModifier(selectedItemKey, mod)}
              onRemoveSkillModifier={(index) => removeSkillModifier(selectedItemKey, index)}
              onClearSlot={() => clearSlot(selectedItemKey)}
              onClose={handleCloseEditor}
              currentMonograms={selectedItem?.monograms || []}
              currentSkillModifiers={selectedItem?.skillModifiers || []}
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
    const attributes = (item.baseStats || []).map(s => ({
      name: s.rawTag || s.stat,
      value: s.value,
    }));

    return {
      name: item.displayName,
      itemType: item.type,
      itemRow: item.rowName,
      attributes,
      monograms: item.monograms || [],
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
        <div className="items-list-name">{item.displayName}</div>
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
