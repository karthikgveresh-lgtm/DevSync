import React, { useRef, useEffect } from 'react';
import Editor from '@monaco-editor/react';
import { MonacoBinding } from 'y-monaco';
import { useEditor } from '../../context/EditorContext';
import { useCollaboration } from '../../context/CollaborationContext';
import { useAuth } from '../../context/AuthContext';
import { X, Play, FileCode, Clock, Pause, SkipBack, SkipForward } from 'lucide-react';
import { getFileIcon } from '../../utils/fileIcons';

export const EditorArea = () => {
  const {
    activeFileId, openFileIds, openFileById, closeFile,
    files, handleEditorChange, runCode, awarenessUsers,
    isTimeTravelMode, setIsTimeTravelMode,
    isPlayingHistory, setIsPlayingHistory,
    historyPlayIndex, setHistoryPlayIndex,
    historySnapshots
  } = useEditor();
  
  const { ydoc, awareness } = useCollaboration();
  const { userRole } = useAuth();

  const editorRef = useRef(null);
  const bindingRef = useRef(null);
  const prevFileIdRef = useRef(null);

  const activeFile = isTimeTravelMode
    ? (historySnapshots[historyPlayIndex]?.files?.find(f => f.id === activeFileId) || { id: 'none', name: 'No File', content: '', type: 'plaintext' })
    : (files.find(f => f.id === activeFileId) || {
        id: 'none', name: 'No File', content: '', type: 'plaintext'
      });

  // The editor instance changes when activeFileId changes because of key={activeFileId}.
  // We initialize the Yjs binding when the specific editor instance mounts.
  
  // We use an effect just for cleanup on unmount of the entire component, 
  // but individual bindings are cleaned up when the editor remounts.
  // Time Travel playback loop
  useEffect(() => {
    let timer = null;
    if (isPlayingHistory && isTimeTravelMode) {
      timer = setInterval(() => {
        setHistoryPlayIndex(prev => {
          if (prev >= historySnapshots.length - 1) {
            setIsPlayingHistory(false);
            return prev;
          }
          return prev + 1;
        });
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [isPlayingHistory, isTimeTravelMode, historySnapshots.length, setHistoryPlayIndex, setIsPlayingHistory]);

  useEffect(() => {
    return () => {
      if (bindingRef.current) {
        bindingRef.current.destroy();
        bindingRef.current = null;
      }
    };
  }, []);

  const getLanguage = (fileName) => {
    const ext = (fileName || '').split('.').pop().toLowerCase();
    const map = {
      js: 'javascript', jsx: 'javascript', ts: 'typescript', tsx: 'typescript',
      py: 'python', html: 'html', css: 'css', json: 'json',
      cpp: 'cpp', c: 'c', java: 'java', md: 'markdown', sh: 'shell'
    };
    return map[ext] || 'plaintext';
  };

  let completionProviderRef = useRef(null);

  const handleEditorMount = (editor, monaco) => {
    editorRef.current = editor;
    
    // Set readOnly based on role and time travel mode
    editor.updateOptions({ readOnly: userRole === 'viewer' || isTimeTravelMode });
    
    if (bindingRef.current) {
      bindingRef.current.destroy();
      bindingRef.current = null;
    }

    if (!isTimeTravelMode) {
      const yText = ydoc.getText(`file_content_${activeFileId}`);

      bindingRef.current = new MonacoBinding(
        yText,
        editor.getModel(),
        new Set([editor]),
        awareness
      );
    } else {
      editor.setValue(activeFile.content || '');
    }

    // ── DevSync AI: Inline Autocomplete (Ghost Text) ──
    if (!completionProviderRef.current) {
      completionProviderRef.current = monaco.languages.registerInlineCompletionsProvider('*', {
        provideInlineCompletions: async (model, position, context, token) => {
          const lineContent = model.getLineContent(position.lineNumber);
          const word = model.getWordUntilPosition(position);
          
          // Hackathon AI Mock logic:
          let suggestion = '';
          
          if (lineContent.trim() === 'function calculate') {
            suggestion = 'Total(price, tax) {\n  return price + (price * tax);\n}';
          } else if (lineContent.trim() === 'import React') {
            suggestion = " from 'react';\nimport { useState } from 'react';";
          } else if (lineContent.trim() === '// fetch user') {
            suggestion = "\nconst fetchUser = async (id) => {\n  const res = await fetch(`/api/users/${id}`);\n  return res.json();\n};";
          } else if (lineContent.endsWith('console.')) {
            suggestion = "log('DevSync AI Autocomplete works!');";
          } else {
            return { items: [] };
          }

          return {
            items: [{
              insertText: suggestion,
              range: new monaco.Range(position.lineNumber, position.column, position.lineNumber, position.column)
            }]
          };
        },
        freeInlineCompletions: () => {}
      });
    }
  };

  useEffect(() => {
    return () => {
      if (completionProviderRef.current) {
        completionProviderRef.current.dispose();
      }
    };
  }, []);

  return (
    <div
      className="editor-area flex-1 flex flex-col bg-[#1e1e1e] overflow-hidden"
      style={{ height: '100%', display: 'flex', flexDirection: 'column' }}
    >
      {/* Tabs Bar */}
      <div style={{ display: 'flex', background: '#252526', overflowX: 'auto', flexShrink: 0, borderBottom: '1px solid #1e1e1e' }}>
        {openFileIds.map(fid => {
          const file = files.find(f => f.id === fid);
          if (!file) return null;
          const isActive = activeFileId === fid;

          return (
            <div
              key={fid}
              onClick={() => openFileById(fid)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                padding: '6px 12px',
                minWidth: 120,
                maxWidth: 200,
                borderRight: '1px solid #1e1e1e',
                cursor: 'pointer',
                position: 'relative',
                flexShrink: 0,
                background: isActive ? '#1e1e1e' : '#2d2d2d',
                color: isActive ? '#ffffff' : '#969696',
                fontSize: 13,
                userSelect: 'none',
              }}
            >
              {isActive && (
                <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 1, background: '#007acc' }} />
              )}
              <span style={{ flexShrink: 0, display: 'flex' }}>{getFileIcon(file.name, false, false)}</span>
              <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>
                {file.name}
              </span>
              <button
                onClick={(e) => closeFile(fid, e)}
                style={{
                  background: 'none', border: 'none', cursor: 'pointer',
                  color: 'inherit', padding: 2, borderRadius: 3, display: 'flex',
                  opacity: isActive ? 1 : 0,
                  transition: 'opacity 0.1s',
                }}
                onMouseEnter={e => { e.currentTarget.style.background = '#454545'; e.currentTarget.style.opacity = 1; }}
                onMouseLeave={e => { e.currentTarget.style.background = 'none'; e.currentTarget.style.opacity = isActive ? 1 : 0; }}
              >
                <X size={14} />
              </button>
            </div>
          );
        })}
        <div style={{ flex: 1, background: '#252526' }} />
      </div>

      {/* Breadcrumb */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '3px 16px', fontSize: 12, color: '#858585', background: '#1e1e1e', flexShrink: 0 }}>
        <span style={{ cursor: 'pointer' }}>src</span>
        <span>&gt;</span>
        <span style={{ display: 'flex', alignItems: 'center', gap: 4, cursor: 'pointer' }}>
          {getFileIcon(activeFile.name, false, false)}
          {activeFile.name}
        </span>
        <div style={{ marginLeft: 'auto', display: 'flex', gap: 16, alignItems: 'center' }}>
          <button 
            onClick={() => {
              if (historySnapshots.length === 0) {
                alert("No coding history recorded yet!");
                return;
              }
              setIsTimeTravelMode(!isTimeTravelMode);
              setHistoryPlayIndex(historySnapshots.length - 1);
              setIsPlayingHistory(false);
            }} 
            title="Time Travel Replay" 
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: isTimeTravelMode ? '#7c6fff' : '#858585', display: 'flex' }}
          >
            <Clock size={14} />
          </button>
          <button onClick={runCode} title="Run Code" style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#858585', display: 'flex' }}>
            <Play size={14} fill="currentColor" />
          </button>
        </div>
      </div>

      {/* Monaco Editor */}
      <div style={{ flex: 1, overflow: 'hidden', minHeight: 0 }}>
        {activeFileId && activeFileId !== 'none' ? (
          <Editor
            key={`${activeFileId}_${isTimeTravelMode}`}
            height="100%"
            theme="vs-dark"
            language={getLanguage(activeFile.name)}
            defaultValue={activeFile.content || ''}
            onMount={handleEditorMount}
            options={{
              fontSize: 14,
              minimap: { enabled: true },
              scrollBeyondLastLine: false,
              automaticLayout: true,
              padding: { top: 10 },
              cursorBlinking: 'smooth',
              smoothScrolling: true,
              lineHeight: 20,
              wordWrap: 'on',
            }}
          />
        ) : (
          <div style={{ height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', opacity: 0.2, userSelect: 'none', color: '#cccccc' }}>
            <FileCode size={100} strokeWidth={0.5} />
            <p style={{ marginTop: 16, fontSize: 20, fontStyle: 300 }}>Select a file to edit</p>
          </div>
        )}
      </div>

      {/* Time-Travel Replay Panel */}
      {isTimeTravelMode && (
        <div style={{
          background: 'linear-gradient(90deg, #10101e, #1a1a2e)',
          borderTop: '1px solid #7c6fff50',
          padding: '12px 24px',
          display: 'flex',
          flexDirection: 'column',
          gap: 8,
          zIndex: 50,
          boxShadow: '0 -4px 20px rgba(0,0,0,0.5)',
          color: '#cccccc',
          fontFamily: "'Segoe UI', sans-serif"
        }}>
          {/* Header & Controls */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span className="animate-pulse" style={{ width: 8, height: 8, borderRadius: '50%', background: '#7c6fff' }} />
              <span style={{ fontSize: 11, fontWeight: 'bold', color: '#e0e0ff', letterSpacing: 0.5 }}>
                TIME TRAVEL PLAYBACK
              </span>
              <span style={{ fontSize: 11, color: '#858585' }}>
                (Snapshot {historyPlayIndex + 1} of {historySnapshots.length})
              </span>
            </div>

            {/* Playback Buttons */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
              <button
                onClick={() => setHistoryPlayIndex(0)}
                title="Restart"
                style={{ background: 'none', border: 'none', color: '#858585', cursor: 'pointer', display: 'flex' }}
              >
                <SkipBack size={16} />
              </button>
              
              <button
                onClick={() => setIsPlayingHistory(!isPlayingHistory)}
                style={{
                  background: '#7c6fff', border: 'none', borderRadius: '50%',
                  width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: 'white', cursor: 'pointer', boxShadow: '0 0 10px rgba(124,111,255,0.4)',
                }}
              >
                {isPlayingHistory ? <Pause size={16} fill="white" /> : <Play size={16} fill="white" style={{ marginLeft: 2 }} />}
              </button>
              
              <button
                onClick={() => setHistoryPlayIndex(historySnapshots.length - 1)}
                title="Jump to End"
                style={{ background: 'none', border: 'none', color: '#858585', cursor: 'pointer', display: 'flex' }}
              >
                <SkipForward size={16} />
              </button>
            </div>

            <button
              onClick={() => {
                setIsTimeTravelMode(false);
                setIsPlayingHistory(false);
              }}
              style={{
                background: '#f4433620', border: '1px solid #f4433650', color: '#f44336',
                padding: '4px 12px', borderRadius: 4, cursor: 'pointer', fontSize: 11, fontWeight: 600,
                transition: 'all 0.2s',
              }}
            >
              Exit Playback
            </button>
          </div>

          {/* Timeline Slider */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <span style={{ fontSize: 11, color: '#858585', fontFamily: 'monospace', minWidth: 60 }}>
              {new Date(historySnapshots[0]?.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
            </span>
            
            <input
              type="range"
              min={0}
              max={historySnapshots.length - 1}
              value={historyPlayIndex}
              onChange={e => {
                setHistoryPlayIndex(Number(e.target.value));
                setIsPlayingHistory(false);
              }}
              style={{
                flex: 1, accentColor: '#7c6fff', height: 4, borderRadius: 2,
                cursor: 'pointer',
              }}
            />
            
            <span style={{ fontSize: 11, color: '#858585', fontFamily: 'monospace', minWidth: 60, textAlign: 'right' }}>
              {new Date(historySnapshots[historyPlayIndex]?.timestamp || Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
            </span>
          </div>
        </div>
      )}
      {/* Dynamic Cursor Styles */}
      <style>
        {awarenessUsers && awarenessUsers.map(u => {
          if (u.role === 'viewer') {
            return `.yRemoteSelection-${u.clientId}, .yRemoteSelectionHead-${u.clientId} { display: none !important; }`;
          }
          
          return `
            .yRemoteSelection-${u.clientId} {
              background-color: ${u.color}40 !important;
            }
            .yRemoteSelectionHead-${u.clientId} {
              border-color: ${u.color} !important;
            }
            /* Inline phantom text like GitLens */
            .yRemoteSelectionHead-${u.clientId}::after {
              content: "  ${u.name}, just now • Live session";
              position: absolute;
              left: 4px;
              top: 0;
              color: ${u.color};
              font-size: 13px;
              font-style: italic;
              font-family: 'Consolas', 'Courier New', monospace;
              white-space: nowrap;
              pointer-events: none;
              z-index: 99;
              opacity: 0.4; /* Made lighter as requested */
            }
          `;
        }).join('\n')}
      </style>
    </div>
  );
};
