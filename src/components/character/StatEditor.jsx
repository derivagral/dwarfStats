import React from 'react';
import { StatBucket } from './StatBucket';
import { BUCKET_ORDER, BUCKET_DEFINITIONS } from '../../utils/statBuckets';

/**
 * Panel containing all stat editing buckets
 *
 * @param {Object} props
 * @param {Object} props.overrides - Current overrides state
 * @param {Object} props.totals - Calculated totals by stat ID
 * @param {boolean} props.hasOverrides - Whether any overrides are set
 * @param {Function} props.onUpdateSlot - (bucketId, slotIndex, updates) => void
 * @param {Function} props.onAddSlot - (bucketId) => void
 * @param {Function} props.onRemoveSlot - (bucketId, slotIndex) => void
 * @param {Function} props.onClearBucket - (bucketId) => void
 * @param {Function} props.onClearAll - () => void
 */
export function StatEditor({
  overrides,
  totals,
  hasOverrides,
  onUpdateSlot,
  onAddSlot,
  onRemoveSlot,
  onClearBucket,
  onClearAll,
}) {
  return (
    <div className="stat-editor">
      <div className="stat-editor-header">
        <span className="stat-editor-title">Stat Overrides</span>
        {hasOverrides && (
          <button
            type="button"
            className="stat-editor-clear-all"
            onClick={onClearAll}
          >
            Clear All
          </button>
        )}
      </div>

      <div className="stat-editor-content">
        {BUCKET_ORDER.map((bucketId, index) => (
          <StatBucket
            key={bucketId}
            bucketId={bucketId}
            bucketState={overrides[bucketId]}
            onUpdateSlot={(slotIndex, updates) =>
              onUpdateSlot?.(bucketId, slotIndex, updates)
            }
            onAddSlot={() => onAddSlot?.(bucketId)}
            onRemoveSlot={(slotIndex) => onRemoveSlot?.(bucketId, slotIndex)}
            onClear={() => onClearBucket?.(bucketId)}
            collapsed={index > 1} // Collapse all but first two buckets by default
          />
        ))}
      </div>

      {hasOverrides && Object.keys(totals).length > 0 && (
        <div className="stat-editor-summary">
          <div className="stat-editor-summary-title">Override Totals</div>
          <div className="stat-editor-summary-list">
            {Object.entries(totals).map(([statId, value]) => (
              <div key={statId} className="stat-editor-summary-item">
                <span className="summary-stat-name">{statId}</span>
                <span className="summary-stat-value">
                  {typeof value === 'number' ? value.toFixed(2) : value}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
