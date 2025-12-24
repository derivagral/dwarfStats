import React, { useEffect, useRef } from 'react';

export function LogPanel({ logs, visible }) {
  const logRef = useRef(null);

  useEffect(() => {
    if (logRef.current) {
      logRef.current.scrollTop = logRef.current.scrollHeight;
    }
  }, [logs]);

  if (!visible) return null;

  return (
    <pre ref={logRef} className="log-panel">
      {logs.map((entry, i) => (
        <div key={i}>[{entry.time}] {entry.message}</div>
      ))}
    </pre>
  );
}
