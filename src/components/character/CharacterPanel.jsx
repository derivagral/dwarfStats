import React from 'react';
import { InventorySlot } from './InventorySlot';

export function CharacterPanel({ characterData }) {
  if (!characterData) return null;

  const baseName = characterData.filename.replace(/\.sav$/i, '');

  // Mockup equipped items - will be updated with real data parsing
  const equippedSlots = [
    { label: 'Main Hand', name: 'Equipped Weapon', type: 'Weapon' },
    { label: 'Off Hand', name: 'Equipped Shield', type: 'Shield' },
    { label: 'Head', name: 'Equipped Helm', type: 'Armor' },
    { label: 'Chest', name: 'Equipped Chest', type: 'Armor' },
    { label: 'Hands', name: 'Equipped Gloves', type: 'Armor' },
    { label: 'Feet', name: 'Equipped Boots', type: 'Armor' },
    { label: 'Ring 1', name: 'Empty', type: '', empty: true },
    { label: 'Ring 2', name: 'Empty', type: '', empty: true },
  ];

  // Mockup inventory items
  const inventoryItems = [
    { name: 'Health Potion', type: 'Consumable' },
    { name: 'Mana Potion', type: 'Consumable' },
    { name: 'Gold Ring', type: 'Accessory' },
    { name: 'Iron Ore', type: 'Material' },
  ];

  return (
    <div className="character-panel">
      <div className="character-header">
        <span className="character-name">{baseName}</span>
        <span className="character-class">Unknown Class</span>
      </div>

      <div className="equipment-section">
        <div className="section-title">Equipped Items</div>
        <div className="inventory-grid">
          {equippedSlots.map((slot, i) => (
            <InventorySlot
              key={i}
              label={slot.label}
              name={slot.name}
              type={slot.type}
              empty={slot.empty}
            />
          ))}
        </div>
      </div>

      <div className="equipment-section">
        <div className="section-title">Inventory</div>
        <div className="inventory-grid">
          {inventoryItems.map((item, i) => (
            <InventorySlot
              key={i}
              name={item.name}
              type={item.type}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
