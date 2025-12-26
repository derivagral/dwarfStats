import React, { useState, useRef } from 'react';
import { ItemDetailTooltip } from './ItemDetailTooltip';

export function InventorySlot({ label, name, type, empty = false, item = null }) {
  const [isSlotHovered, setIsSlotHovered] = useState(false);
  const [isTooltipHovered, setIsTooltipHovered] = useState(false);
  const slotRef = useRef(null);
  const showTooltip = isSlotHovered || isTooltipHovered;

  return (
    <div
      ref={slotRef}
      className={`inventory-slot${empty ? ' empty' : ''}`}
      onMouseEnter={() => setIsSlotHovered(true)}
      onMouseLeave={() => setIsSlotHovered(false)}
    >
      {label && <div className="slot-label">{label}</div>}
      <div className="slot-item-name">{name}</div>
      {type && <div className="slot-item-type">{type}</div>}

      {!empty && item && (
        <ItemDetailTooltip
          item={{ item }}
          visible={showTooltip}
          slotRef={slotRef}
          onMouseEnter={() => setIsTooltipHovered(true)}
          onMouseLeave={() => setIsTooltipHovered(false)}
        />
      )}
    </div>
  );
}
