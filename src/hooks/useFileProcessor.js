import { useState, useCallback } from 'react';
import { convertSavToJson } from '../utils/wasm';

export function useFileProcessor() {
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState(null);

  const processFile = useCallback(async (file) => {
    if (!/\.sav$/i.test(file.name)) {
      throw new Error('Selected file is not a .sav file');
    }

    setIsProcessing(true);
    setError(null);

    try {
      const bytes = new Uint8Array(await file.arrayBuffer());
      const json = await convertSavToJson(bytes);
      return { json, parsed: JSON.parse(json), filename: file.name };
    } catch (e) {
      setError(e.message || 'Conversion failed');
      throw e;
    } finally {
      setIsProcessing(false);
    }
  }, []);

  return { processFile, isProcessing, error };
}
