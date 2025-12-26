import { useState, useCallback } from 'react';

export function useLogger() {
  const [logs, setLogs] = useState([]);

  const log = useCallback((...args) => {
    const time = new Date().toLocaleTimeString();
    const message = args.join(' ');
    setLogs(prev => [...prev, { time, message }]);
  }, []);

  const clearLogs = useCallback(() => {
    setLogs([]);
  }, []);

  return { logs, log, clearLogs };
}
