import { useEffect, useRef, useState, useCallback } from 'react';

/**
 * useWebRTC — Real peer-to-peer voice + video call using WebRTC.
 * Signaling via shared Yjs document (no extra server needed).
 *
 * voiceSignal map keys:
 *   'offer'        { from, sdp, type, withVideo }
 *   'answer'       { from, sdp, type }
 *   'ice-<email>'  ICE candidate array
 *   'hangup'       email of who hung up
 */
const ICE_SERVERS = [
  { urls: 'stun:stun.l.google.com:19302' },
  { urls: 'stun:stun1.l.google.com:19302' },
];

export function useWebRTC({ ydoc, email, onIncomingCall, onCallEnded }) {
  const pcRef = useRef(null);

  const [callState,   setCallState]   = useState('idle'); // idle|calling|in-call|receiving
  const [remoteEmail, setRemoteEmail] = useState(null);
  const [isMuted,     setIsMuted]     = useState(false);
  const [isCamOff,    setIsCamOff]    = useState(false);
  const [withVideo,   setWithVideo]   = useState(false);

  // ── Streams as state so VideoCallModal re-renders when they arrive ────────
  const [localStream,  setLocalStream]  = useState(null);
  const [remoteStream, setRemoteStream] = useState(null);

  const sigMap = useCallback(() => ydoc?.getMap('voiceSignal'), [ydoc]);

  // ── Cleanup ───────────────────────────────────────────────────────────────
  const cleanup = useCallback(() => {
    if (pcRef.current) { pcRef.current.close(); pcRef.current = null; }
    setLocalStream(prev => { prev?.getTracks().forEach(t => t.stop()); return null; });
    setRemoteStream(null);
    setCallState('idle');
    setRemoteEmail(null);
    setIsMuted(false);
    setIsCamOff(false);
    setWithVideo(false);
  }, []);

  // ── Build PeerConnection ──────────────────────────────────────────────────
  const createPC = useCallback((stream) => {
    const pc = new RTCPeerConnection({ iceServers: ICE_SERVERS });

    // Add tracks
    stream.getTracks().forEach(t => pc.addTrack(t, stream));

    pc.onicecandidate = ({ candidate }) => {
      if (!candidate) return;
      const key = `ice-${email}`;
      const existing = sigMap()?.get(key) || [];
      sigMap()?.set(key, [...existing, candidate.toJSON()]);
    };

    pc.ontrack = (event) => {
      setRemoteStream(event.streams[0]);
    };

    pc.onconnectionstatechange = () => {
      if (pc.connectionState === 'connected') setCallState('in-call');
      if (['disconnected', 'failed', 'closed'].includes(pc.connectionState)) cleanup();
    };

    pcRef.current = pc;
    return pc;
  }, [email, sigMap, cleanup]);

  // ── Get user media ────────────────────────────────────────────────────────
  const getMedia = async (video = false) => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video });
      setLocalStream(stream);
      return stream;
    } catch (err) {
      console.error('[WebRTC] getUserMedia error:', err);
      if (err.name === 'NotAllowedError') {
        alert('Camera / Microphone access denied.\n\nClick the 🔒 lock icon → Site Settings → Allow Camera & Microphone.');
      } else if (err.name === 'NotFoundError') {
        alert('No camera/microphone found. Please connect a device and try again.');
      }
      throw err;
    }
  };

  // ── Apply ICE buffer ──────────────────────────────────────────────────────
  const applyIce = async (pc, fromEmail) => {
    const candidates = sigMap()?.get(`ice-${fromEmail}`) || [];
    for (const c of candidates) {
      try { await pc.addIceCandidate(new RTCIceCandidate(c)); } catch (_) {}
    }
  };

  // ── START VOICE CALL ──────────────────────────────────────────────────────
  const startCall = useCallback(async () => {
    if (callState !== 'idle') return;
    try {
      const stream = await getMedia(false);
      const pc = createPC(stream);
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);
      sigMap()?.set('offer', { from: email, sdp: offer.sdp, type: offer.type, withVideo: false });
      sigMap()?.delete('answer');
      sigMap()?.delete('hangup');
      setWithVideo(false);
      setCallState('calling');
    } catch (_) { cleanup(); }
  }, [callState, email, createPC, sigMap, cleanup]);

  // ── START VIDEO CALL ──────────────────────────────────────────────────────
  const startVideoCall = useCallback(async () => {
    if (callState !== 'idle') return;
    try {
      const stream = await getMedia(true);
      const pc = createPC(stream);
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);
      sigMap()?.set('offer', { from: email, sdp: offer.sdp, type: offer.type, withVideo: true });
      sigMap()?.delete('answer');
      sigMap()?.delete('hangup');
      setWithVideo(true);
      setCallState('calling');
    } catch (_) { cleanup(); }
  }, [callState, email, createPC, sigMap, cleanup]);

  // ── ACCEPT CALL ───────────────────────────────────────────────────────────
  const acceptCall = useCallback(async (offerData, muted = false) => {
    try {
      const video = !!offerData.withVideo;
      const stream = await getMedia(video);
      if (muted) stream.getAudioTracks().forEach(t => { t.enabled = false; });

      const pc = createPC(stream);
      await pc.setRemoteDescription(new RTCSessionDescription({ type: offerData.type, sdp: offerData.sdp }));
      await applyIce(pc, offerData.from);

      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);
      sigMap()?.set('answer', { from: email, sdp: answer.sdp, type: answer.type });

      setRemoteEmail(offerData.from);
      setWithVideo(video);
      setIsMuted(muted);
      setCallState('in-call');
    } catch (_) { cleanup(); }
  }, [email, createPC, sigMap, applyIce, cleanup]);

  // ── REJECT ────────────────────────────────────────────────────────────────
  const rejectCall = useCallback(() => {
    sigMap()?.set('hangup', email);
    cleanup();
  }, [email, sigMap, cleanup]);

  // ── HANG UP ───────────────────────────────────────────────────────────────
  const hangUp = useCallback(() => {
    sigMap()?.set('hangup', email);
    // Clear signal map so stale offers don't persist
    sigMap()?.delete('offer');
    sigMap()?.delete('answer');
    cleanup();
    if (onCallEnded) onCallEnded();
  }, [email, sigMap, cleanup, onCallEnded]);

  // ── MUTE ─────────────────────────────────────────────────────────────────
  const toggleMute = useCallback(() => {
    localStream?.getAudioTracks().forEach(t => { t.enabled = isMuted; });
    setIsMuted(m => !m);
  }, [localStream, isMuted]);

  // ── CAMERA ON/OFF ─────────────────────────────────────────────────────────
  const toggleCamera = useCallback(() => {
    localStream?.getVideoTracks().forEach(t => { t.enabled = isCamOff; });
    setIsCamOff(c => !c);
  }, [localStream, isCamOff]);

  // ── Observe Yjs signals ───────────────────────────────────────────────────
  useEffect(() => {
    if (!ydoc || !email) return;
    const map = ydoc.getMap('voiceSignal');

    const process = async (keysChanged) => {
      for (const key of keysChanged) {
        const val = map.get(key);

        // Incoming offer (for callee)
        if (key === 'offer' && val && val.from !== email) {
          // Only show if we're idle
          setCallState(prev => {
            if (prev === 'idle') {
              setRemoteEmail(val.from);
              setWithVideo(!!val.withVideo);
              if (onIncomingCall) onIncomingCall({ caller: val.from, offer: val, withVideo: !!val.withVideo });
              return 'receiving';
            }
            return prev;
          });
        }

        // Incoming answer (for caller)
        if (key === 'answer' && val && val.from !== email && pcRef.current) {
          try {
            const pc = pcRef.current;
            if (pc.signalingState === 'have-local-offer') {
              await pc.setRemoteDescription(new RTCSessionDescription({ type: val.type, sdp: val.sdp }));
              await applyIce(pc, val.from);
              setRemoteEmail(val.from);
              setCallState('in-call');
            }
          } catch (err) { console.error('[WebRTC] answer err:', err); }
        }

        // Remote ICE
        if (key.startsWith('ice-') && key !== `ice-${email}` && pcRef.current) {
          const pc = pcRef.current;
          if (pc.remoteDescription) {
            for (const c of (val || [])) {
              try { await pc.addIceCandidate(new RTCIceCandidate(c)); } catch (_) {}
            }
          }
        }

        // Hangup
        if (key === 'hangup' && val && val !== email) {
          cleanup();
          if (onCallEnded) onCallEnded();
        }
      }
    };

    const handleChange = (event) => process(Array.from(event.keysChanged));
    map.observe(handleChange);

    // ── Check for an existing offer on mount (in case callee loaded late) ──
    const existingOffer = map.get('offer');
    if (existingOffer && existingOffer.from !== email) {
      process(['offer']);
    }

    return () => map.unobserve(handleChange);
  }, [ydoc, email]); // intentionally minimal deps — uses closures via setCallState updater

  return {
    callState, remoteEmail, isMuted, isCamOff, withVideo,
    localStream, remoteStream,
    startCall, startVideoCall, acceptCall, rejectCall, hangUp,
    toggleMute, toggleCamera,
  };
}
