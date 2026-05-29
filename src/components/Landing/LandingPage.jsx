import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Code2, Users, Plus, LogIn, Copy, Check, ArrowRight, Folder, X, Zap, Briefcase } from 'lucide-react';

const generateRoomId = () => {
  const adjectives = ['swift', 'bright', 'clever', 'brave', 'happy', 'keen', 'bold', 'calm'];
  const nouns = ['falcon', 'tiger', 'rocket', 'pixel', 'forge', 'spark', 'orbit', 'nexus'];
  const adj = adjectives[Math.floor(Math.random() * adjectives.length)];
  const noun = nouns[Math.floor(Math.random() * nouns.length)];
  const num = Math.floor(Math.random() * 9000) + 1000;
  return `${adj}-${noun}-${num}`;
};

const DEFAULT_WORKSPACES = [
  { name: 'My Python Project', icon: '🐍', files: ['main.py', 'utils.py', 'requirements.txt'] },
  { name: 'Web App', icon: '🌐', files: ['index.html', 'style.css', 'app.js'] },
  { name: 'ML Notebook', icon: '🤖', files: ['notebook.ipynb', 'dataset.csv', 'model.py'] },
  { name: 'Hackathon Project', icon: '⚡', files: ['src/', 'README.md', 'package.json'] },
  { name: 'Data Analysis', icon: '📊', files: ['analysis.py', 'visualize.py', 'data.csv'] },
  { name: 'API Backend', icon: '🔧', files: ['server.js', 'routes/', 'models/'] },
];

// Strict email validator — must have a real TLD (e.g., .com, .org, .in)
// Strict email validator — only @gmail.com is accepted
const isValidEmail = (val) => /^[a-zA-Z0-9._%+\-]+@gmail\.com$/.test(val.trim());

export const LandingPage = ({ onEnter }) => {
  const [step, setStep] = useState('home'); // home | create-name | create-workspace | create-link | join
  const [email, setEmail] = useState('');
  const [emailError, setEmailError] = useState('');
  const [workspaceName, setWorkspaceName] = useState('');
  const [selectedWorkspace, setSelectedWorkspace] = useState(null);
  const [roomId, setRoomId] = useState('');
  const [joinLink, setJoinLink] = useState('');
  const [copied, setCopied] = useState(false);
  const [joinInput, setJoinInput] = useState('');
  const [joinEmail, setJoinEmail] = useState('');

  const videoRef = useRef(null);

  // Background Video custom JS-controlled fade loop
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    let animationFrameId;
    let timeoutId;

    const updateOpacity = () => {
      if (!video) return;
      const currentTime = video.currentTime;
      const duration = video.duration;

      if (duration && !isNaN(duration) && duration > 0) {
        const fadeInDuration = 0.5; // 0.5s fade-in
        const fadeOutDuration = 0.5; // 0.5s fade-out
        let opacity = 1;

        if (currentTime < fadeInDuration) {
          opacity = currentTime / fadeInDuration;
        } else if (currentTime > duration - fadeOutDuration) {
          opacity = (duration - currentTime) / fadeOutDuration;
        } else {
          opacity = 1;
        }

        opacity = Math.max(0, Math.min(1, opacity));
        video.style.opacity = opacity.toString();
      } else {
        video.style.opacity = '0';
      }

      animationFrameId = requestAnimationFrame(updateOpacity);
    };

    const handlePlay = () => {
      animationFrameId = requestAnimationFrame(updateOpacity);
    };

    const handlePause = () => {
      cancelAnimationFrame(animationFrameId);
    };

    const handleEnded = () => {
      cancelAnimationFrame(animationFrameId);
      if (video) {
        video.style.opacity = '0';
      }
      
      // On ended, opacity resets to 0, waits 100ms, then replays from 0
      timeoutId = setTimeout(() => {
        if (!video) return;
        video.currentTime = 0;
        video.play().catch(err => console.log('Video play error on ended loop:', err));
      }, 100);
    };

    video.addEventListener('play', handlePlay);
    video.addEventListener('pause', handlePause);
    video.addEventListener('ended', handleEnded);

    // Initial play trigger
    video.play().catch(err => console.log('Video play block:', err));

    return () => {
      cancelAnimationFrame(animationFrameId);
      clearTimeout(timeoutId);
      if (video) {
        video.removeEventListener('play', handlePlay);
        video.removeEventListener('pause', handlePause);
        video.removeEventListener('ended', handleEnded);
      }
    };
  }, []);

  // Check if joining from a shared link (e.g. ?room=xxx&interview=1)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const roomParam = params.get('room');
    const interviewParam = params.get('interview');
    if (roomParam) {
      setJoinInput(roomParam);
      if (interviewParam === '1') setIsInterviewMode(true);
      setStep('join');
    } else {
      // Clean URL — remove any leftover ?room or ?interview params
      const cleanUrl = window.location.origin + window.location.pathname;
      window.history.replaceState({}, '', cleanUrl);
      setIsInterviewMode(false);
    }
  }, []);

  const handleCreateWorkspace = () => {
    if (!isValidEmail(email)) {
      setEmailError('Only Gmail addresses are allowed (e.g. yourname@gmail.com)');
      return;
    }
    setEmailError('');
    // Only set interview mode if user explicitly clicked the interview button
    // (isInterviewMode is toggled externally before this is called in that path)
    setStep('create-workspace');
  };

  const handleGoHome = () => {
    setIsInterviewMode(false);
    setStep('home');
  };

  const handleSelectWorkspace = (ws) => {
    const newRoomId = generateRoomId();
    setSelectedWorkspace(ws);
    setRoomId(newRoomId);
    const baseLink = `${window.location.origin}${window.location.pathname}?room=${newRoomId}`;
    const link = isInterviewMode ? `${baseLink}&interview=1` : baseLink;
    setJoinLink(link);
    setStep('create-link');
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(joinLink).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const [isInterviewMode, setIsInterviewMode] = useState(false);

  const handleLaunchIDE = () => {
    // Save host status to localStorage so they can refresh the page and rejoin without being blocked
    localStorage.setItem(`host_${roomId}`, email);
    onEnter({ roomId, email, template: selectedWorkspace, isHost: true, isInterviewMode });
  };

  const handleJoinSubmit = () => {
    if (!joinEmail.trim() || !joinInput.trim() || !joinEmail.includes('@')) {
      if (!joinEmail.includes('@')) alert("Please enter a valid email address.");
      return;
    }
    // Parse room ID and interview flag from full URL or plain room code
    let parsedRoom = joinInput.trim();
    let parsedIsInterview = isInterviewMode;
    try {
      const url = new URL(joinInput.trim());
      parsedRoom = url.searchParams.get('room') || parsedRoom;
      if (url.searchParams.get('interview') === '1') parsedIsInterview = true;
    } catch (_) { }

    // Check if this user was the host previously (to prevent access blocked on refresh)
    const isReturningHost = localStorage.getItem(`host_${parsedRoom}`) === joinEmail.trim();

    onEnter({ 
      roomId: parsedRoom, 
      email: joinEmail.trim(), 
      isHost: isReturningHost, 
      isInterviewMode: parsedIsInterview 
    });
  };

  const particles = Array.from({ length: 20 }).map((_, i) => ({
    id: i,
    x: Math.random() * 100,
    y: Math.random() * 100,
    size: Math.random() * 3 + 1,
    duration: Math.random() * 10 + 8,
    delay: Math.random() * 5,
  }));

  return (
    <div style={{
      minHeight: '100vh',
      width: '100vw',
      backgroundColor: 'hsl(var(--background))',
      color: 'hsl(var(--foreground))',
      fontFamily: '"Geist Sans", sans-serif',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      overflow: 'hidden',
      position: 'relative'
    }}>
      {/* Background Video */}
      <video
        ref={videoRef}
        src="https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260328_065045_c44942da-53c6-4804-b734-f9e07fc22e08.mp4"
        crossOrigin="anonymous"
        muted
        playsInline
        style={{
          position: 'absolute',
          inset: 0,
          width: '100%',
          height: '100%',
          objectFit: 'cover',
          zIndex: 0,
          opacity: 0,
          pointerEvents: 'none'
        }}
      />

      {/* Blurred overlay shape */}
      <div
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          width: '984px',
          height: '527px',
          opacity: 0.90,
          backgroundColor: '#030712', // bg-gray-950
          filter: 'blur(82px)',
          pointerEvents: 'none',
          zIndex: 5
        }}
      />

      {/* Hero Content Wrapper */}
      <div style={{
        position: 'relative',
        zIndex: 10,
        width: '100%',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'visible'
      }}>

      <AnimatePresence mode="wait">

        {/* ─── HOME ─── */}
        {step === 'home' && (
          <motion.div key="home"
            initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -30 }}
            transition={{ duration: 0.5 }}
            style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12, maxWidth: 480, width: '90%', textAlign: 'center' }}
          >
            {/* Logo */}
            <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.2, type: 'spring', stiffness: 200 }} style={{ marginBottom: -48 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <img src="/logo.png" alt="TeamKode Logo" style={{ height: 280, objectFit: 'contain' }} />
              </div>
            </motion.div>

            {/* Headline */}
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }}>
              <div style={{ fontSize: 20, color: 'hsl(var(--hero-sub))', lineHeight: 1.6, fontFamily: '"General Sans", sans-serif' }}>
                Code together, in real-time. <br />
                <span style={{ color: '#007acc', fontWeight: 600 }}>Multi-cursor. Live Preview. Zero lag.</span>
              </div>
            </motion.div>

            {/* Email first */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }} style={{ width: '100%' }}>
              <input
                type="email"
                value={email}
                onChange={e => {
                  setEmail(e.target.value);
                  if (emailError) setEmailError('');
                }}
                onKeyDown={e => e.key === 'Enter' && handleCreateWorkspace()}
                placeholder="Enter your email to get started..."
                style={{
                  width: '100%', padding: '14px 20px',
                  background: 'rgba(255,255,255,0.06)',
                  border: `1px solid ${emailError ? '#ef4444' : 'rgba(255,255,255,0.12)'}`,
                  borderRadius: 12, color: 'white', fontSize: 16, outline: 'none', boxSizing: 'border-box',
                  transition: 'border-color 0.2s',
                }}
                onFocus={e => e.target.style.borderColor = emailError ? '#ef4444' : '#007acc'}
                onBlur={e => e.target.style.borderColor = emailError ? '#ef4444' : 'rgba(255,255,255,0.12)'}
              />
              {emailError && (
                <div style={{ color: '#ef4444', fontSize: 12, marginTop: 6, textAlign: 'left', paddingLeft: 4 }}>
                  ⚠ {emailError}
                </div>
              )}
            </motion.div>

            {/* Action buttons */}
            <div style={{ display: 'flex', gap: 12, width: '100%', flexDirection: 'column' }}>
              <div style={{ display: 'flex', gap: 12, width: '100%' }}>
                <motion.button whileHover={{ scale: 1.03, boxShadow: '0 0 30px rgba(0,122,204,0.5)' }} whileTap={{ scale: 0.97 }}
                  onClick={() => { setIsInterviewMode(false); handleCreateWorkspace(); }} disabled={!email.trim() || !isValidEmail(email)}
                  style={{
                    flex: 1, padding: '14px 20px', background: isValidEmail(email) ? 'linear-gradient(135deg, #007acc, #0062a3)' : 'rgba(255,255,255,0.05)',
                    border: 'none', borderRadius: 14, color: isValidEmail(email) ? 'white' : '#555', fontSize: 14, fontWeight: 700,
                    cursor: isValidEmail(email) ? 'pointer' : 'not-allowed', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
                    transition: 'all 0.2s',
                  }}>
                  <Plus size={18} /> Create Workspace
                </motion.button>
                <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
                  onClick={() => setStep('join')}
                  style={{
                    flex: 1, padding: '14px 20px', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.15)',
                    borderRadius: 14, color: '#cccccc', fontSize: 14, fontWeight: 700, cursor: 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
                  }}>
                  <LogIn size={18} /> Join Workspace
                </motion.button>
              </div>
              {/* ── Interview Mode Button ── */}
              <motion.button
                whileHover={{ scale: 1.02, boxShadow: '0 0 30px rgba(124,111,255,0.5)' }}
                whileTap={{ scale: 0.97 }}
                onClick={() => {
                  if (!email.trim() || !email.includes('@')) {
                    alert('Please enter your email first.');
                    return;
                  }
                  setIsInterviewMode(true);
                  handleCreateWorkspace();
                }}
                disabled={!email.trim() || !email.includes('@')}
                style={{
                  width: '100%', padding: '13px 20px',
                  background: (email.trim() && email.includes('@'))
                    ? 'linear-gradient(135deg, #7c6fff22, #5e4dff22)'
                    : 'rgba(255,255,255,0.03)',
                  border: (email.trim() && email.includes('@'))
                    ? '1px solid #7c6fff60'
                    : '1px solid rgba(255,255,255,0.08)',
                  borderRadius: 14,
                  color: (email.trim() && email.includes('@')) ? '#a89eff' : '#444',
                  fontSize: 14, fontWeight: 700,
                  cursor: (email.trim() && email.includes('@')) ? 'pointer' : 'not-allowed',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
                  transition: 'all 0.2s',
                }}
              >
                <Briefcase size={18} />
                Conduct Interview
                <span style={{ fontSize: 11, fontWeight: 600, background: '#7c6fff40', color: '#a89eff', padding: '2px 7px', borderRadius: 99, border: '1px solid #7c6fff50' }}>
                  NEW
                </span>
              </motion.button>
            </div>

            {/* Stats */}
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.8 }}
              style={{ display: 'flex', gap: 32 }}>
              {[['CRDTs', 'Zero-conflict edits'], ['Yjs Sync', 'Real-time cursors'], ['Sandboxed', 'Code execution']].map(([title, sub]) => (
                <div key={title} style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: '#007acc' }}>{title}</div>
                  <div style={{ fontSize: 11, color: '#475569', marginTop: 2 }}>{sub}</div>
                </div>
              ))}
            </motion.div>
          </motion.div>
        )}

        {/* ─── SELECT WORKSPACE ─── */}
        {step === 'create-workspace' && (
          <motion.div key="create-workspace"
            initial={{ opacity: 0, x: 40 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -40 }}
            style={{ display: 'flex', flexDirection: 'column', gap: 24, maxWidth: 640, width: '90%' }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <button onClick={handleGoHome} style={{ background: 'none', border: 'none', color: '#555', cursor: 'pointer', padding: 4 }}><X size={20} /></button>
              <div>
                <div style={{ fontSize: 24, fontWeight: 800, color: 'white', fontFamily: '"General Sans", sans-serif' }}>Choose a Workspace</div>
                <div style={{ fontSize: 13, color: 'hsl(var(--hero-sub))', marginTop: 4 }}>Select a project folder to start your session, <span style={{ color: '#007acc' }}>{email}</span></div>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 12 }}>
              {DEFAULT_WORKSPACES.map((ws) => (
                <motion.div key={ws.name} whileHover={{ scale: 1.04, borderColor: '#007acc' }} whileTap={{ scale: 0.97 }}
                  onClick={() => handleSelectWorkspace(ws)}
                  style={{
                    background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: 14, padding: '20px 18px', cursor: 'pointer', transition: 'all 0.2s',
                  }}>
                  <div style={{ fontSize: 32, marginBottom: 10 }}>{ws.icon}</div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: 'white', marginBottom: 8 }}>{ws.name}</div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                    {ws.files.map(f => (
                      <div key={f} style={{ fontSize: 11, color: '#475569', display: 'flex', alignItems: 'center', gap: 5 }}>
                        <Folder size={10} color="#007acc" /> {f}
                      </div>
                    ))}
                  </div>
                </motion.div>
              ))}
            </div>

            {/* Custom workspace name */}
            <div style={{ display: 'flex', gap: 10 }}>
              <input
                value={workspaceName}
                onChange={e => setWorkspaceName(e.target.value)}
                placeholder="Or type a custom workspace name..."
                style={{
                  flex: 1, padding: '12px 16px', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)',
                  borderRadius: 10, color: 'white', fontSize: 14, outline: 'none',
                }}
                onFocus={e => e.target.style.borderColor = '#007acc'}
                onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.12)'}
              />
              <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
                onClick={() => workspaceName.trim() && handleSelectWorkspace({ name: workspaceName.trim(), icon: '📁', files: [] })}
                disabled={!workspaceName.trim()}
                style={{
                  padding: '12px 20px', background: workspaceName.trim() ? '#007acc' : 'rgba(255,255,255,0.05)',
                  border: 'none', borderRadius: 10, color: 'white', cursor: workspaceName.trim() ? 'pointer' : 'not-allowed', display: 'flex', alignItems: 'center', gap: 8,
                }}>
                <ArrowRight size={18} />
              </motion.button>
            </div>
          </motion.div>
        )}

        {/* ─── SHARE LINK ─── */}
        {step === 'create-link' && (
          <motion.div key="create-link"
            initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}
            style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 28, maxWidth: 520, width: '90%', textAlign: 'center' }}
          >
            <motion.div animate={{ rotate: [0, 10, -10, 0] }} transition={{ duration: 0.5, delay: 0.2 }}>
              <div style={{ fontSize: 64 }}>{selectedWorkspace?.icon}</div>
            </motion.div>

            <div>
              <div style={{ fontSize: 26, fontWeight: 800, color: 'white', fontFamily: '"General Sans", sans-serif' }}>Your workspace is ready! 🎉</div>
              <div style={{ fontSize: 14, color: 'hsl(var(--hero-sub))', marginTop: 8 }}>Share the link below with your collaborators</div>
            </div>

            {/* Room ID badge */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, background: 'rgba(0,122,204,0.1)', border: '1px solid rgba(0,122,204,0.3)', borderRadius: 10, padding: '10px 18px' }}>
              <Zap size={16} color="#007acc" />
              <span style={{ fontSize: 14, color: '#94a3b8' }}>Room ID:</span>
              <span style={{ fontSize: 14, fontWeight: 700, color: '#007acc', letterSpacing: 1 }}>{roomId}</span>
            </div>

            {/* Shareable link */}
            <div style={{ width: '100%', display: 'flex', gap: 10 }}>
              <div style={{
                flex: 1, padding: '13px 16px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: 10, color: '#94a3b8', fontSize: 13, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
              }}>
                {joinLink}
              </div>
              <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={handleCopy}
                style={{
                  padding: '13px 18px', background: copied ? '#16a34a' : '#007acc', border: 'none',
                  borderRadius: 10, color: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8, fontWeight: 600, fontSize: 14, whiteSpace: 'nowrap',
                  transition: 'background 0.3s',
                }}>
                {copied ? <><Check size={16} /> Copied!</> : <><Copy size={16} /> Copy Link</>}
              </motion.button>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 12, color: '#334155', fontSize: 12, width: '100%' }}>
              <div style={{ flex: 1, height: 1, background: 'rgba(255,255,255,0.08)' }} />
              Send this link to your teammate
              <div style={{ flex: 1, height: 1, background: 'rgba(255,255,255,0.08)' }} />
            </div>

            <motion.button whileHover={{ scale: 1.03, boxShadow: '0 0 40px rgba(0,122,204,0.5)' }} whileTap={{ scale: 0.97 }}
              onClick={handleLaunchIDE}
              style={{
                width: '100%', padding: '16px', background: 'linear-gradient(135deg, #007acc, #6366f1)',
                border: 'none', borderRadius: 14, color: 'white', fontSize: 17, fontWeight: 800,
                cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12,
              }}>
              <Zap size={22} fill="white" /> Launch IDE
            </motion.button>
          </motion.div>
        )}

        {/* ─── JOIN ─── */}
        {step === 'join' && (
          <motion.div key="join"
            initial={{ opacity: 0, x: 40 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -40 }}
            style={{ display: 'flex', flexDirection: 'column', gap: 24, maxWidth: 460, width: '90%' }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <button onClick={() => setStep('home')} style={{ background: 'none', border: 'none', color: '#555', cursor: 'pointer', padding: 4 }}><X size={20} /></button>
              <div>
                <div style={{ fontSize: 24, fontWeight: 800, color: 'white', fontFamily: '"General Sans", sans-serif' }}>Join a Workspace</div>
                <div style={{ fontSize: 13, color: 'hsl(var(--hero-sub))', marginTop: 4 }}>Paste your invite link or room code</div>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <input
                type="email"
                value={joinEmail}
                onChange={e => setJoinEmail(e.target.value)}
                placeholder="Your email address"
                style={{
                  padding: '14px 18px', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)',
                  borderRadius: 12, color: 'white', fontSize: 15, outline: 'none',
                }}
                onFocus={e => e.target.style.borderColor = '#007acc'}
                onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.12)'}
              />
              {!new URLSearchParams(window.location.search).get('room') && (
                <input
                  value={joinInput}
                  onChange={e => setJoinInput(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleJoinSubmit()}
                  placeholder="Paste invite link or room code (e.g. swift-falcon-4821)"
                  style={{
                    padding: '14px 18px', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)',
                    borderRadius: 12, color: 'white', fontSize: 15, outline: 'none',
                  }}
                  onFocus={e => e.target.style.borderColor = '#007acc'}
                  onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.12)'}
                />
              )}
            </div>

            <motion.button whileHover={{ scale: 1.03, boxShadow: '0 0 30px rgba(0,122,204,0.4)' }} whileTap={{ scale: 0.97 }}
              onClick={handleJoinSubmit} disabled={!joinInput.trim() || !joinEmail.trim() || !joinEmail.includes('@')}
              style={{
                padding: '16px', background: joinInput.trim() && joinEmail.trim() && joinEmail.includes('@') ? 'linear-gradient(135deg, #007acc, #6366f1)' : 'rgba(255,255,255,0.05)',
                border: 'none', borderRadius: 14, color: joinInput.trim() && joinEmail.trim() && joinEmail.includes('@') ? 'white' : '#555',
                fontSize: 16, fontWeight: 700, cursor: joinInput.trim() && joinEmail.trim() && joinEmail.includes('@') ? 'pointer' : 'not-allowed',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12,
              }}>
              <Users size={20} /> Join Workspace
            </motion.button>

            <div style={{ textAlign: 'center', fontSize: 12, color: '#334155' }}>
              You'll enter the live collaborative session immediately
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      </div>
    </div>
  );
};
