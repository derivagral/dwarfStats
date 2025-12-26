import React, { useState, useRef, useEffect } from 'react';
import { ItemDetailTooltip } from './ItemDetailTooltip';

export function InventorySlot({ label, name, type, empty = false, item = null }) {
  const [showTooltip, setShowTooltip] = useState(false);
  const [tooltipHovered, setTooltipHovered] = useState(false);
  const slotRef = useRef(null);
  const hideTimeoutRef = useRef(null);

  const clearHideTimeout = () => {
    if (hideTimeoutRef.current) {
      clearTimeout(hideTimeoutRef.current);
      hideTimeoutRef.current = null;
    }
  };

  const scheduleHide = () => {
    clearHideTimeout();
    hideTimeoutRef.current = setTimeout(() => {
      if (!tooltipHovered) {
        setShowTooltip(false);
      }
    }, 100);
  };

  const handleSlotEnter = () => {
    clearHideTimeout();
    setShowTooltip(true);
  };

  const handleSlotLeave = () => {
    scheduleHide();
  };

  const handleTooltipEnter = () => {
    clearHideTimeout();
    setTooltipHovered(true);
    setShowTooltip(true);
  };

  const handleTooltipLeave = () => {
    setTooltipHovered(false);
    setShowTooltip(false);
  };

  useEffect(() => {
    return () => {
      clearHideTimeout();
    };
  }, []);

  return (
    <div
      ref={slotRef}
      className={`inventory-slot${empty ? ' empty' : ''}`}
      onMouseEnter={handleSlotEnter}
      onMouseLeave={handleSlotLeave}
    >
      {label && <div className="slot-label">{label}</div>}
      <div className="slot-item-name">{name}</div>
      {type && <div className="slot-item-type">{type}</div>}

      {!empty && item && (
        <ItemDetailTooltip
          item={{ item }}
          visible={showTooltip}
          slotRef={slotRef}
          onMouseEnter={handleTooltipEnter}
          onMouseLeave={handleTooltipLeave}
        />
      )}
    </div>
  );
}
