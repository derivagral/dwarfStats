import React, { useState, useRef, useCallback } from 'react';
import { ItemDetailTooltip } from './ItemDetailTooltip';

export function InventorySlot({
  label,
  name,
  type,
  empty = false,
  item = null,
  slotKey = null,
  isSelected = false,
  hasOverrides = false,
  onSelect = null,
}) {
  const [isSlotHovered, setIsSlotHovered] = useState(false);
  const [isTooltipHovered, setIsTooltipHovered] = useState(false);
  const slotRef = useRef(null);
  const closeTimeoutRef = useRef(null);
  const hoverStateRef = useRef({ slot: false, tooltip: false });
  const showTooltip = (isSlotHovered || isTooltipHovered) && !isSelected;

  const handleClick = useCallback((e) => {
    if (!empty && item && onSelect) {
      e.stopPropagation();
      onSelect(slotKey, item);
    }
  }, [empty, item, slotKey, onSelect]);

  return (
    <div
      ref={slotRef}
      className={`inventory-slot${empty ? ' empty' : ''}${isSelected ? ' selected' : ''}${hasOverrides ? ' has-overrides' : ''}`}
      onClick={handleClick}
      onMouseEnter={() => {
        if (closeTimeoutRef.current) {
          clearTimeout(closeTimeoutRef.current);
          closeTimeoutRef.current = null;
        }
        hoverStateRef.current.slot = true;
        setIsSlotHovered(true);
      }}
      onMouseLeave={() => {
        hoverStateRef.current.slot = false;
        closeTimeoutRef.current = setTimeout(() => {
          if (!hoverStateRef.current.tooltip) {
            setIsSlotHovered(false);
          }
        }, 250);
      }}
    >
      {label && <div className="slot-label">{label}</div>}
      <div className="slot-item-name">{name}</div>
      {type && <div className="slot-item-type">{type}</div>}
      {hasOverrides && <span className="slot-override-indicator" title="Has modifications">✎</span>}

      {!empty && item && (
        <ItemDetailTooltip
          item={{ item }}
          visible={showTooltip}
          slotRef={slotRef}
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
              if (!hoverStateRef.current.slot) {
                setIsTooltipHovered(false);
              }
            }, 250);
          }}
        />
      )}
    </div>
  );
}
