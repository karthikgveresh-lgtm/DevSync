import React, { useRef, useEffect } from 'react';
import Editor from '@monaco-editor/react';
import { MonacoBinding } from 'y-monaco';
import { useEditor } from '../../context/EditorContext';
import { useCollaboration } from '../../context/CollaborationContext';
import { useAuth } from '../../context/AuthContext';
import { X, Play, FileCode } from 'lucide-react';
import { getFileIcon } from '../../utils/fileIcons';

export const EditorArea = () => {
  const {
    activeFileId, openFileIds, openFileById, closeFile,
    files, handleEditorChange, runCode, awarenessUsers
  } = useEditor();
  
  const { ydoc, awareness } = useCollaboration();
  const { userRole } = useAuth();

  const editorRef = useRef(null);
  const bindingRef = useRef(null);
  const prevFileIdRef = useRef(null);

  const activeFile = files.find(f => f.id === activeFileId) || {
    id: 'none', name: 'No File', content: '', type: 'plaintext'
  };

  // The editor instance changes when activeFileId changes because of key={activeFileId}.
  // We initialize the Yjs binding when the specific editor instance mounts.
  
  // We use an effect just for cleanup on unmount of the entire component, 
  // but individual bindings are cleaned up when the editor remounts.
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
    
    // Set readOnly based on role
    editor.updateOptions({ readOnly: userRole === 'viewer' });
    
    if (bindingRef.current) {
      bindingRef.current.destroy();
      bindingRef.current = null;
    }

    const yText = ydoc.getText(`file_content_${activeFileId}`);

    bindingRef.current = new MonacoBinding(
      yText,
      editor.getModel(),
      new Set([editor]),
      awareness
    );

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
        <div style={{ marginLeft: 'auto', display: 'flex', gap: 16 }}>
          <button onClick={runCode} title="Run Code" style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#858585', display: 'flex' }}>
            <Play size={14} fill="currentColor" />
          </button>
        </div>
      </div>

      {/* Monaco Editor */}
      <div style={{ flex: 1, overflow: 'hidden', minHeight: 0 }}>
        {activeFileId && activeFileId !== 'none' ? (
          <Editor
            key={activeFileId}
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
            <p style={{ marginTop: 16, fontSize: 20, fontWeight: 300 }}>Select a file to edit</p>
          </div>
        )}
      </div>
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
