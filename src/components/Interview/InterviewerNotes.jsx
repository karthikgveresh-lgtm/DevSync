import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { StickyNote, Trash2, Save } from 'lucide-react';

// ─── InterviewerNotes ─────────────────────────────────────────────────────────
// Only shown to the host (interviewer). Stored in localStorage - never synced to Yjs.
export const InterviewerNotes = ({ isOpen, roomId }) => {
  const storageKey = `devsync-interview-notes-${roomId}`;
  const [notes, setNotes] = useState(() => localStorage.getItem(storageKey) || '');
  const [saved, setSaved] = useState(false);
  const saveTimeout = useRef(null);

  // Auto-save on change
  useEffect(() => {
    clearTimeout(saveTimeout.current);
    saveTimeout.current = setTimeout(() => {
      localStorage.setItem(storageKey, notes);
      setSaved(true);
      setTimeout(() => setSaved(false), 1500);
    }, 800);
    return () => clearTimeout(saveTimeout.current);
  }, [notes, storageKey]);

  const handleClear = () => {
    if (window.confirm('Clear all notes?')) {
      setNotes('');
      localStorage.removeItem(storageKey);
    }
  };

  if (!isOpen) return null;

  return (
    <motion.div
      initial={{ height: 0, opacity: 0 }}
      animate={{ height: 260, opacity: 1 }}
      exit={{ height: 0, opacity: 0 }}
      transition={{ type: 'spring', stiffness: 280, damping: 28 }}
      style={{
        flexShrink: 0,
        display: 'flex',
        flexDirection: 'column',
        background: '#1a1a10',
        borderTop: '1px solid #3a3a20',
        overflow: 'hidden',
      }}
    >
      {/* Header */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '8px 14px', flexShrink: 0,
        background: '#14140c',
        borderBottom: '1px solid #3a3a20',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <StickyNote size={14} color="#f5c842" />
          <span style={{ fontSize: 12, fontWeight: 700, color: '#f5c842', letterSpacing: 0.5 }}>
            Interviewer Notes
          </span>
          <span style={{
            fontSize: 10, color: '#555', background: '#f5c84218',
            padding: '1px 6px', borderRadius: 4, border: '1px solid #f5c84240',
          }}>PRIVATE</span>
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <AnimatePresence>
            {saved && (
              <motion.span
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                style={{ fontSize: 11, color: '#4caf50', display: 'flex', alignItems: 'center', gap: 4 }}
              >
                <Save size={11} /> Saved
              </motion.span>
            )}
          </AnimatePresence>
          <button
            onClick={handleClear}
            title="Clear notes"
            style={{
              background: 'none', border: 'none', color: '#555',
              cursor: 'pointer', padding: 4, display: 'flex', alignItems: 'center',
            }}
          >
            <Trash2 size={13} />
          </button>
        </div>
      </div>

      {/* Notes textarea */}
      <textarea
        value={notes}
        onChange={e => setNotes(e.target.value)}
        placeholder={`Your private notes...\n\n• Communication skills\n• Problem-solving approach\n• Code quality & efficiency\n• Edge case handling`}
        style={{
          flex: 1, resize: 'none', background: 'transparent',
          border: 'none', outline: 'none',
          color: '#e8e8c0', fontSize: 13, lineHeight: 1.7,
          padding: '10px 14px', fontFamily: 'inherit',
        }}
      />
    </motion.div>
  );
};
