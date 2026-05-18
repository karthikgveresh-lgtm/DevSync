import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import { initSocket } from '../utils/socket';
import { executeCode } from '../utils/compiler';
import { useCollaboration } from './CollaborationContext';

const EditorContext = createContext();

export const useEditor = () => useContext(EditorContext);

export const EditorProvider = ({ children, template }) => {
  const socketRef = useRef(null);
  const [clients, setClients] = useState([]);
  const [roomId] = useState('hackathon-2026');
  
  const [activeSidebarTab, setActiveSidebarTab] = useState('explorer');
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isBottomPanelOpen, setIsBottomPanelOpen] = useState(false);
  const [bottomPanelTab, setBottomPanelTab] = useState('terminal');
  const [awarenessUsers, setAwarenessUsers] = useState([]);
  
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  
  const { sharedFiles, ydoc, awareness, username: email } = useCollaboration();
  const globalState = ydoc.getMap('globalState');
  const yMessages = ydoc.getArray('messages');
  
  // Track awareness users
  useEffect(() => {
    if (!awareness) return;
    const updateAwarenessUsers = () => {
      const users = Array.from(awareness.getStates().entries())
        .map(([clientId, state]) => ({ 
          ...state.user, 
          socketId: state.socketId, 
          clientId,
          cursor: state.cursor 
        }))
        .filter(user => user && user.name);
      setAwarenessUsers(users);
    };
    
    updateAwarenessUsers();
    awareness.on('change', updateAwarenessUsers);
    
    return () => awareness.off('change', updateAwarenessUsers);
  }, [awareness]);

  const [files, setFiles] = useState([]);
  
  // Initialize or sync files from Yjs
  useEffect(() => {
    if (!sharedFiles) return;

    const updateReactFiles = () => {
      const filesArray = Array.from(sharedFiles.values());
      
      if (filesArray.length === 0) {
        // Initialize default files if room is empty based on selected template
        let defaultFiles = [];
        const activeTemplate = template || { 
          name: 'TeamKode Workspace', 
          files: ['main.py', 'README.md'] 
        };

        if (activeTemplate.files && activeTemplate.files.length > 0) {
          defaultFiles.push({ id: 'root_folder', name: activeTemplate.name.replace(/\s+/g, '_').toLowerCase(), type: 'folder', isFolder: true, isOpen: true, parentId: null });
          
          activeTemplate.files.forEach((fileOrDir, index) => {
            const isDir = fileOrDir.endsWith('/');
            const name = isDir ? fileOrDir.slice(0, -1) : fileOrDir;
            const ext = name.split('.').pop() || 'txt';
            const typeMap = { js: 'javascript', py: 'python', cpp: 'cpp', java: 'java', html: 'html', css: 'css', md: 'markdown', csv: 'csv', json: 'json', ipynb: 'python' };
            const type = isDir ? 'folder' : (typeMap[ext] || ext);
            
            let content = '';
            if (!isDir) {
              if (ext === 'html') content = `<h1>Welcome to ${activeTemplate.name}!</h1>\n<p>Start collaborating!</p>`;
              else if (ext === 'css') content = `/* Styles for ${activeTemplate.name} */\nbody {\n  font-family: sans-serif;\n}`;
              else if (ext === 'py' || ext === 'ipynb') content = `# ${activeTemplate.name}\nprint("TeamKode Initialized!")\n`;
              else if (ext === 'js') content = `// ${activeTemplate.name}\nconsole.log("TeamKode Initialized!");\n`;
              else if (ext === 'json') content = `{\n  "name": "${activeTemplate.name.replace(/\s+/g, '-').toLowerCase()}"\n}\n`;
              else content = `# ${name}\n`;
            }

            defaultFiles.push({
              id: (index + 1).toString(),
              name: name,
              type: type,
              content: content,
              isFolder: isDir,
              isOpen: false,
              parentId: 'root_folder'
            });
          });
        }
        
        ydoc.transact(() => {
          defaultFiles.forEach(f => {
            sharedFiles.set(f.id, f);
            if (!f.isFolder && f.content) {
              const yText = ydoc.getText(`file_content_${f.id}`);
              if (yText.length === 0) {
                yText.insert(0, f.content);
              }
            }
          });
        });

        // Force local state update immediately so the user doesn't have to wait for the observer
        setFiles(defaultFiles);
        if (defaultFiles.length > 1) {
          // Open the first non-folder file automatically
          const firstFile = defaultFiles.find(f => !f.isFolder);
          if (firstFile) {
            setActiveFileId(firstFile.id);
            setOpenFileIds([firstFile.id]);
          }
        }
      } else {
        setFiles(filesArray);
      }
    };

    // Initial load
    updateReactFiles();

    const observer = (event) => {
      updateReactFiles();
    };
    
    const stateObserver = (event) => {
      if (event.keysChanged.has('activeFileId')) {
        const remoteActiveFileId = globalState.get('activeFileId');
        if (remoteActiveFileId && remoteActiveFileId !== activeFileId) {
          setActiveFileId(remoteActiveFileId);
          setOpenFileIds(prev => prev.includes(remoteActiveFileId) ? prev : [...prev, remoteActiveFileId]);
        }
      }
      if (event.keysChanged.has('bottomPanel')) {
        const remotePanel = globalState.get('bottomPanel');
        if (remotePanel) {
          setIsBottomPanelOpen(remotePanel.isOpen);
          setBottomPanelTab(remotePanel.tab);
        }
      }
    };
    
    const messagesObserver = () => {
      setMessages(yMessages.toArray());
    };
    
    sharedFiles.observe(observer);
    globalState.observe(stateObserver);
    yMessages.observe(messagesObserver);
    
    // Initial load
    messagesObserver();

    return () => {
      sharedFiles.unobserve(observer);
      globalState.unobserve(stateObserver);
      yMessages.unobserve(messagesObserver);
    };
  }, [sharedFiles, ydoc, globalState, yMessages]);
  
  const [activeFileId, setActiveFileId] = useState('1');
  const [openFileIds, setOpenFileIds] = useState(['1', '2']);
  
  const activeFile = files.find(f => f.id === activeFileId && !f.isFolder) || { id: 'dummy', name: 'No File Open', type: 'plaintext', content: '' };
  
  const [messages, setMessages] = useState([]);
  const [output, setOutput] = useState('');
  const [isRunning, setIsRunning] = useState(false);
  const [previewDoc, setPreviewDoc] = useState('');

  const [contextMenu, setContextMenu] = useState({ visible: false, x: 0, y: 0, nodeId: null, type: 'global' });
  const [creatingNode, setCreatingNode] = useState({ active: false, type: 'file', parentId: null });
  const [renamingNodeId, setRenamingNodeId] = useState(null);
  const [renameValue, setRenameValue] = useState('');
  const [incomingCall, setIncomingCall] = useState(null);

  useEffect(() => {
    const init = async () => {
      socketRef.current = await initSocket();
      socketRef.current.emit('join', { roomId, username: email });
      socketRef.current.on('joined', ({ clients }) => setClients(clients));
      socketRef.current.on('code-change', ({ files: syncedFiles }) => {
          if (syncedFiles) setFiles(syncedFiles);
      });
      socketRef.current.on('incoming-call', ({ caller, callerId }) => {
        setIncomingCall({ caller, callerId });
      });
    };
    init();

    const closeContextMenu = () => setContextMenu(prev => ({ ...prev, visible: false }));
    document.addEventListener('click', closeContextMenu);
    
    return () => {
      socketRef.current?.disconnect();
      document.removeEventListener('click', closeContextMenu);
    };
  }, [email, roomId]);

  useEffect(() => {
    if (activeFile.type === 'html') {
      const timeout = setTimeout(() => {
        const code = ydoc ? ydoc.getText(`file_content_${activeFileId}`).toString() : activeFile.content;
        setPreviewDoc(code);
      }, 300);
      return () => clearTimeout(timeout);
    }
  }, [activeFile.content, activeFile.type, activeFileId, ydoc]);

  const emitFileSystemUpdate = (newFiles) => {
    if (!sharedFiles || !ydoc) return;
    
    ydoc.transact(() => {
      // Find deleted files and remove them from Y.Map
      const newFileIds = new Set(newFiles.map(f => f.id));
      for (const id of sharedFiles.keys()) {
        if (!newFileIds.has(id)) {
          sharedFiles.delete(id);
        }
      }
      // Add or update files
      newFiles.forEach(f => {
        sharedFiles.set(f.id, f);
        if (!f.isFolder && typeof f.content === 'string') {
          const yText = ydoc.getText(`file_content_${f.id}`);
          if (yText.length === 0 && f.content.length > 0) {
            yText.insert(0, f.content);
          }
        }
      });
    });
  };

  const openFileById = (id) => {
    if (!openFileIds.includes(id)) {
      setOpenFileIds(prev => [...prev, id]);
    }
    setActiveFileId(id);
    if (globalState.get('activeFileId') !== id) {
      globalState.set('activeFileId', id);
    }
  };

  const closeFile = (id, e) => {
    if (e) e.stopPropagation();
    const newOpenFiles = openFileIds.filter(fid => fid !== id);
    setOpenFileIds(newOpenFiles);
    if (activeFileId === id) {
      setActiveFileId(newOpenFiles.length > 0 ? newOpenFiles[newOpenFiles.length - 1] : null);
    }
  };

  const handleEditorChange = (value) => {
    const newFiles = files.map(f => f.id === activeFileId ? { ...f, content: value } : f);
    emitFileSystemUpdate(newFiles);
  };

  const runCode = async () => {
    setIsBottomPanelOpen(true);
    const codeToRun = ydoc ? ydoc.getText(`file_content_${activeFileId}`).toString() : activeFile.content;

    // Resolve language from file extension for accuracy
    const extMap = { js: 'javascript', py: 'python', ts: 'typescript', java: 'java', cpp: 'cpp', c: 'c', rs: 'rust', go: 'go', html: 'html' };
    const ext = activeFile.name?.split('.').pop()?.toLowerCase();
    const lang = extMap[ext] || activeFile.type || ext;
    
    if (lang === 'html') { 
      setBottomPanelTab('preview'); 
      setPreviewDoc(codeToRun); 
      globalState.set('bottomPanel', { isOpen: true, tab: 'preview' });
      return; 
    }
    
    setBottomPanelTab('terminal'); 
    setIsRunning(true);
    setOutput('');  // clear first so the useEffect always fires on new output
    globalState.set('bottomPanel', { isOpen: true, tab: 'terminal' });
    
    const result = await executeCode(lang, codeToRun);
    setOutput(result || '(no output)'); 
    setIsRunning(false);
  };

  const openFile = async () => {
    const { openFileFromSystem } = await import('../utils/fileSystem');
    const fileData = await openFileFromSystem();
    if (fileData) {
      const newFile = {
        id: Math.random().toString(36).substr(2, 9),
        name: fileData.name,
        type: fileData.type,
        content: fileData.content,
        isFolder: false,
        parentId: null
      };
      const newFiles = [...files, newFile];
      emitFileSystemUpdate(newFiles);
      openFileById(newFile.id);
    }
  };

  const openFolder = async () => {
    const { openFolderFromSystem } = await import('../utils/fileSystem');
    const folderFiles = await openFolderFromSystem();
    if (folderFiles && folderFiles.length > 0) {
      emitFileSystemUpdate(folderFiles);
      const firstFile = folderFiles.find(f => !f.isFolder);
      if (firstFile) openFileById(firstFile.id);
    }
  };

  const handleSearch = (query) => {
    setSearchQuery(query);
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }
    
    const results = [];
    files.forEach(file => {
      if (!file.isFolder && file.content) {
        const lines = file.content.split('\n');
        lines.forEach((line, index) => {
          if (line.toLowerCase().includes(query.toLowerCase())) {
            results.push({
              fileId: file.id,
              fileName: file.name,
              line: index + 1,
              text: line.trim()
            });
          }
        });
      }
    });
    setSearchResults(results);
  };

  const sendTerminalCommand = (command) => {
    if (!command.trim()) return;
    setOutput(prev => prev + `\nPS C:\\Users\\User\\hackathon\\src> ${command}`);
    socketRef.current?.emit('terminal-input', { roomId, command });
  };

  useEffect(() => {
    if (socketRef.current) {
      socketRef.current.on('terminal-output', ({ output: terminalOutput }) => {
        setOutput(prev => prev + `\n${terminalOutput}`);
      });
    }
  }, [socketRef.current]);

  const sendMessage = (text, color) => {
    if (!text.trim()) return;
    yMessages.push([{
      username: email,
      text: text.trim(),
      color: color || '#007acc',
      timestamp: Date.now()
    }]);
  };

  const startVoiceCall = () => {
    if (typeof window.__devSyncStartCall === 'function') {
      window.__devSyncStartCall();
    }
  };

  const value = {
    clients, roomId, username: email, awarenessUsers,
    activeSidebarTab, setActiveSidebarTab,
    isSidebarOpen, setIsSidebarOpen,
    isBottomPanelOpen, setIsBottomPanelOpen,
    bottomPanelTab, setBottomPanelTab,
    searchQuery, handleSearch, searchResults,
    files, setFiles, activeFileId, setActiveFileId, openFileIds, openFileById, closeFile, activeFile,
    messages, setMessages, sendMessage,
    output, setOutput, isRunning, previewDoc,
    contextMenu, setContextMenu,
    creatingNode, setCreatingNode,
    renamingNodeId, setRenamingNodeId, renameValue, setRenameValue,
    emitFileSystemUpdate, handleEditorChange, runCode,
    openFile, openFolder, sendTerminalCommand,
    startVoiceCall, incomingCall, setIncomingCall,
    socketRef
  };

  return (
    <EditorContext.Provider value={value}>
      {children}
    </EditorContext.Provider>
  );
};
