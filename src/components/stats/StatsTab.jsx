import { useState, useCallback } from 'react';
import { Button } from '../common';
import { useFileProcessor } from '../../hooks/useFileProcessor';
import { extractDungeonCounters } from '../../utils/dungeonParser';
import './StatsTab.css';

export default function StatsTab({ onLog, onStatusChange }) {
  const [dungeonCounters, setDungeonCounters] = useState([]);
  const [filename, setFilename] = useState('');
  const { processFile, isProcessing } = useFileProcessor();

  const handleFileSelect = useCallback(
    async (file) => {
      try {
        onStatusChange({ processing: true });
        onLog(`Processing ${file.name}...`);

        const result = await processFile(file);

        if (result.json) {
          const counters = extractDungeonCounters(result.json);
          setDungeonCounters(counters);
          setFilename(result.filename);

          if (counters.length === 0) {
            onLog('No dungeon counters found in save file');
          } else {
            onLog(`Loaded ${counters.length} dungeon counters from ${result.filename}`);
          }
        }

        onStatusChange({ processing: false });
      } catch (error) {
        onLog(`Error processing file: ${error.message}`);
        onStatusChange({ processing: false, error: error.message });
      }
    },
    [processFile, onLog, onStatusChange]
  );

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const handleDrop = useCallback(
    (e) => {
      e.preventDefault();
      e.stopPropagation();

      const file = e.dataTransfer?.files?.[0];
      if (file) {
        handleFileSelect(file);
      }
    },
    [handleFileSelect]
  );

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
  };

  return (
    <div className="stats-tab">
      <div className="stats-header">
        <h2>Dungeon Statistics</h2>
        <p className="stats-description">
          View your dungeon completion counts from your save file
        </p>
      </div>

      <div className="stats-upload-section">
        <input
          type="file"
          id="stats-file-input"
          accept=".sav"
          onChange={handleFileChange}
          style={{ display: 'none' }}
          disabled={isProcessing}
        />
        <label htmlFor="stats-file-input">
          <Button
            variant="primary"
            size="medium"
            disabled={isProcessing}
            onClick={() => document.getElementById('stats-file-input').click()}
          >
            {isProcessing ? 'Processing...' : 'Load Save File'}
          </Button>
        </label>

        <div
          className="stats-dropzone"
          onDrop={handleDrop}
          onDragOver={handleDragOver}
        >
          <p>Or drag and drop your .sav file here</p>
        </div>
      </div>

      {filename && (
        <div className="stats-filename">
          <span className="filename-label">Loaded:</span>
          <span className="filename-value">{filename}</span>
        </div>
      )}

      {dungeonCounters.length > 0 && (
        <div className="dungeon-counters">
          <h3>Dungeon Completions</h3>
          <div className="counters-grid">
            {dungeonCounters.map((dungeon) => (
              <div key={dungeon.name} className="counter-card">
                <div className="counter-name">{dungeon.displayName}</div>
                <div className="counter-value">{dungeon.count}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {!isProcessing && dungeonCounters.length === 0 && filename && (
        <div className="stats-empty">
          <p>No dungeon statistics found in this save file.</p>
        </div>
      )}
    </div>
  );
}
