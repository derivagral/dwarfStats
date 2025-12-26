import React, { useRef, useLayoutEffect, useEffect, useState } from 'react';
import { createPortal } from 'react-dom';

export function ItemDetailTooltip({ item, visible, slotRef }) {
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
      className="item-tooltip"
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
      </div>

      {itemData.attributes && itemData.attributes.length > 0 && (
        <div className="tooltip-attributes">
          <div className="tooltip-section-title">Attributes</div>
          {itemData.attributes.map((attr, i) => {
            const shortName = attr.name.split('.').pop();
            const displayValue = typeof attr.value === 'number'
              ? attr.value.toFixed(2)
              : attr.value;

            return (
              <div key={i} className="tooltip-attribute">
                <span className="attr-name">{shortName}</span>
                <span className="attr-value">{displayValue}</span>
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
