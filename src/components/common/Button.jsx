import React from 'react';

export function Button({
  children,
  icon,
  onClick,
  variant = 'default',
  disabled = false,
  hidden = false,
  className = ''
}) {
  if (hidden) return null;

  const btnClass = `btn${variant === 'primary' ? ' btn-primary' : ''}${variant === 'success' ? ' btn-success' : ''} ${className}`.trim();

  return (
    <button className={btnClass} onClick={onClick} disabled={disabled}>
      {icon && <span className="btn-icon">{icon}</span>}
      {children}
    </button>
  );
}
