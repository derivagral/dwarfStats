import React, { useRef, useLayoutEffect, useEffect, useState } from 'react';
import { createPortal } from 'react-dom';

const formatBreakdownTerm = ({ value, fmt }) => {
  if (value == null || Number.isNaN(value)) return '—';
  if (fmt === 'pct') return `${(value * 100).toFixed(0)}%`;
  return Math.floor(value).toLocaleString();
};

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

  const hasSources = stat.sources && stat.sources.length > 0;
  const hasBreakdown = Array.isArray(stat.breakdown) && stat.breakdown.length > 0;

  // Format value for display in sources
  // Uses isPercent flag when available; falls back to value-size heuristic
  const formatSourceValue = (value, isPercent) => {
    if (value === 0) return '0';
    const sign = value >= 0 ? '+' : '';
    // Use explicit flag if set, otherwise guess from magnitude
    const showAsPercent = isPercent !== undefined ? isPercent : (Math.abs(value) < 1 && value !== 0);
    if (showAsPercent) {
      return `${sign}${(value * 100).toFixed(1)}%`;
    }
    return `${sign}${value.toFixed(1)}`;
  };

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
        <div className="stat-tooltip-formula">
          <div className="stat-tooltip-section-title">Formula</div>
          {stat.breakdown.map((term, i) => (
            <div
              key={i}
              className={`stat-tooltip-formula-row${term.isSubtotal ? ' is-subtotal' : ''}${term.op === '=' && i === stat.breakdown.length - 1 ? ' is-total' : ''}`}
            >
              <span className="formula-op">{term.op}</span>
              <span className="formula-label">
                <span className="formula-abbr" title={term.fullName || undefined}>{term.label}</span>
                {term.fullName && <span className="formula-fullname">{term.fullName}</span>}
              </span>
              <span className="formula-value">{formatBreakdownTerm(term)}</span>
            </div>
          ))}
        </div>
      )}

      {hasSources && (
        <div className="stat-tooltip-breakdown">
          <div className="stat-tooltip-section-title">Sources</div>
          {stat.sources.map((source, i) => (
            <div key={i} className="stat-tooltip-source">
              <span className="source-item">{source.itemName}</span>
              <span className="source-value">{formatSourceValue(source.value, source.isPercent)}</span>
            </div>
          ))}
        </div>
      )}

      {!hasSources && !hasBreakdown && (
        <div className="stat-tooltip-empty">
          No item sources found
        </div>
      )}
    </div>,
    document.body
  );
}
