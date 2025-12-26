import React, { useState, useRef } from 'react';
import { ItemDetailTooltip } from './ItemDetailTooltip';

export function InventorySlot({ label, name, type, empty = false, item = null }) {
  const [showTooltip, setShowTooltip] = useState(false);
  const slotRef = useRef(null);

  return (
    <div
      ref={slotRef}
      className={`inventory-slot${empty ? ' empty' : ''}`}
      onMouseEnter={() => setShowTooltip(true)}
      onMouseLeave={() => setShowTooltip(false)}
    >
      {label && <div className="slot-label">{label}</div>}
      <div className="slot-item-name">{name}</div>
      {type && <div className="slot-item-type">{type}</div>}

      {!empty && item && (
        <ItemDetailTooltip
          item={{ item }}
          visible={showTooltip}
          slotRef={slotRef}
        />
      )}
    </div>
  );
}
