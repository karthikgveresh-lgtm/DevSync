import React, { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { PhoneOff, Mic, MicOff, Video, VideoOff, Maximize2, Minimize2 } from 'lucide-react';

/**
 * VideoCallModal — Floating draggable video/audio call window.
 * Streams are passed as MediaStream objects (from React state in useWebRTC).
 */
export const VideoCallModal = ({
  callState,
  remoteEmail,
  isMuted, isCamOff, withVideo,
  localStream, remoteStream,
  onHangUp, onToggleMute, onToggleCamera,
}) => {
  const isActive = callState === 'in-call' || callState === 'calling';
  const [expanded, setExpanded] = useState(false);

  // Draggable
  const [pos, setPos] = useState({ x: window.innerWidth - 380, y: 80 });
  const dragRef = useRef({ active: false, ox: 0, oy: 0 });

  const onMouseDown = (e) => {
    dragRef.current = { active: true, ox: e.clientX - pos.x, oy: e.clientY - pos.y };
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
  };
  const onMouseMove = (e) => {
    if (!dragRef.current.active) return;
    setPos({ x: e.clientX - dragRef.current.ox, y: e.clientY - dragRef.current.oy });
  };
  const onMouseUp = () => {
    dragRef.current.active = false;
    window.removeEventListener('mousemove', onMouseMove);
    window.removeEventListener('mouseup', onMouseUp);
  };

  // Video element refs
  const localVidRef  = useRef(null);
  const remoteVidRef = useRef(null);

  // ── Attach LOCAL stream whenever it changes ───────────────────────────────
  useEffect(() => {
    if (localVidRef.current && localStream) {
      localVidRef.current.srcObject = localStream;
    }
  }, [localStream]);

  // ── Attach REMOTE stream whenever it changes ──────────────────────────────
  useEffect(() => {
    if (remoteVidRef.current && remoteStream) {
      remoteVidRef.current.srcObject = remoteStream;
    }
  }, [remoteStream]);

  // ── Audio-only: attach remote stream to hidden <audio> ───────────────────
  useEffect(() => {
    if (!withVideo && remoteStream) {
      let audio = document.getElementById('devsync-audio-el');
      if (!audio) {
        audio = document.createElement('audio');
        audio.id = 'devsync-audio-el';
        audio.autoplay = true;
        document.body.appendChild(audio);
      }
      audio.srcObject = remoteStream;
    }
  }, [remoteStream, withVideo]);

  if (!isActive) return null;

  const w = expanded ? 640 : 360;
  const h = expanded ? 440 : 240;

  return (
    <AnimatePresence>
      <motion.div
        key="video-modal"
        initial={{ opacity: 0, scale: 0.85 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.85 }}
        transition={{ type: 'spring', stiffness: 280, damping: 26 }}
        style={{
          position: 'fixed', left: pos.x, top: pos.y, width: w,
          zIndex: 9100, borderRadius: 16, overflow: 'hidden',
          background: '#0d0d0d', border: '1px solid #238636',
          boxShadow: '0 16px 60px rgba(0,0,0,0.8)',
          userSelect: 'none',
        }}
      >
        {/* ── Title bar (drag handle) ── */}
        <div
          onMouseDown={onMouseDown}
          style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '8px 12px',
            background: 'linear-gradient(90deg, #0d2b14, #0a2010)',
            cursor: 'grab',
            borderBottom: '1px solid #1a3a1a',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <motion.div
              animate={{ opacity: [1, 0.3, 1] }}
              transition={{ repeat: Infinity, duration: 1.2 }}
              style={{
                width: 8, height: 8, borderRadius: '50%',
                background: callState === 'in-call' ? '#4caf50' : '#ff9800',
              }}
            />
            <span style={{ fontSize: 12, fontWeight: 700, color: '#4caf50' }}>
              {callState === 'calling' ? '📡 Calling…' : `📞 ${remoteEmail}`}
            </span>
            {withVideo && (
              <span style={{
                fontSize: 10, color: '#888', background: '#1a3a1a',
                padding: '1px 6px', borderRadius: 4, border: '1px solid #2a4a2a',
              }}>VIDEO</span>
            )}
          </div>
          <button
            onClick={() => setExpanded(e => !e)}
            style={{ background: 'none', border: 'none', color: '#555', cursor: 'pointer', padding: 2 }}
          >
            {expanded ? <Minimize2 size={14} /> : <Maximize2 size={14} />}
          </button>
        </div>

        {/* ── Video / Audio area ── */}
        <div style={{ position: 'relative', height: h, background: '#0a0a0a' }}>

          {withVideo ? (
            /* Remote video fills the window */
            <video
              ref={remoteVidRef}
              autoPlay playsInline
              style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
            />
          ) : (
            /* Audio-only placeholder */
            <div style={{
              width: '100%', height: '100%',
              display: 'flex', flexDirection: 'column',
              alignItems: 'center', justifyContent: 'center', gap: 12,
            }}>
              <motion.div
                animate={{ scale: [1, 1.15, 1] }}
                transition={{ repeat: Infinity, duration: 1.6 }}
                style={{
                  width: 64, height: 64, borderRadius: '50%',
                  background: 'linear-gradient(135deg, #238636, #2ea043)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 28, boxShadow: '0 0 30px #23863660',
                }}
              >
                🎙️
              </motion.div>
              <span style={{ color: '#4caf50', fontSize: 13, fontWeight: 700 }}>
                {callState === 'calling' ? 'Ringing…' : remoteEmail}
              </span>
              <span style={{ color: '#555', fontSize: 11 }}>Voice call</span>
            </div>
          )}

          {/* Local camera PiP */}
          {withVideo && (
            <div style={{
              position: 'absolute', bottom: 10, right: 10,
              width: expanded ? 140 : 90, height: expanded ? 96 : 64,
              borderRadius: 10, overflow: 'hidden',
              border: '2px solid #238636',
              background: '#000',
              boxShadow: '0 4px 16px rgba(0,0,0,0.6)',
            }}>
              {isCamOff ? (
                <div style={{
                  width: '100%', height: '100%', background: '#1a1a1a',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#555',
                }}>
                  <VideoOff size={20} />
                </div>
              ) : (
                <video
                  ref={localVidRef}
                  autoPlay playsInline
                  muted  /* always muted locally to prevent echo */
                  style={{ width: '100%', height: '100%', objectFit: 'cover', transform: 'scaleX(-1)' }}
                />
              )}
            </div>
          )}
        </div>

        {/* ── Controls ── */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
          padding: '10px 14px', background: '#0a0a0a', borderTop: '1px solid #1a1a1a',
        }}>
          {/* Mute */}
          <motion.button whileHover={{ scale: 1.12 }} whileTap={{ scale: 0.9 }}
            onClick={onToggleMute}
            title={isMuted ? 'Unmute mic' : 'Mute mic'}
            style={{
              width: 40, height: 40, borderRadius: '50%',
              background: isMuted ? '#3a1a1a' : '#1e3a1e',
              border: `1px solid ${isMuted ? '#e51400' : '#238636'}`,
              color: isMuted ? '#e51400' : '#4caf50',
              cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
            {isMuted ? <MicOff size={16} /> : <Mic size={16} />}
          </motion.button>

          {/* Camera toggle — video calls only */}
          {withVideo && (
            <motion.button whileHover={{ scale: 1.12 }} whileTap={{ scale: 0.9 }}
              onClick={onToggleCamera}
              title={isCamOff ? 'Turn camera on' : 'Turn camera off'}
              style={{
                width: 40, height: 40, borderRadius: '50%',
                background: isCamOff ? '#3a1a1a' : '#1e3a1e',
                border: `1px solid ${isCamOff ? '#e51400' : '#238636'}`,
                color: isCamOff ? '#e51400' : '#4caf50',
                cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
              {isCamOff ? <VideoOff size={16} /> : <Video size={16} />}
            </motion.button>
          )}

          {/* Hang up */}
          <motion.button whileHover={{ scale: 1.12 }} whileTap={{ scale: 0.9 }}
            onClick={onHangUp}
            title="Hang up"
            style={{
              width: 46, height: 46, borderRadius: '50%',
              background: '#c50000', border: '1px solid #e51400',
              color: 'white', cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 0 20px #e5140060',
            }}>
            <PhoneOff size={20} />
          </motion.button>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};
