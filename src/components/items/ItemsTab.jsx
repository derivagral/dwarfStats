import React, { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import { ItemDetailTooltip } from '../character/ItemDetailTooltip';
import { ItemEditor } from '../character/ItemEditor';
import { MonogramSetPanel } from './MonogramSetPanel';
import { transformAllItems } from '../../models/itemTransformer';
import { createMonogramSet, matchMonogramSet } from '../../models/MonogramSet';
import { useItemOverrides } from '../../hooks/useItemOverrides';
import { useMonogramSets } from '../../hooks/useMonogramSets';
import { formatSlotLabel, getUniqueSlotKeyMap } from '../../utils/equipmentParser';
import { buildItemList, getListItemSlot } from '../../utils/itemList';
import { applyMonogramOverrideToItem } from '../../utils/monogramOverrides';

const DEFAULT_FILTERS = '';

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

export function ItemsTab({ saveData, itemStore, itemOverrides, onLog }) {
  const [filterValue, setFilterValue] = useState(DEFAULT_FILTERS);
  const [filterPatterns, setFilterPatterns] = useState(parseFilterString(DEFAULT_FILTERS));
  const [showEquippedOnly, setShowEquippedOnly] = useState(true);
  const [selectedItem, setSelectedItem] = useState(null);
  const [selectedItemKey, setSelectedItemKey] = useState(null);
  const [selectedItemKeys, setSelectedItemKeys] = useState(new Set());
  const [singleSelectMode, setSingleSelectMode] = useState(true);
  const [selectedSlots, setSelectedSlots] = useState(new Set());
  const [monogramSetName, setMonogramSetName] = useState('');
  const [selectedMonogramSetName, setSelectedMonogramSetName] = useState('');
  const { sets: monogramSets, saveSet, deleteSet } = useMonogramSets();

  // Item overrides for editing. App shares one instance across tabs so edits
  // flow into the Character tab's stats and survive tab switches (this tab
  // unmounts when inactive). Local instance is a fallback for direct use.
  const localOverrides = useItemOverrides();
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
    setMonogramSlot,
    applyMonogramSet,
    addSkillModifier,
    removeSkillModifier,
    clearSlot,
  } = itemOverrides || localOverrides;

  const equippedItemBySlot = useMemo(() => {
    return new Map(
      Array.from(getUniqueSlotKeyMap(itemStore?.equipped || []), ([item, slotKey]) => [slotKey, item])
    );
  }, [itemStore?.equipped]);

  // The visible layout is always the current effective state, not a saved-set
  // preview. This makes it available on first render and directly editable.
  const currentMonogramSet = useMemo(() => createMonogramSet(
    'Current',
    itemStore?.equipped || [],
    overrides
  ), [itemStore?.equipped, overrides]);

  const { items, totalItems } = useMemo(() => {
    if (itemStore?.inventory?.length || itemStore?.equipped?.length) {
      return buildItemList(
        itemStore.equipped || [],
        itemStore.inventory || [],
        itemStore.totalInventoryCount
      );
    }

    if (!saveData?.raw && !saveData?.json) {
      return { items: [], totalItems: 0 };
    }

    const { items: transformed, totalCount } = transformAllItems(saveData.raw || saveData.json);
    return buildItemList([], transformed, totalCount);
  }, [itemStore?.equipped, itemStore?.inventory, itemStore?.totalInventoryCount, saveData]);

  // Equipped rows and their hover tooltips must show the active engine state,
  // not the immutable monograms imported from the save.
  const effectiveItems = useMemo(() => items.map(item => {
    if (!item.isEquipped || !item.equipmentSlotKey) return item;
    return applyMonogramOverrideToItem(
      item,
      overrides[item.equipmentSlotKey] || {}
    );
  }), [items, overrides]);

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

    return effectiveItems.filter(item => {
      // Filter out invalid/empty items
      const name = item.displayName || item.rowName;
      if (!name || name === 'None' || name === '(unknown)') return false;

      if (!matchesFilter(item)) return false;
      if (!showEquippedOnly) return true;
      return item.isEquipped;
    });
  }, [effectiveItems, showEquippedOnly, filterPatterns]);

  const slotFilteredItems = useMemo(() => {
    if (selectedSlots.size === 0) return filteredItems;
    return filteredItems.filter(item => {
      const slotKey = getListItemSlot(item);
      return selectedSlots.has(slotKey);
    });
  }, [filteredItems, selectedSlots]);

  const equippedCount = useMemo(() => {
    return slotFilteredItems.reduce((count, item) => count + (item.isEquipped ? 1 : 0), 0);
  }, [slotFilteredItems]);

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
  // Overrides for the selected item live under its unique slot key when it's
  // equipped (so they reach the Character tab stats); list key otherwise.
  const selectedOverrideKey = selectedItem
    ? (selectedItem.equipmentSlotKey || selectedItemKey)
    : selectedItemKey;

  const itemAttributes = useMemo(() => {
    if (!selectedItem) return [];

    const baseAttributes = (selectedItem.baseStats || []).map(s => ({
      name: s.rawTag || s.stat,
      value: s.value,
    }));

    // Apply overrides if we have a selected item key
    if (selectedOverrideKey && hasSlotOverrides(selectedOverrideKey)) {
      return applyOverridesToItem(selectedOverrideKey, baseAttributes);
    }
    return baseAttributes;
  }, [selectedItem, selectedOverrideKey, hasSlotOverrides, applyOverridesToItem]);

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

  const selectedMonogramSet = useMemo(
    () => monogramSets.find(monogramSet => monogramSet.name === selectedMonogramSetName) || null,
    [monogramSets, selectedMonogramSetName]
  );

  const handleSaveMonogramSet = useCallback(() => {
    const name = monogramSetName.trim();
    if (!name) return;

    const existing = monogramSets.find(monogramSet => monogramSet.name === name);
    const monogramSet = createMonogramSet(
      name,
      itemStore?.equipped || [],
      overrides,
      existing?.id
    );

    if (monogramSet.entries.length === 0) {
      onLog?.('No equipped monogram items to save');
      return;
    }

    saveSet(monogramSet);
    setSelectedMonogramSetName(name);
    onLog?.(`Monogram set "${name}" saved (${monogramSet.entries.length} items)`);
  }, [itemStore?.equipped, monogramSetName, monogramSets, onLog, overrides, saveSet]);

  const handleApplyMonogramSet = useCallback(() => {
    if (!selectedMonogramSet) return;
    const { monogramSlotsByEquipment, skipped } = matchMonogramSet(
      selectedMonogramSet,
      itemStore?.equipped || []
    );
    const appliedCount = Object.keys(monogramSlotsByEquipment).length;
    applyMonogramSet(monogramSlotsByEquipment);
    onLog?.(`Monogram set "${selectedMonogramSet.name}" applied to ${appliedCount} item(s)${skipped.length ? `; ${skipped.length} different/missing item(s) skipped` : ''}`);
  }, [applyMonogramSet, itemStore?.equipped, onLog, selectedMonogramSet]);

  const handleSetCurrentMonogramSlot = useCallback((slotKey, index, monogramId) => {
    const item = equippedItemBySlot.get(slotKey);
    if (!item) return;
    setMonogramSlot(slotKey, index, monogramId, item.monograms || item.model?.monograms || []);
  }, [equippedItemBySlot, setMonogramSlot]);

  const handleDeleteMonogramSet = useCallback(() => {
    if (!selectedMonogramSet) return;
    deleteSet(selectedMonogramSet.name);
    setSelectedMonogramSetName('');
    if (monogramSetName === selectedMonogramSet.name) setMonogramSetName('');
    onLog?.(`Monogram set "${selectedMonogramSet.name}" deleted`);
  }, [deleteSet, monogramSetName, onLog, selectedMonogramSet]);

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
          Browse imported items and try three-slot monogram loadouts without changing the save.
        </p>
      </div>

      <MonogramSetPanel
        name={monogramSetName}
        onNameChange={setMonogramSetName}
        savedSets={monogramSets}
        selectedSet={selectedMonogramSet}
        currentEntries={currentMonogramSet.entries}
        onSelectSet={name => {
          setSelectedMonogramSetName(name);
          if (name) setMonogramSetName(name);
        }}
        onSave={handleSaveMonogramSet}
        onApply={handleApplyMonogramSet}
        onDelete={handleDeleteMonogramSet}
        onSetMonogramSlot={handleSetCurrentMonogramSlot}
      />

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
              const equippedLabel = item.isEquipped
                ? (formatSlotLabel(item.slot) || item.slot || 'Equipped')
                : null;
              const overrideKey = item.equipmentSlotKey || itemKey;
              return (
                <ItemListRow
                  key={itemKey}
                  item={item}
                  equippedLabel={equippedLabel}
                  isSelected={selectedItemKeys.has(itemKey)}
                  hasOverrides={hasSlotOverrides(overrideKey)}
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
              slotKey={selectedOverrideKey}
              slotOverrides={getSlotOverrides(selectedOverrideKey)}
              onSetMonogramSlot={(index, monogramId) => setMonogramSlot(
                selectedOverrideKey,
                index,
                monogramId,
                selectedItem?.monograms || []
              )}
              onClearSlot={() => clearSlot(selectedOverrideKey)}
              onClose={handleCloseEditor}
              currentMonograms={selectedItem?.monograms || []}
              currentSkillModifiers={selectedItem?.skillModifiers || []}
            />
          ) : (
            <div className="items-editor-empty-state">
              <div className="empty-state-icon">✎</div>
              <div>Select an equipped item to edit its monograms.</div>
              <div className="empty-state-hint">
                Saved sets capture and reapply the complete effective monogram loadout.
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

  const itemSlotLabel = equippedLabel || formatSlotLabel(inferEquipmentSlot(item.rowName));

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
        <div className="items-list-type">{itemSlotLabel || item.type}</div>
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
