import React, { useRef, useLayoutEffect, useEffect, useState } from 'react';
import { createPortal } from 'react-dom';

export function StatTooltip({
  stat,
  visible,
  anchorRef,
  onMouseEnter,
  onMouseLeave,
}) {
  const tooltipRef = useRef(null);
  const [position, setPosition] = useState({ top: -9999, left: -9999 });
  const [isPositioned, setIsPositioned] = useState(false);

  const calculatePosition = () => {
    if (visible && anchorRef?.current && tooltipRef.current) {
      const anchorRect = anchorRef.current.getBoundingClientRect();
      const tooltipRect = tooltipRef.current.getBoundingClientRect();
      const viewportHeight = window.innerHeight;
      const viewportWidth = window.innerWidth;

      if (tooltipRect.width === 0 || tooltipRect.height === 0) {
        return false;
      }

      const tooltipHeight = tooltipRect.height;
      const tooltipWidth = tooltipRect.width;

      // Position to the right of the anchor by default
      let left = anchorRect.right + 8;
      let top = anchorRect.top;

      // If not enough space on right, position to the left
      if (left + tooltipWidth > viewportWidth - 10) {
        left = anchorRect.left - tooltipWidth - 8;
      }

      // Ensure tooltip doesn't go off screen vertically
      if (top + tooltipHeight > viewportHeight - 10) {
        top = viewportHeight - tooltipHeight - 10;
      }
      if (top < 10) {
        top = 10;
      }

      setPosition({ top, left });
      setIsPositioned(true);
      return true;
    }
    return false;
  };

  useLayoutEffect(() => {
    if (visible) {
      setIsPositioned(false);
      setPosition({ top: -9999, left: -9999 });

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
  }, [visible, stat]);

  useEffect(() => {
    if (visible && !isPositioned) {
      const timer = setTimeout(() => {
        calculatePosition();
      }, 50);
      return () => clearTimeout(timer);
    }
  }, [visible, stat, isPositioned]);

  if (!visible || !stat) return null;
  if (typeof document === 'undefined') return null;

  const hasBreakdown = stat.breakdown && stat.breakdown.length > 0;

  return createPortal(
    <div
      ref={tooltipRef}
      className="stat-tooltip"
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      style={{
        position: 'fixed',
        top: `${position.top}px`,
        left: `${position.left}px`,
        opacity: isPositioned ? 1 : 0,
        transition: 'opacity 0.1s ease-in',
      }}
    >
      <div className="stat-tooltip-header">
        <div className="stat-tooltip-name">{stat.name}</div>
        <div className="stat-tooltip-value">{stat.formattedValue}</div>
      </div>

      {stat.description && (
        <div className="stat-tooltip-description">
          {stat.description}
        </div>
      )}

      {hasBreakdown && (
        <div className="stat-tooltip-breakdown">
          <div className="stat-tooltip-section-title">Sources</div>
          {stat.breakdown.map((source, i) => (
            <div key={i} className="stat-tooltip-source">
              <span className="source-item">{source.source}</span>
              <span className="source-value">+{source.value.toFixed(1)}</span>
            </div>
          ))}
        </div>
      )}

      {!hasBreakdown && (
        <div className="stat-tooltip-empty">
          No item bonuses found
        </div>
      )}

      {/* Placeholder for future calculation details */}
      <div className="stat-tooltip-footer">
        <div className="stat-tooltip-note">
          Calculation details coming soon
        </div>
      </div>
    </div>,
    document.body
  );
}
