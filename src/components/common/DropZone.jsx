import React, { useState, useCallback } from 'react';

export function DropZone({ icon, text, onFileDrop, accept = '.sav' }) {
  const [isDragOver, setIsDragOver] = useState(false);

  const handleDragEnter = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(true);
  }, []);

  const handleDragOver = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  }, []);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);

    const files = [...e.dataTransfer.files].filter(f =>
      accept.split(',').some(ext => f.name.toLowerCase().endsWith(ext.trim()))
    );

    if (files.length > 0) {
      onFileDrop(files);
    }
  }, [onFileDrop, accept]);

  return (
    <div
      className={`drop-zone${isDragOver ? ' drag-over' : ''}`}
      onDragEnter={handleDragEnter}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <div className="drop-icon">{icon}</div>
      <div className="drop-text">{text}</div>
    </div>
  );
}
