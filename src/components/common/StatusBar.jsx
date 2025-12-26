import React from 'react';

export function StatusBar({ status, statusType, platform }) {
  const dotClass = `status-dot${statusType === 'active' ? ' active' : ''}${statusType === 'scanning' ? ' scanning' : ''}`;

  return (
    <div className="status-bar">
      <div className="status-indicator">
        <span className={dotClass}></span>
        <span>{status}</span>
      </div>
      <div className="platform-badge">
        <span>{platform.icon}</span>
        <span>{platform.name}</span>
      </div>
    </div>
  );
}
