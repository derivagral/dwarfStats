import React from 'react';

export function InventorySlot({ label, name, type, empty = false }) {
  return (
    <div className={`inventory-slot${empty ? ' empty' : ''}`}>
      {label && <div className="slot-label">{label}</div>}
      <div className="slot-item-name">{name}</div>
      {type && <div className="slot-item-type">{type}</div>}
    </div>
  );
}
