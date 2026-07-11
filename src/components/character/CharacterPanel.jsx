import React, { useMemo } from 'react';
import { InventorySlot } from './InventorySlot';
import { StatsPanel } from './StatsPanel';
import { mapItemsToSlots } from '../../utils/equipmentParser';
import { useItemOverrides } from '../../hooks/useItemOverrides';
import { getRaceName } from '../../utils/raceBonuses';
import { applyMonogramOverrideToItem } from '../../utils/monogramOverrides';

export function CharacterPanel({ characterData, itemOverrides }) {
  // What-if edits are made in the Items tab editor; App shares that overrides
  // instance so they reach this panel's stats. The local instance is only a
  // fallback for callers that don't pass one (always empty).
  const localOverrides = useItemOverrides();
  const {
    overrides,
    hasSlotOverrides,
    applyOverridesToItem,
  } = itemOverrides || localOverrides;

  if (!characterData) return null;

  // Prefer the character's real name (HostPlayerData.PlayerName) — save
  // filenames are character-id hashes. Shares fall back to the filename stub.
  const displayName = characterData.characterName
    || characterData.filename?.replace(/\.sav$/i, '')
    || 'Character';

  // Map equipped items to their slots
  const equippedItems = characterData.equippedItems || [];
  const slotMap = mapItemsToSlots(equippedItems);

  // Build modified slot map with overrides applied (for tooltips)
  // Items now use Item model format: baseStats instead of attributes
  const modifiedSlotMap = useMemo(() => {
    const result = {};
    for (const [slotKey, item] of Object.entries(slotMap)) {
      if (item && hasSlotOverrides(slotKey)) {
        // Convert baseStats to the format applyOverridesToItem expects
        const attrs = (item.baseStats || []).map(s => ({
          name: s.rawTag || s.stat,
          value: s.value,
        }));
        const modifiedAttrs = applyOverridesToItem(slotKey, attrs);
        // Convert back to baseStats format
        const modifiedBaseStats = modifiedAttrs.map(a => ({
          stat: a.name?.split('.').pop() || a.name,
          value: a.value,
          rawTag: a.name,
        }));
        result[slotKey] = applyMonogramOverrideToItem(
          { ...item, baseStats: modifiedBaseStats },
          overrides[slotKey]
        );
      } else {
        result[slotKey] = item;
      }
    }
    return result;
  }, [slotMap, overrides, hasSlotOverrides, applyOverridesToItem]);

  // Helper to determine offhand label from item (uses Item model: rowName)
  const getOffhandLabel = (item) => {
    if (!item || !item.rowName) return 'Offhand';

    const lowerRow = item.rowName.toLowerCase();
    if (lowerRow.includes('belt')) return 'Belt';
    if (lowerRow.includes('goblet')) return 'Goblet';
    if (lowerRow.includes('horn')) return 'Horn';
    if (lowerRow.includes('relic')) return 'Relic';
    if (lowerRow.includes('trinket')) return 'Trinket';
    return 'Offhand';
  };

  // Helper to create slot data (uses modified items for tooltip display)
  // Item model uses: displayName, type, rowName, baseStats, monograms
  const createSlot = (label, slotKey, isDynamic = false) => {
    const item = modifiedSlotMap[slotKey];
    const finalLabel = isDynamic && item ? getOffhandLabel(item) : label;
    return {
      slotKey,
      label: finalLabel,
      name: item ? item.displayName : 'Empty',
      type: item ? item.type : '',
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

  // Character data for the stats panel: raw items + the shared overrides map.
  // useDerivedStats applies removals/mods/added monograms itself, so nothing
  // is pre-baked here (baking AND passing overrides would double-count mods).
  const modifiedCharacterData = useMemo(() => ({
    ...characterData,
    itemOverrides: overrides,
  }), [characterData, overrides]);

  // Render slot helper - click now freezes tooltip instead of opening editor
  const renderSlot = (slot) => (
    <InventorySlot
      key={slot.slotKey}
      slotKey={slot.slotKey}
      label={slot.label}
      name={slot.name}
      type={slot.type}
      empty={slot.empty}
      item={slot.item}
      hasOverrides={hasSlotOverrides(slot.slotKey)}
    />
  );

  return (
    <div className="character-panel">
      <div className="character-header">
        <span className="character-name">{displayName}</span>
        {characterData.characterLevel > 0 && (
          <span className="character-class">
            Level {characterData.characterLevel}
            {getRaceName(characterData.characterRace) ? ` · ${getRaceName(characterData.characterRace)}` : ''}
          </span>
        )}
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
        </div>

        {/* Stats Section */}
        <StatsPanel characterData={modifiedCharacterData} />
      </div>
    </div>
  );
}
