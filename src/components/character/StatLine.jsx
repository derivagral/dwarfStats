import React, { useRef, useState, useCallback } from 'react';
import { StatTooltip } from './StatTooltip';

export function StatLine({ stat }) {
  const lineRef = useRef(null);
  const [isHovered, setIsHovered] = useState(false);
  const hoverStateRef = useRef(false);
  const closeTimeoutRef = useRef(null);

  const handleMouseEnter = useCallback(() => {
    if (closeTimeoutRef.current) {
      clearTimeout(closeTimeoutRef.current);
      closeTimeoutRef.current = null;
    }
    hoverStateRef.current = true;
    setIsHovered(true);
  }, []);

  const handleMouseLeave = useCallback(() => {
    hoverStateRef.current = false;
    closeTimeoutRef.current = setTimeout(() => {
      if (!hoverStateRef.current) {
        setIsHovered(false);
      }
    }, 150);
  }, []);

  const handleTooltipMouseEnter = useCallback(() => {
    if (closeTimeoutRef.current) {
      clearTimeout(closeTimeoutRef.current);
      closeTimeoutRef.current = null;
    }
    hoverStateRef.current = true;
  }, []);

  const handleTooltipMouseLeave = useCallback(() => {
    hoverStateRef.current = false;
    closeTimeoutRef.current = setTimeout(() => {
      if (!hoverStateRef.current) {
        setIsHovered(false);
      }
    }, 150);
  }, []);

  if (!stat) return null;

  const hasValue = stat.value !== 0;

  return (
    <>
      <div
        ref={lineRef}
        className={`stat-line ${hasValue ? 'has-value' : 'no-value'}`}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        <span className="stat-name">{stat.name}</span>
        <span className="stat-value">{stat.formattedValue}</span>
      </div>
      <StatTooltip
        stat={stat}
        visible={isHovered}
        anchorRef={lineRef}
        onMouseEnter={handleTooltipMouseEnter}
        onMouseLeave={handleTooltipMouseLeave}
      />
    </>
  );
}
