import React, { useCallback } from 'react';
import { StatInput } from './StatInput';
import { getDisplayName } from '../../utils/attributeDisplay';
import { STAT_TYPES } from '../../utils/statBuckets';

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
 * @param {Function} props.onClearSlot - Clear all overrides for this slot
 * @param {Function} props.onClose - Close the editor
 */
export function ItemEditor({
  item,
  slotKey,
  slotOverrides,
  onUpdateMod,
  onAddMod,
  onRemoveMod,
  onRemoveBaseStat,
  onRestoreBaseStat,
  onClearSlot,
  onClose,
}) {
  if (!item) return null;

  const baseAttributes = item.attributes || [];
  const { mods = [], removedIndices = [] } = slotOverrides;

  const hasChanges = mods.length > 0 || removedIndices.length > 0;

  // Handle adding a new stat
  const handleAddStat = useCallback(() => {
    onAddMod?.({ name: '', value: 0, isNew: true });
  }, [onAddMod]);

  return (
    <div className="item-editor">
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
 */
function ModStatRow({ mod, onUpdate, onRemove }) {
  // Determine if this is a percentage stat
  const statType = STAT_TYPES.find(s => s.name === mod.name || s.id === mod.name);
  const isPercent = statType?.isPercent || false;

  return (
    <div className="item-editor-stat-row mod-stat">
      <select
        className="stat-row-select"
        value={mod.name}
        onChange={(e) => onUpdate({ name: e.target.value })}
      >
        <option value="">Select stat...</option>
        {STAT_TYPES.map(stat => (
          <option key={stat.id} value={stat.name}>
            {stat.name}
          </option>
        ))}
      </select>

      <StatInput
        value={mod.value}
        onChange={(value) => onUpdate({ value })}
        isPercent={isPercent}
        disabled={!mod.name}
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
