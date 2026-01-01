import React, { useState, useCallback, useMemo } from 'react';
import { InventorySlot } from './InventorySlot';
import { StatsPanel } from './StatsPanel';
import { ItemEditor } from './ItemEditor';
import { mapItemsToSlots } from '../../utils/equipmentParser';
import { useItemOverrides } from '../../hooks/useItemOverrides';

export function CharacterPanel({ characterData }) {
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [selectedItem, setSelectedItem] = useState(null);

  const {
    overrides,
    hasSlotOverrides,
    getSlotOverrides,
    applyOverridesToItem,
    updateMod,
    addMod,
    removeMod,
    removeBaseStat,
    restoreBaseStat,
    clearSlot,
  } = useItemOverrides();

  if (!characterData) return null;

  const baseName = characterData.filename.replace(/\.sav$/i, '');

  // Map equipped items to their slots
  const equippedItems = characterData.equippedItems || [];
  const slotMap = mapItemsToSlots(equippedItems);

  // Handle item selection
  const handleSelectItem = useCallback((slotKey, item) => {
    if (selectedSlot === slotKey) {
      // Clicking selected item deselects it
      setSelectedSlot(null);
      setSelectedItem(null);
    } else {
      setSelectedSlot(slotKey);
      setSelectedItem(item);
    }
  }, [selectedSlot]);

  // Handle closing editor
  const handleCloseEditor = useCallback(() => {
    setSelectedSlot(null);
    setSelectedItem(null);
  }, []);

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
      slotKey,
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

  // Build modified items for stats calculation
  const modifiedItems = useMemo(() => {
    return equippedItems.map(item => {
      const slotKey = item.slot;
      if (!slotKey || !hasSlotOverrides(slotKey)) return item;

      const modifiedAttributes = applyOverridesToItem(slotKey, item.attributes);
      return { ...item, attributes: modifiedAttributes };
    });
  }, [equippedItems, overrides, hasSlotOverrides, applyOverridesToItem]);

  // Modified character data for stats panel
  const modifiedCharacterData = useMemo(() => ({
    ...characterData,
    equippedItems: modifiedItems,
  }), [characterData, modifiedItems]);

  // Render slot helper
  const renderSlot = (slot) => (
    <InventorySlot
      key={slot.slotKey}
      slotKey={slot.slotKey}
      label={slot.label}
      name={slot.name}
      type={slot.type}
      empty={slot.empty}
      item={slot.item}
      isSelected={selectedSlot === slot.slotKey}
      hasOverrides={hasSlotOverrides(slot.slotKey)}
      onSelect={handleSelectItem}
    />
  );

  return (
    <div className="character-panel">
      <div className="character-header">
        <span className="character-name">{baseName}</span>
        <span className="character-class">Unknown Class</span>
      </div>

      <div className="character-content">
        {/* Equipment Section */}
        <div className="equipment-section-wrapper">
          <div className="equipment-layout">
            {/* Left side slots */}
            <div className="equipment-column equipment-left">
              {leftSlots.map(renderSlot)}
            </div>

            {/* Center character, fossil, and weapon */}
            <div className="equipment-column equipment-center">
              {renderSlot(fossilSlot)}
              <div className="character-model">
                <div className="character-avatar">🧙</div>
              </div>
              {renderSlot(weaponSlot)}
            </div>

            {/* Right side slots */}
            <div className="equipment-column equipment-right">
              {rightSlots.map(renderSlot)}
            </div>
          </div>

          {/* Bottom dragon and offhand slots */}
          <div className="equipment-section">
            <div className="section-title">Offhand Equipment</div>
            <div className="offhand-grid">
              {renderSlot(dragonSlot)}
              {offhandSlots.map(renderSlot)}
            </div>
          </div>

          {/* Item Editor Panel */}
          {selectedSlot && selectedItem && (
            <ItemEditor
              item={selectedItem}
              slotKey={selectedSlot}
              slotOverrides={getSlotOverrides(selectedSlot)}
              onUpdateMod={(modIndex, updates) => updateMod(selectedSlot, modIndex, updates)}
              onAddMod={(mod) => addMod(selectedSlot, mod)}
              onRemoveMod={(modIndex) => removeMod(selectedSlot, modIndex)}
              onRemoveBaseStat={(index) => removeBaseStat(selectedSlot, index)}
              onRestoreBaseStat={(index) => restoreBaseStat(selectedSlot, index)}
              onClearSlot={() => clearSlot(selectedSlot)}
              onClose={handleCloseEditor}
            />
          )}
        </div>

        {/* Stats Section */}
        <StatsPanel characterData={modifiedCharacterData} />
      </div>
    </div>
  );
}
