import React, { useRef, useLayoutEffect, useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { getDisplayName, formatAttributeValue } from '../../utils/attributeDisplay';
import { getMonogramName, isKnownMonogram, MONOGRAM_REGISTRY } from '../../utils/monogramRegistry';
import { MONOGRAM_CALC_CONFIGS, getMonogramEffectSummary as getConfigEffectSummary } from '../../utils/monogramConfigs';

/**
 * Get a short summary of a monogram's calculation effects
 */
function getMonogramEffectSummary(monoId) {
  const config = MONOGRAM_CALC_CONFIGS[monoId];
  if (!config) return null;

  // Use displayName and description from config if available
  if (config.description) {
    return config.description;
  }

  // Handle effects array format
  if (config.effects?.length) {
    const summaries = [];
    for (const effect of config.effects) {
      const summary = getEffectSummary(effect.derivedStatId, effect.config);
      if (summary) summaries.push(summary);
    }
    return summaries.join(', ');
  }

  // Handle legacy single-stat format
  if (config.derivedStatId) {
    return getEffectSummary(config.derivedStatId, config.config);
  }

  return null;
}

function getEffectSummary(statId, config) {
  if (!statId) return null;

  const summaryMap = {
    phasingStacks: '50 stacks → +50% dmg, +25% boss',
    bloodlustStacks: '100 stacks → +500% crit dmg, +300% AS',
    darkEssenceStacks: '500 stacks → Essence',
    lifeBuffStacks: '100 stacks → +100% life',
    bloodlustLifeBonus: '0.1% life/stack per 50 attr',
    critChanceFromEssence: '+1% crit per 20 essence',
    elementFromCritChance: `+3% ${config?.elementType || 'element'} per 1% crit>100`,
    lifeFromElement: '+2% life per 30% element',
    damageFromLife: '+1% life as flat damage',
  };

  return summaryMap[statId] || null;
}

export function ItemDetailTooltip({
  item,
  visible,
  frozen = false,
  slotRef,
  onMouseEnter,
  onMouseLeave,
  onClose,
}) {
  const tooltipRef = useRef(null);
  const [position, setPosition] = useState({ top: -9999, left: -9999 });
  const [isPositioned, setIsPositioned] = useState(false);
  const [showAbove, setShowAbove] = useState(false);

  const calculatePosition = () => {
    if (visible && slotRef?.current && tooltipRef.current) {
      const slotRect = slotRef.current.getBoundingClientRect();
      const tooltipRect = tooltipRef.current.getBoundingClientRect();
      const viewportHeight = window.innerHeight;
      const viewportWidth = window.innerWidth;

      // Skip if tooltip hasn't been laid out yet
      if (tooltipRect.width === 0 || tooltipRect.height === 0) {
        return false;
      }

      // Check if there's enough space below
      const spaceBelow = viewportHeight - slotRect.bottom;
      const tooltipHeight = tooltipRect.height;
      const tooltipWidth = tooltipRect.width;

      // Position above if less than 350px space below
      const shouldShowAbove = spaceBelow < 350;
      setShowAbove(shouldShowAbove);

      let top, left;
      if (shouldShowAbove) {
        top = slotRect.top - tooltipHeight - 8;
      } else {
        top = slotRect.bottom + 8;
      }

      // Try to center tooltip on the slot
      left = slotRect.left + (slotRect.width / 2) - (tooltipWidth / 2);

      // Ensure tooltip doesn't go off screen horizontally
      const padding = 10;
      if (left < padding) {
        left = padding;
      }
      if (left + tooltipWidth > viewportWidth - padding) {
        left = viewportWidth - tooltipWidth - padding;
      }

      // If tooltip would still overflow, position it to the left of the slot
      if (left + tooltipWidth > viewportWidth - padding && slotRect.left > tooltipWidth + padding) {
        left = slotRect.left - tooltipWidth - 8;
      }

      setPosition({ top, left });
      setIsPositioned(true);
      return true;
    }
    return false;
  };

  useLayoutEffect(() => {
    if (visible) {
      // Reset positioning state when showing
      setIsPositioned(false);
      setPosition({ top: -9999, left: -9999 });

      // Use requestAnimationFrame to ensure DOM has been laid out
      const rafId = requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          calculatePosition();
        });
      });

      return () => cancelAnimationFrame(rafId);
    } else {
      setIsPositioned(false);
      setPosition({ top: -9999, left: -9999 });
    }
  }, [visible, item]);

  // Fallback: recalculate after a brief delay if initial calculation failed
  useEffect(() => {
    if (visible && !isPositioned) {
      const timer = setTimeout(() => {
        calculatePosition();
      }, 50);
      return () => clearTimeout(timer);
    }
  }, [visible, item, isPositioned]);

  if (!visible || !item || !item.item) return null;
  if (typeof document === 'undefined') return null;

  const itemData = item.item;

  return createPortal(
    <div
      ref={tooltipRef}
      className={`item-tooltip${frozen ? ' frozen' : ''}`}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      onWheel={(event) => {
        event.stopPropagation();
      }}
      style={{
        position: 'fixed',
        top: `${position.top}px`,
        left: `${position.left}px`,
        opacity: isPositioned ? 1 : 0,
        transition: 'opacity 0.1s ease-in',
      }}
    >
      <div className="tooltip-header">
        <div className="tooltip-name">{itemData.name}</div>
        <div className="tooltip-type">{itemData.itemType}</div>
        {frozen && onClose && (
          <button
            className="tooltip-close"
            onClick={(e) => {
              e.stopPropagation();
              onClose();
            }}
            title="Close (or click item again)"
          >
            ×
          </button>
        )}
      </div>

      {itemData.attributes && itemData.attributes.length > 0 && (
        <div className="tooltip-attributes">
          <div className="tooltip-section-title">Attributes</div>
          {itemData.attributes.map((attr, i) => {
            const displayName = getDisplayName(attr.name);
            const displayValue = formatAttributeValue(attr.value, attr.name);
            const hasValue = attr.value !== null && attr.value !== undefined && attr.value !== '';

            return (
              <div key={i} className="tooltip-attribute">
                <span className="attr-name">{displayName}</span>
                {hasValue && <span className="attr-value">{displayValue}</span>}
              </div>
            );
          })}
        </div>
      )}

      {itemData.monograms && itemData.monograms.length > 0 && (
        <div className="tooltip-monograms">
          <div className="tooltip-section-title monogram-title">Monograms</div>
          {itemData.monograms.map((mono, i) => {
            const monoName = getMonogramName(mono.id);
            const hasCalcEffect = !!MONOGRAM_CALC_CONFIGS[mono.id];
            const effectSummary = getMonogramEffectSummary(mono.id);

            return (
              <div key={i} className={`tooltip-monogram ${hasCalcEffect ? 'has-calc-effect' : ''}`}>
                <span className="mono-name">{monoName}</span>
                {effectSummary && <span className="mono-effect">{effectSummary}</span>}
              </div>
            );
          })}
        </div>
      )}

      {itemData.itemRow && (
        <div className="tooltip-footer">
          <div className="tooltip-item-row">{itemData.itemRow}</div>
        </div>
      )}
    </div>,
    document.body
  );
}
