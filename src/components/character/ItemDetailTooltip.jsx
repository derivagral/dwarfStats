import React, { useRef, useEffect, useState } from 'react';

export function ItemDetailTooltip({ item, visible, slotRef }) {
  const tooltipRef = useRef(null);
  const [position, setPosition] = useState({ top: 0, left: 0 });
  const [showAbove, setShowAbove] = useState(false);

  useEffect(() => {
    if (visible && slotRef?.current && tooltipRef.current) {
      const slotRect = slotRef.current.getBoundingClientRect();
      const tooltipRect = tooltipRef.current.getBoundingClientRect();
      const viewportHeight = window.innerHeight;

      // Check if there's enough space below
      const spaceBelow = viewportHeight - slotRect.bottom;
      const tooltipHeight = tooltipRect.height || 300; // estimated height

      // Position above if less than 350px space below
      const shouldShowAbove = spaceBelow < 350;
      setShowAbove(shouldShowAbove);

      let top, left;
      if (shouldShowAbove) {
        top = slotRect.top - tooltipHeight - 8;
      } else {
        top = slotRect.bottom + 8;
      }

      left = slotRect.left + (slotRect.width / 2) - (tooltipRect.width / 2);

      // Ensure tooltip doesn't go off screen horizontally
      if (left < 10) left = 10;
      if (left + tooltipRect.width > window.innerWidth - 10) {
        left = window.innerWidth - tooltipRect.width - 10;
      }

      setPosition({ top, left });
    }
  }, [visible, slotRef]);

  if (!visible || !item || !item.item) return null;

  const itemData = item.item;

  return (
    <div
      ref={tooltipRef}
      className="item-tooltip"
      style={{
        position: 'fixed',
        top: `${position.top}px`,
        left: `${position.left}px`,
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
    </div>
  );
}
