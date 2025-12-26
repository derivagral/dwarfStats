import { useState, useCallback } from 'react';
import { convertSavToJson } from '../utils/wasm';
import { extractEquippedItems, logEquipmentCompressed } from '../utils/equipmentParser';

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
      const parsed = JSON.parse(json);

      // Pretty-print decoded JSON to console for dev experience
      console.group(`📦 Decoded Save File: ${file.name}`);
      console.log('Raw JSON String Length:', json.length);
      console.log('Parsed Object:', parsed);

      // Pretty-print the JSON with color formatting
      console.log('%c' + JSON.stringify(parsed, null, 2),
        'color: #4a9eff; font-family: monospace; font-size: 11px;');

      console.groupEnd();

      // Extract and log equipped items in compressed format
      const equippedItems = extractEquippedItems(parsed);
      if (equippedItems.length > 0) {
        logEquipmentCompressed(equippedItems);
      }

      return { json, parsed, filename: file.name, equippedItems };
    } catch (e) {
      setError(e.message || 'Conversion failed');
      throw e;
    } finally {
      setIsProcessing(false);
    }
  }, []);

  return { processFile, isProcessing, error };
}
