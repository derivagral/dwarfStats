import React from 'react';

export function ItemDetailTooltip({ item, visible }) {
  if (!visible || !item || !item.item) return null;

  const itemData = item.item;

  return (
    <div className="item-tooltip">
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
