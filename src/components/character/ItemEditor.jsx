import React, { useEffect, useMemo, useRef } from 'react';
import { getMonogramsForSlot, getMonogramName } from '../../utils/monogramRegistry';
import { MONOGRAM_SLOT_COUNT, normalizeMonogramSlots } from '../../utils/monogramOverrides';

/**
 * Map an item type/row to its Codex recipe pool.
 */
function getMonogramSlot(itemType, itemRow) {
  const typeStr = (itemType || itemRow || '').toLowerCase();

  if (typeStr.includes('head') || typeStr.includes('helm') || typeStr.includes('hat') || typeStr.includes('casque')) return 'head';
  if (typeStr.includes('amulet') || typeStr.includes('neck')) return 'amulet';
  if (typeStr.includes('bracer') || typeStr.includes('wrist')) return 'bracer';
  if (typeStr.includes('boots') || typeStr.includes('feet')) return 'boots';
  if (typeStr.includes('pants') || typeStr.includes('legs') || typeStr.includes('greaves')) return 'pants';
  if (typeStr.includes('relic')) return 'relic';
  if (typeStr.includes('ring')) return 'ring';

  return null;
}

/**
 * Monogram-only what-if editor. It updates engine state and never writes to
 * the imported save or item model.
 */
export function ItemEditor({
  item,
  slotOverrides = {},
  onSetMonogramSlot,
  onClearSlot,
  onClose,
  currentMonograms = [],
}) {
  const editorRef = useRef(null);

  useEffect(() => {
    editorRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }, [item]);

  const itemType = item?.type || item?.itemType || '';
  const itemRow = item?.rowName || item?.itemRow || '';
  const itemName = item?.displayName || item?.name || 'Unknown';
  const monogramSlot = getMonogramSlot(itemType, itemRow);
  const availableMonograms = useMemo(
    () => monogramSlot ? getMonogramsForSlot(monogramSlot) : [],
    [monogramSlot]
  );
  const monogramSlots = Array.isArray(slotOverrides.monogramSlots)
    ? normalizeMonogramSlots(slotOverrides.monogramSlots)
    : normalizeMonogramSlots(currentMonograms);
  const hasChanges = Array.isArray(slotOverrides.monogramSlots);

  // Keep an imported/legacy ID selectable even if the registry fixture has
  // not learned it yet.
  const optionMap = new Map(availableMonograms.map(monogram => [monogram.id, monogram]));
  for (const id of monogramSlots) {
    if (id && !optionMap.has(id)) {
      optionMap.set(id, { id, name: getMonogramName(id) });
    }
  }
  const options = Array.from(optionMap.values());

  return (
    <div className="item-editor" ref={editorRef}>
      <div className="item-editor-header">
        <div className="item-editor-title">
          <span className="item-editor-name">{itemName}</span>
          <span className="item-editor-type">{itemType}</span>
        </div>
        <div className="item-editor-actions">
          {hasChanges && (
            <button
              type="button"
              className="item-editor-reset"
              onClick={onClearSlot}
              title="Restore imported monograms"
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
        {monogramSlot ? (
          <div className="item-editor-section">
            <div className="item-editor-section-title">
              Monograms
              <span className="item-editor-section-hint">({monogramSlot}, engine only)</span>
            </div>
            <div className="item-editor-stats">
              {Array.from({ length: MONOGRAM_SLOT_COUNT }, (_, index) => (
                <label
                  key={index}
                  className="item-editor-stat-row monogram-row"
                >
                  <span className="stat-row-name">Slot {index + 1}</span>
                  <select
                    className="stat-row-select monogram-select"
                    value={monogramSlots[index] || ''}
                    onChange={event => onSetMonogramSlot?.(index, event.target.value || null)}
                  >
                    <option value="">None</option>
                    {options.map(monogram => (
                      <option key={monogram.id} value={monogram.id}>
                        {monogram.name}
                      </option>
                    ))}
                  </select>
                </label>
              ))}
            </div>
            <div className="item-editor-empty">
              Hypothetical only; the save and imported item remain unchanged.
            </div>
          </div>
        ) : (
          <div className="item-editor-empty">
            This item does not use a monogram recipe pool.
          </div>
        )}
      </div>
    </div>
  );
}
