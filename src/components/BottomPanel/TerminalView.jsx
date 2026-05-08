import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Plus, Trash2, TerminalSquare, SplitSquareHorizontal, ChevronDown, MoreHorizontal, Loader2, X } from 'lucide-react';
import { useEditor } from '../../context/EditorContext';
import { useCollaboration } from '../../context/CollaborationContext';
import { executeCode } from '../../utils/compiler';

const PROMPT = 'teamkode@workspace:~$ ';

const createWelcomeLines = () => [
  { type: 'system', text: '  ____              ____                   ' },
  { type: 'system', text: ' |  _ \\  _____   __|  _ \\ _   _ _ __   ___ ' },
  { type: 'system', text: " | | | |/ _ \\ \\ / /| |_) | | | | '_ \\ / __|" },
  { type: 'system', text: ' | |_| |  __/\\ V / |  __/| |_| | | | | (__ ' },
  { type: 'system', text: ' |____/ \\___| \\_/  |_|    \\__, |_| |_|\\___|' },
  { type: 'system', text: '                           |___/             ' },
  { type: 'blank', text: '' },
  { type: 'info', text: '  🚀 TeamKode Terminal v2.0 — Collaborative IDE Shell' },
  { type: 'info', text: '  Type "help" for available commands or "run" to execute the active file.' },
  { type: 'blank', text: '' },
];

const HELP_TEXT = [
  { type: 'cmd', text: '  Available commands:' },
  { type: 'blank', text: '' },
  { type: 'cmd', text: '  run              Run the currently active file' },
  { type: 'cmd', text: '  run <lang> <code>  Execute code snippet directly' },
  { type: 'cmd', text: '  clear            Clear the terminal' },
  { type: 'cmd', text: '  ls               List files in workspace' },
  { type: 'cmd', text: '  whoami           Show current user' },
  { type: 'cmd', text: '  echo <text>      Print text' },
  { type: 'cmd', text: '  date             Show current date & time' },
  { type: 'cmd', text: '  help             Show this help message' },
  { type: 'blank', text: '' },
];

export const TerminalView = () => {
  const { activeFile, activeFileId, files, output, isRunning: globalRunning, setIsBottomPanelOpen, setBottomPanelTab } = useEditor();
  const { ydoc, username } = useCollaboration?.() || {};
  const [lines, setLines] = useState(createWelcomeLines);
  const [input, setInput] = useState('');
  const [isRunning, setIsRunning] = useState(false);
  const [history, setHistory] = useState([]);
  const [historyIdx, setHistoryIdx] = useState(-1);
  const [activeTerminal, setActiveTerminal] = useState('terminal');
  const [terminals, setTerminals] = useState([
    { id: 'terminal', name: '⚡ Thunder', type: 'thunder' },
  ]);
  const bottomRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [lines]);

  const pushLines = useCallback((newLines) => {
    setLines(prev => [...prev, ...newLines]);
  }, []);

  // ── Sync EditorContext output (from the ▶ play button) into terminal lines ──
  const lastOutputRef = useRef('');
  useEffect(() => {
    if (!output || output === lastOutputRef.current) return;
    lastOutputRef.current = output;
    const outLines = output.split('\n').map(l => ({
      type: l.toLowerCase().includes('error') ? 'error' : 'output',
      text: `  ${l}`,
    }));
    setLines(prev => [...prev, { type: 'blank', text: '' }, ...outLines, { type: 'blank', text: '' }]);
  }, [output]);

  const deleteTerminal = (id) => {
    setTerminals(prev => {
      const next = prev.filter(t => t.id !== id);
      if (activeTerminal === id) {
        setActiveTerminal(next.length > 0 ? next[next.length - 1].id : null);
      }
      return next;
    });
  };

  const runActiveFile = useCallback(async () => {
    if (!activeFile || activeFile.id === 'dummy') {
      pushLines([{ type: 'error', text: '  ✖ No active file to run. Open a file first.' }]);
      return;
    }

    // Resolve language: prefer file extension over stored type metadata
    const extMap = { js: 'javascript', py: 'python', ts: 'typescript', java: 'java', cpp: 'cpp', c: 'c', rs: 'rust', go: 'go', html: 'html' };
    const ext = activeFile.name.split('.').pop()?.toLowerCase();
    const lang = extMap[ext] || activeFile.type || ext;

    if (lang === 'html') {
      pushLines([{ type: 'info', text: '  💡 HTML files open in Live Preview. Click the ▶ button in the editor.' }]);
      return;
    }

    const code = ydoc
      ? ydoc.getText(`file_content_${activeFileId}`).toString()
      : activeFile.content;

    if (!code.trim()) {
      pushLines([{ type: 'error', text: `  ✖ ${activeFile.name} is empty. Nothing to run.` }]);
      return;
    }

    pushLines([
      { type: 'prompt', text: `${PROMPT}run` },
      { type: 'info', text: `  ⚙️ TeamKode Compiler: Preparing to run ${activeFile.name}...` },
      { type: 'info', text: `  🌐 Connecting to remote execution server (${lang})...` },
      { type: 'blank', text: '' },
    ]);

    setIsRunning(true);
    const result = await executeCode(lang, code);
    setIsRunning(false);

    if (!result || result.trim() === '') {
       pushLines([{ type: 'output', text: '  (Program executed successfully but returned no output)' }]);
    } else {
      const outputLines = result.split('\n').map(l => ({
        type: l.toLowerCase().startsWith('✖') || l.toLowerCase().includes('error') ? 'error' : 'output',
        text: `  ${l}`,
      }));
      pushLines(outputLines);
    }
    pushLines([{ type: 'blank', text: '' }]);
  }, [activeFile, activeFileId, ydoc, pushLines]);

  const handleCommand = useCallback(async (cmd) => {
    const trimmed = cmd.trim();
    if (!trimmed) return;

    setHistory(prev => [trimmed, ...prev]);
    setHistoryIdx(-1);

    pushLines([{ type: 'prompt', text: `${PROMPT}${trimmed}` }]);

    const parts = trimmed.split(' ');
    const base = parts[0].toLowerCase();

    if (base === 'clear') {
      setLines([]);
      return;
    }
    if (base === 'help') {
      pushLines(HELP_TEXT);
      return;
    }
    if (base === 'run') {
      await runActiveFile();
      return;
    }
    if (base === 'ls') {
      const workspaceFiles = files.filter(f => !f.isFolder).map(f => f.name);
      const folders = files.filter(f => f.isFolder).map(f => `\x1b[34m${f.name}/\x1b[0m`);
      pushLines([
        { type: 'output', text: `  ${[...folders, ...workspaceFiles].join('   ')}` },
        { type: 'blank', text: '' },
      ]);
      return;
    }
    if (base === 'whoami') {
      pushLines([
        { type: 'output', text: `  ${username || 'devsync-user'}` },
        { type: 'blank', text: '' },
      ]);
      return;
    }
    if (base === 'echo') {
      pushLines([
        { type: 'output', text: `  ${parts.slice(1).join(' ')}` },
        { type: 'blank', text: '' },
      ]);
      return;
    }
    if (base === 'date') {
      pushLines([
        { type: 'output', text: `  ${new Date().toString()}` },
        { type: 'blank', text: '' },
      ]);
      return;
    }

    // Unknown command → try Piston
    pushLines([
      { type: 'error', text: `  ✖ Command not found: ${base}` },
      { type: 'info', text: `  💡 Tip: type "help" to see available commands or "run" to execute the active file.` },
      { type: 'blank', text: '' },
    ]);
  }, [files, username, runActiveFile, pushLines]);

  const onKeyDown = useCallback((e) => {
    if (e.key === 'Enter') {
      handleCommand(input);
      setInput('');
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHistoryIdx(i => {
        const next = Math.min(i + 1, history.length - 1);
        setInput(history[next] || '');
        return next;
      });
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      setHistoryIdx(i => {
        const next = Math.max(i - 1, -1);
        setInput(next === -1 ? '' : history[next]);
        return next;
      });
    }
  }, [input, history, handleCommand]);

  const getLineStyle = (type) => {
    switch (type) {
      case 'system': return { color: '#007acc', fontWeight: 'bold' };
      case 'info': return { color: '#8bc500' };
      case 'error': return { color: '#f14c4c' };
      case 'output': return { color: '#cccccc' };
      case 'prompt': return { color: '#569cd6' };
      case 'cmd': return { color: '#c586c0' };
      case 'blank': return {};
      default: return { color: '#cccccc' };
    }
  };

  const addTerminal = () => {
    const id = `terminal-${Date.now()}`;
    setTerminals(prev => [...prev, { id, name: '⚡ Thunder', type: 'thunder' }]);
    setActiveTerminal(id);
    setLines(createWelcomeLines());
  };

  return (
    <div style={{ display: 'flex', flex: 1, background: '#0d0d0d', fontFamily: "'Cascadia Code', 'Fira Code', 'Consolas', monospace", fontSize: 13, overflow: 'hidden' }}>
      {/* Main terminal area */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}
        onClick={() => inputRef.current?.focus()}>

        {/* Output scrollable area */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '8px 0', lineHeight: '1.6' }}>
          {lines.map((line, i) => (
            <div key={i} style={{ padding: '0 16px', whiteSpace: 'pre', ...getLineStyle(line.type) }}>
              {line.text}
            </div>
          ))}
          {isRunning && (
            <div style={{ padding: '0 16px', display: 'flex', alignItems: 'center', gap: 8, color: '#007acc' }}>
              <Loader2 size={13} style={{ animation: 'spin 1s linear infinite' }} />
              <span>Running...</span>
            </div>
          )}
          <div ref={bottomRef} />
        </div>

        {/* Input row */}
        <div style={{ display: 'flex', alignItems: 'center', padding: '4px 16px 8px', borderTop: '1px solid #1e1e1e', gap: 6 }}>
          <span style={{ color: '#8bc500', flexShrink: 0, userSelect: 'none' }}>{PROMPT}</span>
          <input
            ref={inputRef}
            autoFocus
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={onKeyDown}
            style={{
              flex: 1, background: 'transparent', border: 'none', outline: 'none',
              color: '#f0f0f0', fontSize: 13, fontFamily: 'inherit', caretColor: '#ffffff',
            }}
            spellCheck={false}
            autoComplete="off"
            autoCorrect="off"
          />
          {isRunning && (
            <button onClick={() => setIsRunning(false)}
              style={{ background: '#3a1010', border: '1px solid #6b2323', borderRadius: 4, color: '#f14c4c', fontSize: 11, padding: '2px 8px', cursor: 'pointer' }}>
              ■ Stop
            </button>
          )}
        </div>
      </div>

      {/* Right panel - terminal sessions */}
      <div style={{ width: 190, borderLeft: '1px solid #1e1e1e', display: 'flex', flexDirection: 'column', background: '#111' }}>
        {/* Toolbar */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '4px 8px', borderBottom: '1px solid #1e1e1e' }}>
          <div style={{ display: 'flex', gap: 2 }}>
            <button onClick={addTerminal} title="New Terminal"
              style={{ background: 'none', border: 'none', color: '#cccccc', cursor: 'pointer', padding: 4, borderRadius: 4, display: 'flex' }}
              onMouseEnter={e => e.currentTarget.style.background = '#2a2d2e'}
              onMouseLeave={e => e.currentTarget.style.background = 'none'}>
              <Plus size={14} />
            </button>
            <button title="Split Terminal"
              style={{ background: 'none', border: 'none', color: '#858585', cursor: 'pointer', padding: 4, borderRadius: 4, display: 'flex' }}
              onMouseEnter={e => e.currentTarget.style.background = '#2a2d2e'}
              onMouseLeave={e => e.currentTarget.style.background = 'none'}>
              <SplitSquareHorizontal size={14} />
            </button>
          </div>
          <div style={{ display: 'flex', gap: 2 }}>
            <button onClick={() => { setLines([]); pushLines(createWelcomeLines()); }} title="Clear"
              style={{ background: 'none', border: 'none', color: '#858585', cursor: 'pointer', padding: 4, borderRadius: 4, display: 'flex' }}
              onMouseEnter={e => e.currentTarget.style.background = '#2a2d2e'}
              onMouseLeave={e => e.currentTarget.style.background = 'none'}>
              <Trash2 size={14} />
            </button>
          </div>
        </div>

        {/* Terminal session list */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '4px 0' }}>
          {terminals.map(t => (
            <div key={t.id}
              onClick={() => setActiveTerminal(t.id)}
              style={{
                display: 'flex', alignItems: 'center', gap: 6, padding: '5px 6px 5px 12px', cursor: 'pointer',
                background: activeTerminal === t.id ? '#37373d' : 'transparent',
                borderLeft: activeTerminal === t.id ? '2px solid #007acc' : '2px solid transparent',
                color: activeTerminal === t.id ? '#ffffff' : '#858585',
                position: 'relative',
              }}
              className="terminal-session-row"
              onMouseEnter={e => {
                if (activeTerminal !== t.id) e.currentTarget.style.background = '#1e1e1e';
                const btn = e.currentTarget.querySelector('.del-btn');
                if (btn) btn.style.opacity = '1';
              }}
              onMouseLeave={e => {
                if (activeTerminal !== t.id) e.currentTarget.style.background = 'transparent';
                const btn = e.currentTarget.querySelector('.del-btn');
                if (btn) btn.style.opacity = '0';
              }}
            >
              <TerminalSquare size={13} style={{ flexShrink: 0 }} />
              <span style={{ fontSize: 12, flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{t.name}</span>
              {isRunning && activeTerminal === t.id && <Loader2 size={10} style={{ animation: 'spin 1s linear infinite', color: '#8bc500', flexShrink: 0 }} />}
              <button
                className="del-btn"
                onClick={e => { e.stopPropagation(); deleteTerminal(t.id); }}
                title="Delete Terminal"
                style={{
                  background: 'none', border: 'none', color: '#888', cursor: 'pointer',
                  padding: '2px 3px', borderRadius: 3, display: 'flex', flexShrink: 0,
                  opacity: 0, transition: 'opacity 0.15s',
                }}
                onMouseEnter={e => { e.currentTarget.style.background = '#3a1010'; e.currentTarget.style.color = '#f14c4c'; }}
                onMouseLeave={e => { e.currentTarget.style.background = 'none'; e.currentTarget.style.color = '#888'; }}
              >
                <X size={11} />
              </button>
            </div>
          ))}

        </div>

        {/* Quick run button */}
        <div style={{ padding: '8px', borderTop: '1px solid #1e1e1e' }}>
          <button onClick={runActiveFile} disabled={isRunning}
            style={{
              width: '100%', padding: '6px 0', background: isRunning ? '#1a1a1a' : 'linear-gradient(135deg, #0062a3, #007acc)',
              border: 'none', borderRadius: 6, color: isRunning ? '#555' : 'white', fontSize: 12, fontWeight: 600,
              cursor: isRunning ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
            }}>
            {isRunning ? <><Loader2 size={12} style={{ animation: 'spin 1s linear infinite' }} /> Running...</> : '▶ Run Active File'}
          </button>
        </div>
      </div>

      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        ::-webkit-scrollbar { width: 6px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: rgba(100,100,100,0.4); border-radius: 3px; }
      `}</style>
    </div>
  );
};
