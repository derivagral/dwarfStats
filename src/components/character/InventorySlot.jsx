import React, { useState, useRef, useCallback, useEffect } from 'react';
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
  const [isFrozen, setIsFrozen] = useState(false);
  const slotRef = useRef(null);
  const closeTimeoutRef = useRef(null);
  const hoverStateRef = useRef({ slot: false, tooltip: false });

  // Show tooltip when hovering OR frozen
  const showTooltip = (isSlotHovered || isTooltipHovered || isFrozen) && !empty && item;

  // Close frozen tooltip when clicking outside
  useEffect(() => {
    if (!isFrozen) return;

    const handleClickOutside = (e) => {
      if (slotRef.current && !slotRef.current.contains(e.target)) {
        // Check if click is on the tooltip itself (which is in a portal)
        const tooltip = document.querySelector('.item-tooltip');
        if (tooltip && tooltip.contains(e.target)) return;
        setIsFrozen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isFrozen]);

  // Handle click - toggle frozen tooltip
  const handleClick = useCallback((e) => {
    if (!empty && item) {
      e.stopPropagation();
      setIsFrozen(prev => !prev);
    }
  }, [empty, item]);

  return (
    <div
      ref={slotRef}
      className={`inventory-slot${empty ? ' empty' : ''}${isFrozen ? ' frozen' : ''}${hasOverrides ? ' has-overrides' : ''}`}
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
          item={{
            item: {
              // Map Item model to tooltip format
              name: item.displayName,
              itemType: item.type,
              itemRow: item.rowName,
              // Convert baseStats to attributes format for tooltip
              attributes: (item.baseStats || []).map(s => ({
                name: s.rawTag || s.stat,
                value: s.value,
              })),
              monograms: item.monograms || [],
            }
          }}
          visible={showTooltip}
          frozen={isFrozen}
          slotRef={slotRef}
          onMouseEnter={() => {
            if (isFrozen) return; // Don't change hover state when frozen
            if (closeTimeoutRef.current) {
              clearTimeout(closeTimeoutRef.current);
              closeTimeoutRef.current = null;
            }
            hoverStateRef.current.tooltip = true;
            setIsTooltipHovered(true);
          }}
          onMouseLeave={() => {
            if (isFrozen) return; // Don't change hover state when frozen
            hoverStateRef.current.tooltip = false;
            closeTimeoutRef.current = setTimeout(() => {
              if (!hoverStateRef.current.slot) {
                setIsTooltipHovered(false);
              }
            }, 250);
          }}
          onClose={() => setIsFrozen(false)}
        />
      )}
    </div>
  );
}
