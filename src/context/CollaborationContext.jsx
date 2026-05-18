import React, { createContext, useContext, useEffect, useState, useMemo } from 'react';
import * as Y from 'yjs';
import { WebsocketProvider } from 'y-websocket';
import randomColor from 'randomcolor';

const CollaborationContext = createContext();

export const CollaborationProvider = ({ children, roomId, email }) => {
  const [provider, setProvider] = useState(null);
  const [awareness, setAwareness] = useState(null);
  const [connected, setConnected] = useState(false);

  // Initialize Y.Doc once per room using useState to avoid Strict Mode issues
  const [ydoc] = useState(() => new Y.Doc());
  
  // The shared file system tree. Keys are file IDs, values are file objects.
  const sharedFiles = useMemo(() => ydoc.getMap('files'), [ydoc]);

  // Generate deterministic HEX color based on email string
  const getColorForEmail = (emailStr) => {
    return randomColor({
      seed: emailStr,
      luminosity: 'light',
      format: 'hex'
    });
  };

  useEffect(() => {
    if (!roomId || !email) return;

    // Use environment variable if provided (for production), otherwise fallback to Vite proxy
    const wsProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = import.meta.env.VITE_YJS_SERVER_URL || `${wsProtocol}//${window.location.host}/yjs`;
    
    const wsProvider = new WebsocketProvider(
      wsUrl, 
      roomId,
      ydoc
    );

    setProvider(wsProvider);

    wsProvider.on('status', event => {
      setConnected(event.status === 'connected');
    });

    // Setup Awareness (cursor tracking, user color, name)
    const awarenessState = wsProvider.awareness;
    const userColor = getColorForEmail(email);
    
    awarenessState.setLocalStateField('user', {
      name: email,
      color: userColor,
      role: 'viewer' // Default to viewer
    });
    
    setAwareness(awarenessState);

    return () => {
      wsProvider.disconnect();
      wsProvider.destroy();
      // Note: We DO NOT destroy ydoc here because React Strict Mode 
      // will destroy it immediately on the first dummy unmount!
    };
  }, [roomId, email, ydoc]);

  return (
    <CollaborationContext.Provider value={{
      ydoc,
      provider,
      awareness,
      connected,
      sharedFiles,
      username: email // Export email as 'username' to avoid breaking consumer components
    }}>
      {awareness ? children : (
        <div style={{ height: '100vh', width: '100vw', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#1e1e1e', color: '#cccccc' }}>
          Connecting to live session...
        </div>
      )}
    </CollaborationContext.Provider>
  );
};

export const useCollaboration = () => {
  const context = useContext(CollaborationContext);
  if (!context) {
    throw new Error('useCollaboration must be used within a CollaborationProvider');
  }
  return context;
};
