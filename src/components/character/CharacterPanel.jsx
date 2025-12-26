import React from 'react';
import { InventorySlot } from './InventorySlot';
import { mapItemsToSlots } from '../../utils/equipmentParser';

export function CharacterPanel({ characterData }) {
  if (!characterData) return null;

  const baseName = characterData.filename.replace(/\.sav$/i, '');

  // Map equipped items to their slots
  const equippedItems = characterData.equippedItems || [];
  const slotMap = mapItemsToSlots(equippedItems);

  // Helper to determine offhand label from item
  const getOffhandLabel = (item) => {
    if (!item || !item.itemRow) return 'Offhand';

    const lowerRow = item.itemRow.toLowerCase();
    if (lowerRow.includes('belt')) return 'Belt';
    if (lowerRow.includes('goblet')) return 'Goblet';
    if (lowerRow.includes('horn')) return 'Horn';
    if (lowerRow.includes('relic')) return 'Relic';
    if (lowerRow.includes('trinket')) return 'Trinket';
    return 'Offhand';
  };

  // Helper to create slot data
  const createSlot = (label, slotKey, isDynamic = false) => {
    const item = slotMap[slotKey];
    const finalLabel = isDynamic && item ? getOffhandLabel(item) : label;
    return {
      label: finalLabel,
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

  // Bottom slots - dragon/pet and offhand items
  const dragonSlot = createSlot('Dragon', 'dragon');

  const offhandSlots = [
    createSlot('Offhand', 'offhand1', true),
    createSlot('Offhand', 'offhand2', true),
    createSlot('Offhand', 'offhand3', true),
    createSlot('Offhand', 'offhand4', true),
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

      {/* Bottom dragon and offhand slots */}
      <div className="equipment-section">
        <div className="section-title">Offhand Equipment</div>
        <div className="offhand-grid">
          <InventorySlot
            label={dragonSlot.label}
            name={dragonSlot.name}
            type={dragonSlot.type}
            empty={dragonSlot.empty}
            item={dragonSlot.item}
          />
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
