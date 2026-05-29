import React, { useState, useRef, useEffect } from 'react';
import { Plus, Trash2, TerminalSquare, SplitSquareHorizontal, X, Loader2 } from 'lucide-react';
import { useEditor } from '../../context/EditorContext';
import { Terminal } from 'xterm';
import { FitAddon } from 'xterm-addon-fit';
import { getWebContainer, writeFilesToContainer } from '../../utils/webcontainer';
import 'xterm/css/xterm.css';

export const TerminalView = () => {
  const { files } = useEditor();
  const [activeTerminal, setActiveTerminal] = useState('terminal-1');
  const [terminals, setTerminals] = useState([
    { id: 'terminal-1', name: 'bash' },
  ]);
  const [isBooting, setIsBooting] = useState(true);
  
  const terminalRef = useRef(null);
  const xtermInstance = useRef(null);
  const fitAddon = useRef(null);
  const shellProcessRef = useRef(null);

  useEffect(() => {
    // Initialize xterm.js
    if (!terminalRef.current) return;

    const term = new Terminal({
      theme: {
        background: '#0d0d0d',
        foreground: '#cccccc',
        cursor: '#ffffff',
        selectionBackground: 'rgba(255, 255, 255, 0.3)',
      },
      fontFamily: "'Cascadia Code', 'Fira Code', 'Consolas', monospace",
      fontSize: 13,
      cursorBlink: true,
      convertEol: true,
    });
    
    const fit = new FitAddon();
    term.loadAddon(fit);
    term.open(terminalRef.current);
    fit.fit();
    
    xtermInstance.current = term;
    fitAddon.current = fit;

    const handleResize = () => fit.fit();
    window.addEventListener('resize', handleResize);

    const bootContainer = async () => {
      try {
        term.writeln('\x1b[34m[DevSync Engine]\x1b[0m Provisioning container...');
        
        const webcontainerInstance = await getWebContainer();
        
        term.writeln('\x1b[34m[DevSync Engine]\x1b[0m Mounting workspace files...');
        await writeFilesToContainer(files);

        term.writeln('\x1b[34m[DevSync Engine]\x1b[0m Starting interactive shell...');
        
        // Start shell process
        const shellProcess = await webcontainerInstance.spawn('jsh', {
          terminal: {
            cols: term.cols,
            rows: term.rows,
          },
        });
        
        shellProcessRef.current = shellProcess;

        // Pipe xterm output to shell process input
        const inputWriter = shellProcess.input.getWriter();
        const inputListener = term.onData((data) => {
          inputWriter.write(data);
        });

        // Pipe shell process output to xterm
        shellProcess.output.pipeTo(
          new WritableStream({
            write(data) {
              term.write(data);
            },
          })
        );

        setIsBooting(false);

      } catch (error) {
        term.writeln(`\x1b[31mError booting container:\x1b[0m ${error.message}`);
        setIsBooting(false);
      }
    };

    bootContainer();

    return () => {
      window.removeEventListener('resize', handleResize);
      term.dispose();
      // Note: we intentionally don't kill the shell process so it persists across tab changes
    };
  }, []);

  const addTerminal = () => {
    const id = `terminal-${Date.now()}`;
    setTerminals(prev => [...prev, { id, name: 'bash' }]);
    setActiveTerminal(id);
    // In a full implementation, this would spawn a new shell process and swap the xterm DOM target.
  };

  const deleteTerminal = (id) => {
    setTerminals(prev => {
      const next = prev.filter(t => t.id !== id);
      if (activeTerminal === id) {
        setActiveTerminal(next.length > 0 ? next[next.length - 1].id : null);
      }
      return next;
    });
  };

  return (
    <div style={{ display: 'flex', flex: 1, background: '#0d0d0d', fontFamily: "'Cascadia Code', 'Fira Code', 'Consolas', monospace", fontSize: 13, overflow: 'hidden' }}>
      
      {/* Main terminal area */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', position: 'relative' }}>
        <div 
          ref={terminalRef} 
          style={{ width: '100%', height: '100%', padding: '8px' }} 
        />
        
        {isBooting && (
          <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(13,13,13,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#007acc', gap: 8 }}>
            <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} />
            <span>Spinning up container...</span>
          </div>
        )}
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
            <button onClick={() => { if(xtermInstance.current) xtermInstance.current.clear(); }} title="Clear"
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
      </div>

      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        /* Fix xterm.js scrollbar visibility */
        .xterm-viewport::-webkit-scrollbar { width: 6px; }
        .xterm-viewport::-webkit-scrollbar-track { background: transparent; }
        .xterm-viewport::-webkit-scrollbar-thumb { background: rgba(100,100,100,0.4); border-radius: 3px; }
      `}</style>
    </div>
  );
};
