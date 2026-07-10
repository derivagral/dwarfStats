import React, { useState, useCallback } from 'react';
import { Button } from '../common';
import { CharacterPanel } from './CharacterPanel';
import { createCharacterSharePayload } from '../../models/CharacterShareModel';
import { encodeCharacterShareCompressed, buildCharacterShareUrlCompressed } from '../../utils/shareUrl';

export function CharacterTab({ saveData, itemStore, onClearSave, onLog }) {
  const [shareFeedback, setShareFeedback] = useState(null);
  const [codeFeedback, setCodeFeedback] = useState(null);

  // Build characterData from itemStore (central source of truth)
  // Falls back to saveData for backward compatibility
  const characterData = itemStore?.hasItems ? {
    filename: itemStore.metadata.filename || saveData?.filename,
    equippedItems: itemStore.equipped,
    timestamp: itemStore.metadata.loadedAt,
    stanceContext: itemStore.metadata.stanceContext,
    characterStats: itemStore.metadata.characterStats || itemStore.metadata.allocatedAttributes,
    maxHealth: itemStore.metadata.maxHealth,
    skillTree: itemStore.metadata.skillTree,
  } : saveData ? {
    filename: saveData.filename,
    equippedItems: saveData.equippedItems || [],
    timestamp: saveData.timestamp,
  } : null;

  const buildPayload = useCallback(() => createCharacterSharePayload(
    itemStore.equipped,
    characterData?.stanceContext ?? null,
    itemStore.metadata?.allocatedAttributes ?? null,
    itemStore.metadata?.maxHealth ?? 0,
    itemStore.metadata?.skillTree ?? null,
  ), [itemStore.equipped, itemStore.metadata, characterData?.stanceContext]);

  const handleShare = useCallback(async () => {
    const url = await buildCharacterShareUrlCompressed(buildPayload());
    try {
      await navigator.clipboard.writeText(url);
      setShareFeedback('Copied!');
    } catch {
      window.prompt('Copy this share link:', url);
      setShareFeedback('Ready');
    }
    if (onLog) onLog('Share link copied to clipboard');
    setTimeout(() => setShareFeedback(null), 2000);
  }, [buildPayload, onLog]);

  // Bare share code (same payload, no URL) — for platforms that mangle long
  // links. Paste into the Upload tab's import box to load.
  const handleCopyCode = useCallback(async () => {
    const code = await encodeCharacterShareCompressed(buildPayload());
    try {
      await navigator.clipboard.writeText(code);
      setCodeFeedback('Copied!');
    } catch {
      window.prompt('Copy this share code:', code);
      setCodeFeedback('Ready');
    }
    if (onLog) onLog('Share code copied to clipboard');
    setTimeout(() => setCodeFeedback(null), 2000);
  }, [buildPayload, onLog]);

  return (
    <div className="tab-content active">
      <div className="controls" style={{ padding: '0.75rem 1.25rem' }}>
        <div className="control-row" style={{ marginBottom: 0 }}>
          <div className="current-file-info">
            <span className="current-file-icon">📄</span>
            <span className="current-file-name">{characterData?.filename || saveData?.filename}</span>
          </div>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <Button icon="🔗" onClick={handleShare} hidden={!itemStore?.hasItems}>
              {shareFeedback || 'Share Build'}
            </Button>
            <Button icon="📋" onClick={handleCopyCode} hidden={!itemStore?.hasItems}>
              {codeFeedback || 'Copy Code'}
            </Button>
            <Button icon="📂" onClick={onClearSave}>
              Load Different File
            </Button>
          </div>
        </div>
      </div>

      {characterData && (
        <CharacterPanel characterData={characterData} />
      )}
    </div>
  );
}
