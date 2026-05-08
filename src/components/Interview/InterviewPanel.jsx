import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Clock, ChevronLeft, ChevronRight, Maximize2, Minimize2, BookOpen, AlertCircle } from 'lucide-react';
import { useCollaboration } from '../../context/CollaborationContext';
import { useAuth } from '../../context/AuthContext';

// ─── Timer helpers ────────────────────────────────────────────────────────────
const pad = (n) => String(n).padStart(2, '0');
const formatTime = (secs) => `${pad(Math.floor(secs / 3600))}:${pad(Math.floor((secs % 3600) / 60))}:${pad(secs % 60)}`;

// ─── InterviewPanel ───────────────────────────────────────────────────────────
export const InterviewPanel = ({ isOpen, onToggle }) => {
  const { ydoc } = useCollaboration();
  const { isHost } = useAuth();

  const interviewMap = ydoc.getMap('interview');

  // ── local state ──
  const [problem, setProblem] = useState(() => interviewMap.get('problem') || '');
  const [timerSecs, setTimerSecs] = useState(() => interviewMap.get('timerSecs') ?? 3600);
  const [timerRunning, setTimerRunning] = useState(() => interviewMap.get('timerRunning') ?? false);
  const [expanded, setExpanded] = useState(false);
  const [timerInput, setTimerInput] = useState(() => {
    const s = interviewMap.get('timerSecs') ?? 3600;
    return Math.floor(s / 60);
  });

  const intervalRef = useRef(null);

  // ── sync FROM Yjs ──
  const syncRef = React.useRef(null);
  useEffect(() => {
    const sync = () => {
      const p = interviewMap.get('problem');
      const s = interviewMap.get('timerSecs');
      const r = interviewMap.get('timerRunning');
      if (p !== undefined) setProblem(p);
      if (s !== undefined) setTimerSecs(s);
      if (r !== undefined) setTimerRunning(r);
    };
    syncRef.current = sync;
    interviewMap.observe(sync);
    return () => {
      if (syncRef.current) {
        interviewMap.unobserve(syncRef.current);
        syncRef.current = null;
      }
    };
  }, [interviewMap]);

  // ── countdown logic ──
  useEffect(() => {
    clearInterval(intervalRef.current);
    if (timerRunning && timerSecs > 0) {
      intervalRef.current = setInterval(() => {
        setTimerSecs(prev => {
          const next = Math.max(0, prev - 1);
          if (isHost) interviewMap.set('timerSecs', next); // host is source of truth
          return next;
        });
      }, 1000);
    }
    return () => clearInterval(intervalRef.current);
  }, [timerRunning]);

  // ── host writes problem to Yjs ──
  const handleProblemChange = (e) => {
    const val = e.target.value;
    setProblem(val);
    interviewMap.set('problem', val);
  };

  const handleStartStop = () => {
    const next = !timerRunning;
    setTimerRunning(next);
    interviewMap.set('timerRunning', next);
  };

  const handleResetTimer = () => {
    const secs = timerInput * 60;
    setTimerSecs(secs);
    setTimerRunning(false);
    interviewMap.set('timerSecs', secs);
    interviewMap.set('timerRunning', false);
  };

  // ── colour for timer urgency ──
  const timerColor =
    timerSecs <= 60 ? '#f44336' :
    timerSecs <= 300 ? '#ff9800' :
    '#4caf50';

  if (!isOpen) return null;

  return (
    <motion.div
      initial={{ width: 0, opacity: 0 }}
      animate={{ width: expanded ? 520 : 340, opacity: 1 }}
      exit={{ width: 0, opacity: 0 }}
      transition={{ type: 'spring', stiffness: 260, damping: 28 }}
      style={{
        flexShrink: 0,
        display: 'flex',
        flexDirection: 'column',
        background: '#1a1a2e',
        borderLeft: '1px solid #2d2d4a',
        overflow: 'hidden',
        position: 'relative',
      }}
    >
      {/* ── Header ── */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '10px 14px',
        background: 'linear-gradient(90deg, #12123a, #1a1a2e)',
        borderBottom: '1px solid #2d2d4a',
        flexShrink: 0,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <BookOpen size={16} color="#7c6fff" />
          <span style={{ fontSize: 13, fontWeight: 700, color: '#e0e0ff', letterSpacing: 0.5 }}>
            Interview Mode
          </span>
          {isHost && (
            <span style={{
              fontSize: 10, fontWeight: 700, background: '#7c6fff30', color: '#7c6fff',
              padding: '2px 7px', borderRadius: 999, border: '1px solid #7c6fff50',
            }}>INTERVIEWER</span>
          )}
          {!isHost && (
            <span style={{
              fontSize: 10, fontWeight: 700, background: '#ff9d4030', color: '#ff9d40',
              padding: '2px 7px', borderRadius: 999, border: '1px solid #ff9d4050',
            }}>CANDIDATE</span>
          )}
        </div>
        <div style={{ display: 'flex', gap: 6 }}>
          <button
            onClick={() => setExpanded(!expanded)}
            style={{ background: 'none', border: 'none', color: '#666', cursor: 'pointer', padding: 4 }}
            title={expanded ? 'Shrink Panel' : 'Expand Panel'}
          >
            {expanded ? <Minimize2 size={14} /> : <Maximize2 size={14} />}
          </button>
          <button
            onClick={onToggle}
            style={{ background: 'none', border: 'none', color: '#666', cursor: 'pointer', padding: 4 }}
            title="Close Panel"
          >
            <ChevronRight size={14} />
          </button>
        </div>
      </div>

      <div style={{ flex: 1, overflow: 'auto', display: 'flex', flexDirection: 'column', gap: 0 }}>

        {/* ── Timer Section ── */}
        <div style={{
          padding: '16px 14px',
          borderBottom: '1px solid #2d2d4a',
          background: '#13132a',
          flexShrink: 0,
        }}>
          <div style={{ fontSize: 10, color: '#555', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 10, fontWeight: 700 }}>
            Session Timer
          </div>

          {/* Big timer display */}
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: '#0d0d1e', borderRadius: 12, padding: '14px 0',
            border: `1px solid ${timerColor}30`,
            marginBottom: 12, position: 'relative', overflow: 'hidden',
          }}>
            <div style={{
              position: 'absolute', inset: 0,
              background: `radial-gradient(ellipse at center, ${timerColor}08, transparent 70%)`,
            }} />
            <Clock size={18} color={timerColor} style={{ marginRight: 10 }} />
            <span style={{
              fontFamily: "'Roboto Mono', monospace",
              fontSize: 30, fontWeight: 800, letterSpacing: 2,
              color: timerColor,
              textShadow: `0 0 20px ${timerColor}88`,
            }}>
              {formatTime(timerSecs)}
            </span>
          </div>

          {/* Only host can control timer */}
          {isHost && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <input
                  type="number"
                  min={1} max={180}
                  value={timerInput}
                  onChange={e => setTimerInput(Number(e.target.value))}
                  style={{
                    flex: 1, padding: '7px 10px', background: '#0d0d1e',
                    border: '1px solid #2d2d4a', borderRadius: 8, color: '#ccc',
                    fontSize: 13, outline: 'none',
                  }}
                  placeholder="Minutes"
                />
                <button
                  onClick={handleResetTimer}
                  style={{
                    padding: '7px 14px', background: '#2d2d4a', border: 'none',
                    borderRadius: 8, color: '#aaa', cursor: 'pointer', fontSize: 12, fontWeight: 600,
                  }}
                >
                  Set
                </button>
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button
                  onClick={handleStartStop}
                  style={{
                    flex: 1, padding: '8px 0',
                    background: timerRunning
                      ? 'linear-gradient(135deg, #c0392b, #e74c3c)'
                      : 'linear-gradient(135deg, #27ae60, #2ecc71)',
                    border: 'none', borderRadius: 8,
                    color: 'white', fontWeight: 700, fontSize: 13, cursor: 'pointer',
                    boxShadow: timerRunning ? '0 0 16px #e74c3c60' : '0 0 16px #2ecc7160',
                  }}
                >
                  {timerRunning ? '⏸ Pause' : '▶ Start'}
                </button>
              </div>
            </div>
          )}

          {!isHost && (
            <div style={{ textAlign: 'center', fontSize: 12, color: '#555', marginTop: 4 }}>
              Timer is controlled by the interviewer
            </div>
          )}

          {timerSecs <= 60 && timerSecs > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              style={{
                marginTop: 10, padding: '8px 12px', background: '#f4433620',
                border: '1px solid #f4433640', borderRadius: 8,
                display: 'flex', alignItems: 'center', gap: 8,
                fontSize: 12, color: '#f44336',
              }}
            >
              <AlertCircle size={14} />
              Less than a minute remaining!
            </motion.div>
          )}
          {timerSecs === 0 && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              style={{
                marginTop: 10, padding: '10px 12px', background: '#f4433630',
                border: '1px solid #f44336', borderRadius: 8,
                textAlign: 'center', fontSize: 13, fontWeight: 700, color: '#f44336',
              }}
            >
              ⏰ Time's Up!
            </motion.div>
          )}
        </div>

        {/* ── Problem Statement ── */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: '14px', minHeight: 0 }}>
          <div style={{ fontSize: 10, color: '#555', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 10, fontWeight: 700 }}>
            Problem Statement
          </div>

          {isHost ? (
            <textarea
              value={problem}
              onChange={handleProblemChange}
              placeholder={`Write the problem statement here...\n\nExample:\n─────────────────\n📌 Two Sum\n\nGiven an array of integers nums and a target integer, return the indices of the two numbers that add up to target.\n\nConstraints:\n• 2 ≤ nums.length ≤ 10⁴\n• -10⁹ ≤ nums[i] ≤ 10⁹\n\nInput: nums = [2, 7, 11, 15], target = 9\nOutput: [0, 1]`}
              style={{
                flex: 1, resize: 'none', background: '#0d0d1e',
                border: '1px solid #2d2d4a', borderRadius: 10,
                color: '#d0d0ff', fontSize: 13, lineHeight: 1.7,
                padding: '12px 14px', outline: 'none', fontFamily: 'inherit',
                minHeight: 260,
              }}
              onFocus={e => { e.target.style.borderColor = '#7c6fff'; }}
              onBlur={e => { e.target.style.borderColor = '#2d2d4a'; }}
            />
          ) : (
            <div style={{
              flex: 1, background: '#0d0d1e', border: '1px solid #2d2d4a',
              borderRadius: 10, padding: '12px 14px',
              color: '#d0d0ff', fontSize: 13, lineHeight: 1.7,
              whiteSpace: 'pre-wrap', overflowY: 'auto', minHeight: 260,
              fontFamily: 'inherit',
            }}>
              {problem || (
                <span style={{ color: '#444', fontStyle: 'italic' }}>
                  Waiting for the interviewer to post the problem...
                </span>
              )}
            </div>
          )}
        </div>

      </div>
    </motion.div>
  );
};
