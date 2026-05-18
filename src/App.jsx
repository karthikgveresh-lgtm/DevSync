import React, { useState, useRef, useCallback, useEffect } from 'react';
import { EditorProvider, useEditor } from './context/EditorContext';
import { CollaborationProvider, useCollaboration } from './context/CollaborationContext';
import { LandingPage } from './components/Landing/LandingPage';
import { TopBar } from './components/TopBar/TopBar';
import { ActivityBar } from './components/ActivityBar/ActivityBar';
import { Sidebar } from './components/Sidebar/Sidebar';
import { EditorArea } from './components/EditorArea/EditorArea';
import { BottomPanel } from './components/BottomPanel/BottomPanel';
import { StatusBar } from './components/StatusBar/StatusBar';
import { motion, AnimatePresence } from 'framer-motion';
import { AuthProvider, useAuth } from './context/AuthContext';
import { WaitingRoom } from './components/Landing/WaitingRoom';
import { AccessRequestModal } from './components/Modals/AccessRequestModal';
import { InterviewPanel } from './components/Interview/InterviewPanel';
import { InterviewerNotes } from './components/Interview/InterviewerNotes';
import { CallNotification } from './components/Modals/CallNotification';
import { VideoCallModal } from './components/Modals/VideoCallModal';
import { useWebRTC } from './hooks/useWebRTC';
import { BookOpen, StickyNote } from 'lucide-react';

const TeamKodeApp = ({ isInterviewMode }) => {
  const {
    contextMenu, setContextMenu, isSidebarOpen,
    isBottomPanelOpen, files, emitFileSystemUpdate,
    setCreatingNode, setRenamingNodeId, setRenameValue, setActiveFileId,
    roomId, incomingCall, setIncomingCall, username, startVoiceCall
  } = useEditor();

  const [callStatus, setCallStatus] = React.useState(null); // null | 'accepted' | 'muted' | 'rejected'

  const [interviewPanelOpen, setInterviewPanelOpen] = useState(!!isInterviewMode);
  const [interviewerNotesOpen, setInterviewerNotesOpen] = useState(false);

  const { ydoc, awareness, username: email } = useCollaboration();
  const { isHost, pendingRequests, setPendingRequests } = useAuth();

  // ── Real WebRTC voice + video call ────────────────────────────────────────
  const [rtcIncomingCall, setRtcIncomingCall] = useState(null);

  const {
    callState, remoteEmail, isMuted, isCamOff, withVideo,
    localStream, remoteStream,
    startCall, startVideoCall, acceptCall, rejectCall, hangUp,
    toggleMute, toggleCamera,
  } = useWebRTC({
    ydoc,
    email,
    onIncomingCall: (data) => setRtcIncomingCall(data),
    onCallEnded: () => setRtcIncomingCall(null),
  });

  // Expose to ActivityBar via window globals
  useEffect(() => {
    window.__devSyncStartCall = startCall;
    window.__devSyncStartVideoCall = startVideoCall;
  }, [startCall, startVideoCall]);

  useEffect(() => {
    if (awareness && isHost) {
      const handleAwarenessChange = () => {
        const states = Array.from(awareness.getStates().values());
        const requests = states
          .filter(state => state.user && state.user.requesting)
          .map(state => ({ username: state.user.name, clientId: state.user.clientId || Math.random() }));
        
        const uniqueRequests = [];
        const seenEmails = new Set();
        requests.forEach(r => {
          if (!seenEmails.has(r.username)) {
            seenEmails.add(r.username);
            uniqueRequests.push(r);
          }
        });
        setPendingRequests(uniqueRequests);
      };
      
      awareness.on('change', handleAwarenessChange);
      return () => awareness.off('change', handleAwarenessChange);
    }
  }, [awareness, isHost, setPendingRequests]);

  const handleApprove = (guestEmail) => {
    const authMap = ydoc.getMap('auth');
    authMap.set(guestEmail, 'editor');
  };

  const handleReject = (guestEmail) => {
    const authMap = ydoc.getMap('auth');
    authMap.set(guestEmail, 'rejected');
  };

  const [sidebarWidth, setSidebarWidth] = useState(240);
  const [bottomHeight, setBottomHeight] = useState(220);

  const onSidebarMouseDown = useCallback((e) => {
    e.preventDefault();
    const startX = e.clientX;
    const startW = sidebarWidth;
    const onMove = (e) => {
      const newW = Math.max(140, Math.min(500, startW + (e.clientX - startX)));
      setSidebarWidth(newW);
    };
    const onUp = () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    };
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
  }, [sidebarWidth]);

  const onBottomMouseDown = useCallback((e) => {
    e.preventDefault();
    const startY = e.clientY;
    const startH = bottomHeight;
    const onMove = (e) => {
      const newH = Math.max(80, Math.min(500, startH + (startY - e.clientY)));
      setBottomHeight(newH);
    };
    const onUp = () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    };
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
  }, [bottomHeight]);

  const closeContextMenu = () => setContextMenu(prev => ({ ...prev, visible: false }));

  const handleContextMenu = (e) => {
    if (e.target.closest('.sidebar') || e.target.closest('.editor-area')) return;
    e.preventDefault();
    setContextMenu({ visible: true, x: e.clientX, y: e.clientY, nodeId: null, type: 'global' });
  };

  const handleMenuAction = (action, nodeId) => {
    closeContextMenu();
    const node = files.find(f => f.id === nodeId);
    switch (action) {
      case 'new-file':
        setCreatingNode({ active: true, type: 'file', parentId: nodeId });
        break;
      case 'new-folder':
        setCreatingNode({ active: true, type: 'folder', parentId: nodeId });
        break;
      case 'rename':
        setRenamingNodeId(nodeId);
        setRenameValue(node?.name || '');
        break;
      case 'delete':
        if (window.confirm('Delete ' + node?.name + '?')) {
          emitFileSystemUpdate(files.filter(f => f.id !== nodeId && f.parentId !== nodeId));
        }
        break;
      case 'open-side':
        setActiveFileId(nodeId);
        break;
      default:
        break;
    }
  };

  return (
    <div
      onClick={closeContextMenu}
      onContextMenu={handleContextMenu}
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100vh',
        width: '100vw',
        overflow: 'hidden',
        background: '#1e1e1e',
        color: '#cccccc',
        fontFamily: "'Segoe UI', sans-serif",
      }}
    >
      {/* ── Real WebRTC incoming call notification ── */}
      <CallNotification
        incomingCall={rtcIncomingCall}
        username={email}
        onAccept={() => {
          if (rtcIncomingCall?.offer) acceptCall(rtcIncomingCall.offer, false);
          setRtcIncomingCall(null);
        }}
        onAcceptMuted={() => {
          if (rtcIncomingCall?.offer) acceptCall(rtcIncomingCall.offer, true);
          setRtcIncomingCall(null);
        }}
        onReject={() => {
          rejectCall();
          setRtcIncomingCall(null);
        }}
      />

      {/* ── Floating Video/Voice call modal ── */}
      <VideoCallModal
        callState={callState}
        remoteEmail={remoteEmail}
        isMuted={isMuted}
        isCamOff={isCamOff}
        withVideo={withVideo}
        localStream={localStream}
        remoteStream={remoteStream}
        onHangUp={hangUp}
        onToggleMute={toggleMute}
        onToggleCamera={toggleCamera}
      />

      <AccessRequestModal requests={pendingRequests} onApprove={handleApprove} onReject={handleReject} />
      <TopBar />
      <div style={{ display: 'flex', flex: 1, overflow: 'hidden', minHeight: 0 }}>
        <ActivityBar />
        {isSidebarOpen && (
          <div style={{ width: sidebarWidth, flexShrink: 0, display: 'flex', flexDirection: 'column', overflow: 'hidden', background: '#252526' }}>
            <Sidebar />
          </div>
        )}
        {isSidebarOpen && (
          <div
            onMouseDown={onSidebarMouseDown}
            style={{ width: 4, flexShrink: 0, cursor: 'col-resize', background: '#2d2d2d' }}
          />
        )}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', minWidth: 0, position: 'relative' }}>
          <div style={{ flex: 1, display: 'flex', overflow: 'hidden', minHeight: 0 }}>
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', minWidth: 0 }}>
              <div style={{ flex: 1, overflow: 'hidden', minHeight: 0 }}>
                <EditorArea />
              </div>
              {isBottomPanelOpen && (
                <div
                  onMouseDown={onBottomMouseDown}
                  style={{ height: 4, flexShrink: 0, cursor: 'row-resize', background: '#2d2d2d' }}
                />
              )}
              {isBottomPanelOpen && (
                <div style={{ height: bottomHeight, flexShrink: 0, overflow: 'hidden' }}>
                  <BottomPanel />
                </div>
              )}
            </div>

            {/* Interview Panel */}
            <AnimatePresence>
              {interviewPanelOpen && (
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  <InterviewPanel isOpen={interviewPanelOpen} onToggle={() => setInterviewPanelOpen(false)} />
                  {isHost && (
                    <InterviewerNotes isOpen={interviewerNotesOpen} roomId={roomId} />
                  )}
                </div>
              )}
            </AnimatePresence>
          </div>

          {/* Interview mode floating toggle buttons */}
          {isInterviewMode && (
            <div style={{
              position: 'absolute', top: 10, right: interviewPanelOpen ? 350 : 12,
              display: 'flex', flexDirection: 'column', gap: 8, zIndex: 50,
              transition: 'right 0.3s',
            }}>
              <button
                onClick={() => setInterviewPanelOpen(p => !p)}
                title={interviewPanelOpen ? 'Hide Problem Panel' : 'Show Problem Panel'}
                style={{
                  width: 36, height: 36, borderRadius: 8,
                  background: interviewPanelOpen ? '#7c6fff' : '#1a1a2e',
                  border: '1px solid #7c6fff60', color: interviewPanelOpen ? 'white' : '#7c6fff',
                  cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  boxShadow: '0 4px 20px #7c6fff30',
                  transition: 'all 0.2s',
                }}
              >
                <BookOpen size={16} />
              </button>
              {isHost && (
                <button
                  onClick={() => {
                    if (!interviewPanelOpen) setInterviewPanelOpen(true);
                    setInterviewerNotesOpen(p => !p);
                  }}
                  title={interviewerNotesOpen ? 'Hide Notes' : 'Show Private Notes'}
                  style={{
                    width: 36, height: 36, borderRadius: 8,
                    background: interviewerNotesOpen ? '#f5c842' : '#1a1a10',
                    border: '1px solid #f5c84260', color: interviewerNotesOpen ? '#111' : '#f5c842',
                    cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                    boxShadow: '0 4px 20px #f5c84230',
                    transition: 'all 0.2s',
                  }}
                >
                  <StickyNote size={16} />
                </button>
              )}
            </div>
          )}
        </div>
      </div>
      <StatusBar />
      <AnimatePresence>
        {contextMenu.visible && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            style={{ position: 'fixed', top: contextMenu.y, left: contextMenu.x, zIndex: 1000 }}
            className="bg-[#252526] border border-[#454545] shadow-xl py-1 min-w-[220px] text-[13px] text-[#cccccc] rounded-md overflow-hidden"
          >
            {/* context menu items */}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

import { ExtensionProvider } from './context/ExtensionContext';

const ProtectedContent = ({ session }) => {
  const { isAuthorized, setIsAuthorized, isHost, setIsHost, userRole, setUserRole } = useAuth();
  const { ydoc, awareness } = useCollaboration();
  const [status, setStatus] = useState('pending');

  useEffect(() => {
    if (session) {
      setIsHost(session.isHost);
      const authMap = ydoc.getMap('auth');
      
      if (session.isHost) {
        authMap.set(session.email, 'admin');
        setIsAuthorized(true);
        setUserRole('admin');
      } else {
        const checkAuth = () => {
          const role = authMap.get(session.email);
          
          if (role === 'admin' && !session.isHost) {
            // Prevent hijacking host email
            setStatus('rejected');
            return;
          }

          if (role === 'editor' || role === 'admin' || role === 'viewer') {
            setIsAuthorized(true);
            setUserRole(role);
            
            // Clear requesting flag once authorized
            if (awareness) {
              const localState = awareness.getLocalState();
              if (localState && localState.user && localState.user.requesting) {
                awareness.setLocalState({
                  ...localState,
                  user: { ...localState.user, requesting: false }
                });
              }
            }
          } else if (role === 'rejected') {
            setStatus('rejected');
          }
        };

        checkAuth();
        authMap.observe(checkAuth);

        if (awareness && !isAuthorized) {
          const localState = awareness.getLocalState();
          if (localState && localState.user) {
            awareness.setLocalState({
              ...localState,
              user: {
                ...localState.user,
                requesting: true
              }
            });
          }
        }

        return () => authMap.unobserve(checkAuth);
      }
    }
  }, [session, ydoc, awareness, setIsHost, setIsAuthorized, setUserRole]);

  useEffect(() => {
    if (awareness && userRole) {
      const localState = awareness.getLocalState();
      if (localState && localState.user) {
        awareness.setLocalState({
          ...localState,
          user: {
            ...localState.user,
            role: userRole
          }
        });
      }
    }
  }, [awareness, userRole]);

  if (!isAuthorized && !isHost) {
    return <WaitingRoom email={session.email} status={status} onRetry={() => window.location.reload()} />;
  }

  return (
    <EditorProvider template={session.template}>
      <ExtensionProvider>
        <TeamKodeApp isInterviewMode={session.isInterviewMode} />
      </ExtensionProvider>
    </EditorProvider>
  );
};

const AppContent = ({ session }) => {
  return (
    <CollaborationProvider roomId={session.roomId} email={session.email}>
      <ProtectedContent session={session} />
    </CollaborationProvider>
  );
};

export default function App() {
  const [session, setSession] = useState(null);

  const handleEnter = ({ roomId, email, template, isHost, isInterviewMode }) => {
    const url = new URL(window.location.href);
    url.searchParams.set('room', roomId);
    if (isInterviewMode) url.searchParams.set('interview', '1');
    window.history.replaceState({}, '', url.toString());
    setSession({ roomId, email, template, isHost, isInterviewMode });
  };

  if (!session) {
    return <LandingPage onEnter={handleEnter} />;
  }

  return (
    <AuthProvider>
      <AppContent session={session} />
    </AuthProvider>
  );
}

