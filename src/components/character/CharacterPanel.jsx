import React from 'react';
import { InventorySlot } from './InventorySlot';
import { mapItemsToSlots } from '../../utils/equipmentParser';

export function CharacterPanel({ characterData }) {
  if (!characterData) return null;

  const baseName = characterData.filename.replace(/\.sav$/i, '');

  // Map equipped items to their slots
  const equippedItems = characterData.equippedItems || [];
  const slotMap = mapItemsToSlots(equippedItems);

  // Helper to create slot data
  const createSlot = (label, slotKey) => {
    const item = slotMap[slotKey];
    return {
      label,
      name: item ? item.name : 'Empty',
      type: item ? item.itemType : '',
      empty: !item,
      item: item || null
    };
  };

  // Left side equipment slots
  const leftSlots = [
    createSlot('Head', 'head'),
    createSlot('Chest', 'chest'),
    createSlot('Hands', 'hands'),
    createSlot('Pants', 'pants'),
    createSlot('Boots', 'boots'),
  ];

  // Right side equipment slots
  const rightSlots = [
    createSlot('Neck', 'neck'),
    createSlot('Bracer', 'bracer'),
    createSlot('Ring', 'ring1'),
    createSlot('Ring', 'ring2'),
    createSlot('Relic', 'relic'),
  ];

  // Center slots
  const fossilSlot = createSlot('Fossil', 'fossil');
  const weaponSlot = createSlot('Weapon', 'weapon');

  // Bottom offhand slots (4 slots with fixed stats)
  const offhandSlots = [
    createSlot('Offhand 1', 'offhand1'),
    createSlot('Offhand 2', 'offhand2'),
    createSlot('Offhand 3', 'offhand3'),
    createSlot('Offhand 4', 'offhand4'),
  ];

  return (
    <div className="character-panel">
      <div className="character-header">
        <span className="character-name">{baseName}</span>
        <span className="character-class">Unknown Class</span>
      </div>

      <div className="equipment-layout">
        {/* Left side slots */}
        <div className="equipment-column equipment-left">
          {leftSlots.map((slot, i) => (
            <InventorySlot
              key={`left-${i}`}
              label={slot.label}
              name={slot.name}
              type={slot.type}
              empty={slot.empty}
              item={slot.item}
            />
          ))}
        </div>

        {/* Center character, fossil, and weapon */}
        <div className="equipment-column equipment-center">
          <InventorySlot
            label={fossilSlot.label}
            name={fossilSlot.name}
            type={fossilSlot.type}
            empty={fossilSlot.empty}
            item={fossilSlot.item}
          />
          <div className="character-model">
            <div className="character-avatar">🧙</div>
          </div>
          <InventorySlot
            label={weaponSlot.label}
            name={weaponSlot.name}
            type={weaponSlot.type}
            empty={weaponSlot.empty}
            item={weaponSlot.item}
          />
        </div>

        {/* Right side slots */}
        <div className="equipment-column equipment-right">
          {rightSlots.map((slot, i) => (
            <InventorySlot
              key={`right-${i}`}
              label={slot.label}
              name={slot.name}
              type={slot.type}
              empty={slot.empty}
              item={slot.item}
            />
          ))}
        </div>
      </div>

      {/* Bottom offhand slots */}
      <div className="equipment-section">
        <div className="section-title">Offhand Equipment</div>
        <div className="offhand-grid">
          {offhandSlots.map((slot, i) => (
            <InventorySlot
              key={`offhand-${i}`}
              label={slot.label}
              name={slot.name}
              type={slot.type}
              empty={slot.empty}
              item={slot.item}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
