import React, { useCallback, useRef, useEffect, useMemo, useState } from 'react';
import { StatInput } from './StatInput';
import { getDisplayName } from '../../utils/attributeDisplay';
import { STAT_TYPES, getStatType } from '../../utils/statBuckets';
import { getMonogramsForSlot, getMonogramName, SLOT_MONOGRAMS } from '../../utils/monogramRegistry';

/**
 * Map item type/row to monogram slot
 * Returns null if no monogram slot applies
 */
function getMonogramSlot(itemType, itemRow) {
  const typeStr = (itemType || itemRow || '').toLowerCase();

  // Check for slot keywords
  if (typeStr.includes('head') || typeStr.includes('helm') || typeStr.includes('hat')) return 'head';
  if (typeStr.includes('amulet') || typeStr.includes('neck')) return 'amulet';
  if (typeStr.includes('bracer') || typeStr.includes('wrist')) return 'bracer';
  if (typeStr.includes('boots') || typeStr.includes('feet')) return 'boots';
  if (typeStr.includes('pants') || typeStr.includes('legs') || typeStr.includes('greaves')) return 'pants';
  if (typeStr.includes('relic')) return 'relic';

  return null;
}

/**
 * Panel for editing an individual item's stats
 *
 * @param {Object} props
 * @param {Object} props.item - The item being edited
 * @param {string} props.slotKey - The equipment slot key
 * @param {Object} props.slotOverrides - Current overrides for this slot
 * @param {Function} props.onUpdateMod - Update a modification
 * @param {Function} props.onAddMod - Add a new modification
 * @param {Function} props.onRemoveMod - Remove a modification
 * @param {Function} props.onRemoveBaseStat - Mark a base stat as removed
 * @param {Function} props.onRestoreBaseStat - Restore a removed base stat
 * @param {Function} props.onAddMonogram - Add a monogram to the item
 * @param {Function} props.onRemoveMonogram - Remove a monogram from the item
 * @param {Function} props.onClearSlot - Clear all overrides for this slot
 * @param {Function} props.onClose - Close the editor
 * @param {Array} props.currentMonograms - Current monograms on the item (from model)
 */
export function ItemEditor({
  item,
  slotKey,
  slotOverrides = {},
  onUpdateMod,
  onAddMod,
  onRemoveMod,
  onRemoveBaseStat,
  onRestoreBaseStat,
  onAddMonogram,
  onRemoveMonogram,
  onClearSlot,
  onClose,
  currentMonograms = [],
}) {
  const editorRef = useRef(null);

  // Scroll editor into view when it opens
  useEffect(() => {
    if (editorRef.current) {
      editorRef.current.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  }, [slotKey]);

  const [selectedMonogram, setSelectedMonogram] = useState('');

  if (!item) return null;

  const baseAttributes = item.attributes || [];
  const { mods = [], removedIndices = [], monograms: addedMonograms = [] } = slotOverrides;

  // Determine monogram slot for this item
  const monogramSlot = getMonogramSlot(item.itemType, item.itemRow);
  const availableMonograms = monogramSlot ? getMonogramsForSlot(monogramSlot) : [];

  // Get all current monogram IDs (base + added)
  const currentMonogramIds = useMemo(() => {
    const ids = new Set(currentMonograms.map(m => m.id));
    addedMonograms.forEach(m => ids.add(m.id));
    return ids;
  }, [currentMonograms, addedMonograms]);

  // Filter out already-selected monograms from the dropdown
  const selectableMonograms = useMemo(() => {
    return availableMonograms.filter(m => !currentMonogramIds.has(m.id));
  }, [availableMonograms, currentMonogramIds]);

  const hasChanges = mods.length > 0 || removedIndices.length > 0 || addedMonograms.length > 0;

  // Handle adding a new stat - store statId, not name
  const handleAddStat = useCallback(() => {
    onAddMod?.({ statId: '', value: 0, isNew: true });
  }, [onAddMod]);

  // Handle adding a monogram
  const handleAddMonogram = useCallback(() => {
    if (selectedMonogram && onAddMonogram) {
      onAddMonogram({ id: selectedMonogram, value: 1 });
      setSelectedMonogram('');
    }
  }, [selectedMonogram, onAddMonogram]);

  return (
    <div className="item-editor" ref={editorRef}>
      <div className="item-editor-header">
        <div className="item-editor-title">
          <span className="item-editor-name">{item.name}</span>
          <span className="item-editor-type">{item.itemType}</span>
        </div>
        <div className="item-editor-actions">
          {hasChanges && (
            <button
              type="button"
              className="item-editor-reset"
              onClick={onClearSlot}
              title="Reset all changes"
            >
              Reset
            </button>
          )}
          <button
            type="button"
            className="item-editor-close"
            onClick={onClose}
            title="Close editor"
          >
            ×
          </button>
        </div>
      </div>

      <div className="item-editor-content">
        {/* Base stats from item */}
        <div className="item-editor-section">
          <div className="item-editor-section-title">Base Stats</div>
          <div className="item-editor-stats">
            {baseAttributes.map((attr, index) => {
              const isRemoved = removedIndices.includes(index);
              return (
                <BaseStatRow
                  key={index}
                  attr={attr}
                  isRemoved={isRemoved}
                  onRemove={() => onRemoveBaseStat?.(index)}
                  onRestore={() => onRestoreBaseStat?.(index)}
                />
              );
            })}
            {baseAttributes.length === 0 && (
              <div className="item-editor-empty">No base stats</div>
            )}
          </div>
        </div>

        {/* Added/modified stats */}
        <div className="item-editor-section">
          <div className="item-editor-section-title">
            Added Stats
            <button
              type="button"
              className="item-editor-add-btn"
              onClick={handleAddStat}
            >
              + Add
            </button>
          </div>
          <div className="item-editor-stats">
            {mods.map((mod, index) => (
              <ModStatRow
                key={mod.id}
                mod={mod}
                onUpdate={(updates) => onUpdateMod?.(index, updates)}
                onRemove={() => onRemoveMod?.(index)}
              />
            ))}
            {mods.length === 0 && (
              <div className="item-editor-empty">
                Click "+ Add" to add custom stats
              </div>
            )}
          </div>
        </div>

        {/* Monograms section - only show if slot has monograms */}
        {availableMonograms.length > 0 && (
          <div className="item-editor-section">
            <div className="item-editor-section-title">
              Monograms
              <span className="item-editor-section-hint">({monogramSlot})</span>
            </div>

            {/* Current monograms from item */}
            <div className="item-editor-stats">
              {currentMonograms.map((mono, index) => (
                <div key={mono.id} className="item-editor-stat-row base-stat monogram-row">
                  <span className="stat-row-name">{getMonogramName(mono.id)}</span>
                  <span className="stat-row-value monogram-id">{mono.id}</span>
                </div>
              ))}

              {/* Added monograms */}
              {addedMonograms.map((mono, index) => (
                <div key={mono.id} className="item-editor-stat-row mod-stat monogram-row">
                  <span className="stat-row-name">{getMonogramName(mono.id)}</span>
                  <span className="stat-row-value monogram-id added">{mono.id}</span>
                  <button
                    type="button"
                    className="stat-row-remove"
                    onClick={() => onRemoveMonogram?.(index)}
                    title="Remove monogram"
                  >
                    ×
                  </button>
                </div>
              ))}

              {currentMonograms.length === 0 && addedMonograms.length === 0 && (
                <div className="item-editor-empty">No monograms</div>
              )}
            </div>

            {/* Add monogram selector */}
            {selectableMonograms.length > 0 && onAddMonogram && (
              <div className="item-editor-add-row">
                <select
                  className="stat-row-select monogram-select"
                  value={selectedMonogram}
                  onChange={(e) => setSelectedMonogram(e.target.value)}
                >
                  <option value="">Select monogram...</option>
                  {selectableMonograms.map(mono => (
                    <option key={mono.id} value={mono.id}>
                      {mono.name}
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  className="item-editor-add-btn"
                  onClick={handleAddMonogram}
                  disabled={!selectedMonogram}
                >
                  + Add
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * Row displaying a base stat with remove/restore toggle
 */
function BaseStatRow({ attr, isRemoved, onRemove, onRestore }) {
  const displayName = getDisplayName(attr.name);
  const displayValue = typeof attr.value === 'number'
    ? attr.value.toFixed(attr.value % 1 === 0 ? 0 : 2)
    : attr.value;

  return (
    <div className={`item-editor-stat-row base-stat ${isRemoved ? 'removed' : ''}`}>
      <span className="stat-row-name">{displayName}</span>
      <span className="stat-row-value">{displayValue}</span>
      <button
        type="button"
        className={`stat-row-toggle ${isRemoved ? 'restore' : 'remove'}`}
        onClick={isRemoved ? onRestore : onRemove}
        title={isRemoved ? 'Restore stat' : 'Remove stat'}
      >
        {isRemoved ? '↩' : '×'}
      </button>
    </div>
  );
}

/**
 * Row for editing an added/modified stat
 * Now uses statId to track which stat is selected
 */
function ModStatRow({ mod, onUpdate, onRemove }) {
  // Look up stat type by statId
  const statType = mod.statId ? getStatType(mod.statId) : null;
  const isPercent = statType?.isPercent || false;

  return (
    <div className="item-editor-stat-row mod-stat">
      <select
        className="stat-row-select"
        value={mod.statId || ''}
        onChange={(e) => onUpdate({ statId: e.target.value })}
      >
        <option value="">Select stat...</option>
        {STAT_TYPES.map(stat => (
          <option key={stat.id} value={stat.id}>
            {stat.name}
          </option>
        ))}
      </select>

      <StatInput
        value={mod.value}
        onChange={(value) => onUpdate({ value })}
        isPercent={isPercent}
        disabled={!mod.statId}
        step={isPercent ? 1 : 1}
      />

      <button
        type="button"
        className="stat-row-remove"
        onClick={onRemove}
        title="Remove stat"
      >
        ×
      </button>
    </div>
  );
}
