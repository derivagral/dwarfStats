import React, { useCallback, useState } from 'react';
import { StatInput } from './StatInput';
import {
  BUCKET_DEFINITIONS,
  STAT_TYPES,
  getStatType,
  isStatAllowedInBucket,
} from '../../utils/statBuckets';

/**
 * A collapsible bucket of editable stat slots
 *
 * @param {Object} props
 * @param {string} props.bucketId - Bucket definition ID
 * @param {Object} props.bucketState - Current bucket state (slots array)
 * @param {Function} props.onUpdateSlot - (slotIndex, updates) => void
 * @param {Function} props.onAddSlot - () => void
 * @param {Function} props.onRemoveSlot - (slotIndex) => void
 * @param {Function} props.onClear - () => void
 * @param {boolean} props.collapsed - Initial collapsed state
 */
export function StatBucket({
  bucketId,
  bucketState,
  onUpdateSlot,
  onAddSlot,
  onRemoveSlot,
  onClear,
  collapsed: initialCollapsed = false,
}) {
  const [isCollapsed, setIsCollapsed] = useState(initialCollapsed);

  const def = BUCKET_DEFINITIONS[bucketId];
  if (!def || !bucketState) return null;

  const { slots } = bucketState;
  const canAddSlot = slots.length < def.maxSlots;

  // Filter available stats for this bucket
  const availableStats = def.allowedStats
    ? STAT_TYPES.filter(s => def.allowedStats.includes(s.id))
    : STAT_TYPES;

  // Handle stat type selection change
  const handleStatChange = useCallback((slotIndex, statId) => {
    const statType = getStatType(statId);
    onUpdateSlot?.(slotIndex, {
      statId: statId || null,
      value: statType?.defaultValue || 0,
    });
  }, [onUpdateSlot]);

  // Handle value change
  const handleValueChange = useCallback((slotIndex, value) => {
    onUpdateSlot?.(slotIndex, { value });
  }, [onUpdateSlot]);

  // Count active slots (have a stat selected)
  const activeCount = slots.filter(s => s.statId).length;

  return (
    <div className={`stat-bucket ${isCollapsed ? 'collapsed' : ''}`}>
      <div
        className="stat-bucket-header"
        onClick={() => setIsCollapsed(!isCollapsed)}
      >
        <span className="stat-bucket-toggle">
          {isCollapsed ? '▶' : '▼'}
        </span>
        <span className="stat-bucket-name">{def.name}</span>
        <span className="stat-bucket-count">
          {activeCount}/{slots.length}
        </span>
      </div>

      {!isCollapsed && (
        <div className="stat-bucket-content">
          {def.description && (
            <div className="stat-bucket-desc">{def.description}</div>
          )}

          <div className="stat-bucket-slots">
            {slots.map((slot, index) => (
              <StatSlotRow
                key={slot.id}
                slot={slot}
                index={index}
                availableStats={availableStats}
                onStatChange={(statId) => handleStatChange(index, statId)}
                onValueChange={(value) => handleValueChange(index, value)}
                onRemove={slots.length > 1 ? () => onRemoveSlot?.(index) : null}
              />
            ))}
          </div>

          <div className="stat-bucket-actions">
            {canAddSlot && (
              <button
                type="button"
                className="stat-bucket-add"
                onClick={onAddSlot}
              >
                + Add Slot
              </button>
            )}
            {activeCount > 0 && (
              <button
                type="button"
                className="stat-bucket-clear"
                onClick={onClear}
              >
                Clear
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * Individual slot row within a bucket
 */
function StatSlotRow({
  slot,
  index,
  availableStats,
  onStatChange,
  onValueChange,
  onRemove,
}) {
  const statType = slot.statId ? getStatType(slot.statId) : null;

  return (
    <div className="stat-slot-row">
      <select
        className="stat-slot-select"
        value={slot.statId || ''}
        onChange={(e) => onStatChange(e.target.value)}
      >
        <option value="">Select stat...</option>
        {availableStats.map(stat => (
          <option key={stat.id} value={stat.id}>
            {stat.name}
          </option>
        ))}
      </select>

      <StatInput
        value={slot.value}
        onChange={onValueChange}
        isPercent={statType?.isPercent || false}
        disabled={!slot.statId}
        step={statType?.isPercent ? 1 : 1}
        placeholder="0"
      />

      {onRemove && (
        <button
          type="button"
          className="stat-slot-remove"
          onClick={onRemove}
          title="Remove slot"
        >
          ×
        </button>
      )}
    </div>
  );
}
