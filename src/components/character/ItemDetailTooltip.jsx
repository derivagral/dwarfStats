import React, { useRef, useLayoutEffect, useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { getDisplayName, formatAttributeValue } from '../../utils/attributeDisplay';
import { getMonogramById, getMonogramName } from '../../utils/monogramRegistry';
import { MONOGRAM_CALC_CONFIGS } from '../../utils/monogramConfigs';

/**
 * Get a short summary of a monogram's calculation effects
 */
function getMonogramEffectSummary(monoId) {
  const config = MONOGRAM_CALC_CONFIGS[monoId];
  const registryDescription = getMonogramById(monoId)?.description || null;
  if (!config) return registryDescription;

  // Use displayName and description from config if available
  if (config.description) {
    return config.description;
  }

  // Handle simple effects: single effect with just a derived stat
  if (config.effects && config.effects.length === 1) {
    const effect = config.effects[0];
    if (!effect.derivedStatId) return null;
    return getEffectSummary(effect.derivedStatId, effect.config);
  }

  // Handle complex effects: multiple effects or additional data
  if (config.effects && config.effects.length > 1) {
    // For now, return null for complex effects
    return null;
  }

  if (config.derivedStatId) {
    return getEffectSummary(config.derivedStatId, config.config);
  }

  return registryDescription;
}

function getEffectSummary(statId, config) {
  // Map of derivedStatIds to human-readable summaries
  const summaryMap = {
    armorFromEndurance: '+1 armor per 1 endurance',
    elementFromCritChance: `+3% ${config?.elementType || 'element'} per 1% crit>100`,
    lifeFromElement: '+2% life per 30% element',
    damageFromLife: '+1% life as flat damage',
    damageFromHealth: '+1% max Health as physical + elemental flat damage',
  };

  return summaryMap[statId] || null;
}

function ItemDetailTooltip({
  item,
  attributeOverrides = {},
  position = 'right',
  offsetX = 10,
  offsetY = 0,
  showItemStats = false,
}) {
  const tooltipRef = useRef(null);
  const [tooltipStyle, setTooltipStyle] = useState({});
  const [isVisible, setIsVisible] = useState(false);

  useLayoutEffect(() => {
    if (!tooltipRef.current || !item) return;

    const itemRect = item.getBoundingClientRect();
    const tooltipRect = tooltipRef.current.getBoundingClientRect();

    let left, top;
    if (position === 'right') {
      left = itemRect.right + offsetX;
      top = itemRect.top + itemRect.height / 2 - tooltipRect.height / 2 + offsetY;
    } else if (position === 'left') {
      left = itemRect.left - tooltipRect.width - offsetX;
      top = itemRect.top + itemRect.height / 2 - tooltipRect.height / 2 + offsetY;
    } else if (position === 'bottom') {
      left = itemRect.left + itemRect.width / 2 - tooltipRect.width / 2 + offsetX;
      top = itemRect.bottom + offsetY;
    }

    setTooltipStyle({
      position: 'fixed',
      left: `${left}px`,
      top: `${top}px`,
      zIndex: 10000,
    });
  }, [item, position, offsetX, offsetY]);

  useEffect(() => {
    if (!item) return;

    const handleMouseEnter = () => setIsVisible(true);
    const handleMouseLeave = () => setIsVisible(false);

    item.addEventListener('mouseenter', handleMouseEnter);
    item.addEventListener('mouseleave', handleMouseLeave);

    return () => {
      item.removeEventListener('mouseenter', handleMouseEnter);
      item.removeEventListener('mouseleave', handleMouseLeave);
    };
  }, [item]);

  if (!isVisible) return null;

  return createPortal(
    <div
      ref={tooltipRef}
      className="item-detail-tooltip"
      style={tooltipStyle}
    >
      <div className="tooltip-header">
        <h3>{item.textContent}</h3>
      </div>
      <div className="tooltip-content">
        {Object.entries(attributeOverrides).map(([key, value]) => {
          const displayKey = getDisplayName(key);
          const displayValue = formatAttributeValue(value, key);
          return (
            <div key={key} className="tooltip-row">
              <span className="tooltip-label">{displayKey}:</span>
              <span className="tooltip-value">{displayValue}</span>
            </div>
          );
        })}
      </div>
    </div>,
    document.body
  );
}

export default ItemDetailTooltip;
