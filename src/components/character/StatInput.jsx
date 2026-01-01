import React, { useCallback, useState } from 'react';

/**
 * Numeric input for stat values with increment/decrement controls
 *
 * @param {Object} props
 * @param {number} props.value - Current value
 * @param {Function} props.onChange - Called with new value
 * @param {number} props.min - Minimum value (default: no limit)
 * @param {number} props.max - Maximum value (default: no limit)
 * @param {number} props.step - Increment/decrement step (default: 1)
 * @param {boolean} props.isPercent - Display as percentage
 * @param {boolean} props.disabled - Disable input
 * @param {string} props.placeholder - Placeholder text
 */
export function StatInput({
  value = 0,
  onChange,
  min,
  max,
  step = 1,
  isPercent = false,
  disabled = false,
  placeholder = '0',
}) {
  const [isFocused, setIsFocused] = useState(false);

  // Handle direct input change
  const handleChange = useCallback((e) => {
    const rawValue = e.target.value;

    // Allow empty for clearing
    if (rawValue === '' || rawValue === '-') {
      onChange?.(0);
      return;
    }

    // Parse the value
    let parsed = parseFloat(rawValue);
    if (isNaN(parsed)) return;

    // For percent display, the input shows percentages but we store decimals
    if (isPercent) {
      parsed = parsed / 100;
    }

    // Clamp to bounds
    if (min !== undefined && parsed < min) parsed = min;
    if (max !== undefined && parsed > max) parsed = max;

    onChange?.(parsed);
  }, [onChange, min, max, isPercent]);

  // Handle increment/decrement
  const handleStep = useCallback((direction) => {
    const actualStep = isPercent ? step / 100 : step;
    let newValue = (value || 0) + (direction * actualStep);

    // Clamp to bounds
    if (min !== undefined && newValue < min) newValue = min;
    if (max !== undefined && newValue > max) newValue = max;

    onChange?.(newValue);
  }, [value, onChange, step, min, max, isPercent]);

  // Display value (convert decimal to percent for display)
  const displayValue = isPercent
    ? (value * 100).toFixed(1)
    : value.toString();

  return (
    <div className={`stat-input ${disabled ? 'disabled' : ''} ${isFocused ? 'focused' : ''}`}>
      <button
        type="button"
        className="stat-input-btn decrement"
        onClick={() => handleStep(-1)}
        disabled={disabled || (min !== undefined && value <= min)}
        tabIndex={-1}
      >
        −
      </button>

      <input
        type="text"
        inputMode="decimal"
        className="stat-input-field"
        value={displayValue}
        onChange={handleChange}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        disabled={disabled}
        placeholder={placeholder}
      />

      {isPercent && <span className="stat-input-suffix">%</span>}

      <button
        type="button"
        className="stat-input-btn increment"
        onClick={() => handleStep(1)}
        disabled={disabled || (max !== undefined && value >= max)}
        tabIndex={-1}
      >
        +
      </button>
    </div>
  );
}
