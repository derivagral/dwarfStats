import React from 'react';
import { InventorySlot } from './InventorySlot';

export function CharacterPanel({ characterData }) {
  if (!characterData) return null;

  const baseName = characterData.filename.replace(/\.sav$/i, '');

  // Left side equipment slots
  const leftSlots = [
    { label: 'Head', name: 'Empty', type: '', empty: true },
    { label: 'Chest', name: 'Empty', type: '', empty: true },
    { label: 'Hands', name: 'Empty', type: '', empty: true },
    { label: 'Pants', name: 'Empty', type: '', empty: true },
    { label: 'Boots', name: 'Empty', type: '', empty: true },
  ];

  // Right side equipment slots
  const rightSlots = [
    { label: 'Neck', name: 'Empty', type: '', empty: true },
    { label: 'Bracer', name: 'Empty', type: '', empty: true },
    { label: 'Ring', name: 'Empty', type: '', empty: true },
    { label: 'Ring', name: 'Empty', type: '', empty: true },
    { label: 'Relic', name: 'Empty', type: '', empty: true },
  ];

  // Center weapon slot
  const weaponSlot = { label: 'Weapon', name: 'Empty', type: '', empty: true };

  // Bottom offhand slots (4 slots with fixed stats)
  const offhandSlots = [
    { label: 'Offhand 1', name: 'Empty', type: '', empty: true },
    { label: 'Offhand 2', name: 'Empty', type: '', empty: true },
    { label: 'Offhand 3', name: 'Empty', type: '', empty: true },
    { label: 'Offhand 4', name: 'Empty', type: '', empty: true },
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
            />
          ))}
        </div>

        {/* Center character and weapon */}
        <div className="equipment-column equipment-center">
          <div className="character-model">
            <div className="character-avatar">🧙</div>
          </div>
          <InventorySlot
            label={weaponSlot.label}
            name={weaponSlot.name}
            type={weaponSlot.type}
            empty={weaponSlot.empty}
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
            />
          ))}
        </div>
      </div>
    </div>
  );
}
