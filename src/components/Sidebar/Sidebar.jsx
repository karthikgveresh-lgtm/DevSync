import React from 'react';
import { ChevronDown, ChevronRight, FileCode, Folder as FolderIcon } from 'lucide-react';
import { useEditor } from '../../context/EditorContext';
import { useAuth } from '../../context/AuthContext';
import { useCollaboration } from '../../context/CollaborationContext';
import { SearchSidebar } from './SearchSidebar';
import { ExtensionsSidebar } from './ExtensionsSidebar';
import { AiCopilotSidebar } from './AiCopilotSidebar';
import { GitSidebar } from './GitSidebar';
import { getFileIcon } from '../../utils/fileIcons';

export const Sidebar = () => {
  const {
    activeSidebarTab, files, setContextMenu,
    creatingNode, setCreatingNode,
    renamingNodeId, setRenamingNodeId, renameValue, setRenameValue,
    emitFileSystemUpdate, activeFileId, openFileById,
    awarenessUsers, messages, sendMessage, username,
    roomId
  } = useEditor();

  const { ydoc } = useCollaboration();
  const { isHost, userRole } = useAuth();

  const [currMessage, setCurrMessage] = React.useState('');
  const [localNewNodeName, setLocalNewNodeName] = React.useState('');
  const [userMenu, setUserMenu] = React.useState({ visible: false, x: 0, y: 0, targetUser: null });

  const handleUserContextMenu = (e, u) => {
    if (!isHost || u.name === username) return;
    e.preventDefault();
    e.stopPropagation();
    setUserMenu({ visible: true, x: e.clientX, y: e.clientY, targetUser: u });
  };

  const handleRoleChange = (role) => {
    if (userMenu.targetUser) {
      const authMap = ydoc.getMap('auth');
      authMap.set(userMenu.targetUser.name, role);
    }
    setUserMenu({ visible: false, x: 0, y: 0, targetUser: null });
  };

  React.useEffect(() => {
    const handleClick = () => setUserMenu(prev => ({ ...prev, visible: false }));
    window.addEventListener('click', handleClick);
    return () => window.removeEventListener('click', handleClick);
  }, []);

  const handleContextMenu = (e, nodeId) => {
    e.preventDefault();
    e.stopPropagation();
    const node = files.find(f => f.id === nodeId);
    const type = node ? (node.isFolder ? 'folder' : 'file') : 'global';
    setContextMenu({ visible: true, x: e.clientX, y: e.clientY, nodeId, type });
  };

  const toggleFolder = (id) => {
    emitFileSystemUpdate(files.map(f => f.id === id ? { ...f, isOpen: !f.isOpen } : f));
  };

  const commitRename = () => {
    if (renameValue.trim()) {
      const newName = renameValue.trim();
      const nodeToRename = files.find(f => f.id === renamingNodeId);

      if (nodeToRename && nodeToRename.name.toLowerCase() !== newName.toLowerCase()) {
        const isDuplicate = files.some(
          f => f.parentId === nodeToRename.parentId && f.name.toLowerCase() === newName.toLowerCase() && f.id !== renamingNodeId
        );
        if (isDuplicate) {
          alert(`A file or folder named "${newName}" already exists in this location.`);
          setRenamingNodeId(null);
          return;
        }
      }

      const extension = newName.split('.').pop();
      const typeMap = { js: 'javascript', py: 'python', cpp: 'cpp', java: 'java', html: 'html', css: 'css' };

      emitFileSystemUpdate(files.map(f => {
        if (f.id === renamingNodeId) {
          return {
            ...f,
            name: newName,
            type: !f.isFolder ? (typeMap[extension] || extension) : f.type
          };
        }
        return f;
      }));
    }
    setRenamingNodeId(null);
  };

  const commitNewNode = () => {
    if (localNewNodeName.trim()) {
      const name = localNewNodeName.trim();

      // ── Duplicate check ──────────────────────────────────────────────
      const isDuplicate = files.some(
        f => f.parentId === creatingNode.parentId && f.name.toLowerCase() === name.toLowerCase()
      );
      if (isDuplicate) {
        alert(`A file or folder named "${name}" already exists in this location.`);
        setLocalNewNodeName('');
        setCreatingNode({ active: false, type: 'file', parentId: null });
        return;
      }
      // ─────────────────────────────────────────────────────────────────

      const extension = name.split('.').pop() || 'txt';
      const typeMap = { js: 'javascript', py: 'python', cpp: 'cpp', java: 'java', html: 'html', css: 'css' };
      const nodeType = creatingNode.type === 'folder' ? 'folder' : (typeMap[extension] || extension);

      const newNode = {
        id: Date.now().toString(),
        name: name,
        type: nodeType,
        isFolder: creatingNode.type === 'folder',
        isOpen: false,
        parentId: creatingNode.parentId,
        content: ''
      };

      emitFileSystemUpdate([...files, newNode]);
      if (!newNode.isFolder) openFileById(newNode.id);
    }
    setCreatingNode({ active: false, type: 'file', parentId: null });
    setLocalNewNodeName('');
  };

  const renderTree = (parentId, depth = 0) => {
    const children = files.filter(f => f.parentId === parentId).sort((a, b) => {
      if (a.isFolder === b.isFolder) return a.name.localeCompare(b.name);
      return a.isFolder ? -1 : 1;
    });

    return (
      <div className="flex flex-col w-full text-[13px]">
        {children.map(node => (
          <React.Fragment key={node.id}>
            <div
              onContextMenu={(e) => handleContextMenu(e, node.id)}
              onClick={(e) => {
                e.stopPropagation();
                if (renamingNodeId === node.id) return;
                node.isFolder ? toggleFolder(node.id) : openFileById(node.id);
              }}
              style={{ paddingLeft: `${(depth * 14) + 8}px` }}
              className={`group flex items-center gap-1.5 py-[3px] pr-2 cursor-pointer ${activeFileId === node.id ? 'bg-(--vscode-list-active) text-white' : 'text-(--vscode-text-main) hover:bg-(--vscode-list-hover)'
                }`}
            >
              <div className="pointer-events-none flex items-center gap-1.5 w-full">
                {node.isFolder ? (
                  node.isOpen ? <ChevronDown size={14} className="text-[#cccccc]" /> : <ChevronRight size={14} className="text-[#cccccc]" />
                ) : (
                  <div className="w-3.5" />
                )}

                {getFileIcon(node.name, node.isFolder, node.isOpen)}

                {renamingNodeId === node.id ? (
                  <input
                    autoFocus
                    value={renameValue}
                    onChange={e => setRenameValue(e.target.value)}
                    onBlur={commitRename}
                    onKeyDown={e => { if (e.key === 'Enter') commitRename(); if (e.key === 'Escape') setRenamingNodeId(null); }}
                    className="bg-(--vscode-input-bg) border border-(--vscode-accent) outline-none text-[13px] text-white px-1 ml-1 w-full pointer-events-auto"
                    onClick={e => e.stopPropagation()}
                  />
                ) : (
                  <span className="truncate">{node.name}</span>
                )}
              </div>
            </div>

            {node.isFolder && node.isOpen && renderTree(node.id, depth + 1)}

            {creatingNode.active && creatingNode.parentId === node.id && (
              <div style={{ paddingLeft: `${((depth + 1) * 14) + 8}px` }} className="flex items-center gap-1.5 py-[3px] pr-2">
                {getFileIcon(localNewNodeName || 'new', creatingNode.type === 'folder', false)}
                <input
                  autoFocus
                  value={localNewNodeName}
                  onChange={e => setLocalNewNodeName(e.target.value)}
                  onBlur={() => setCreatingNode({ active: false, type: 'file', parentId: null })}
                  onKeyDown={e => { if (e.key === 'Enter') commitNewNode(); if (e.key === 'Escape') setCreatingNode({ active: false, type: 'file', parentId: null }); }}
                  className="bg-(--vscode-input-bg) border border-(--vscode-accent) outline-none text-[13px] text-white px-1 ml-1 w-full"
                />
              </div>
            )}
          </React.Fragment>
        ))}
      </div>
    );
  };

  const renderContent = () => {
    switch (activeSidebarTab) {
      case 'search':
        return <SearchSidebar />;
      case 'extensions':
        return <ExtensionsSidebar />;
      case 'ai':
        return <AiCopilotSidebar />;
      case 'git':
        return <GitSidebar />;
      case 'explorer':
        return (
          <div className="flex flex-col h-full overflow-hidden">
            <div className="flex items-center justify-between px-2 py-1 hover:bg-[#2a2d2e] cursor-pointer group">
              <span className="text-[11px] font-bold tracking-wide uppercase flex items-center gap-1">
                <ChevronDown size={14} /> HACKATHON
              </span>
              <div className="opacity-0 group-hover:opacity-100 flex items-center gap-1">
                <button onClick={(e) => { e.stopPropagation(); setCreatingNode({ active: true, type: 'file', parentId: null }); setLocalNewNodeName(''); }} className="p-0.5 hover:bg-[#454545] rounded" title="New File">
                  <FileCode size={14} className="text-[#cccccc]" />
                </button>
                <button onClick={(e) => { e.stopPropagation(); setCreatingNode({ active: true, type: 'folder', parentId: null }); setLocalNewNodeName(''); }} className="p-0.5 hover:bg-[#454545] rounded" title="New Folder...">
                  <FolderIcon size={14} className="text-[#cccccc]" />
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto pb-4">
              {renderTree(null)}

              {creatingNode.active && creatingNode.parentId === null && (
                <div className="flex items-center gap-1.5 py-[3px] pr-2 pl-6">
                  {getFileIcon(localNewNodeName || 'new', creatingNode.type === 'folder', false)}
                  <input
                    autoFocus
                    value={localNewNodeName}
                    onChange={e => setLocalNewNodeName(e.target.value)}
                    onBlur={() => setCreatingNode({ active: false, type: 'file', parentId: null })}
                    onKeyDown={e => { if (e.key === 'Enter') commitNewNode(); if (e.key === 'Escape') setCreatingNode({ active: false, type: 'file', parentId: null }); }}
                    className="bg-(--vscode-input-bg) border border-(--vscode-accent) outline-none text-[13px] text-white px-1 ml-1 w-full"
                  />
                </div>
              )}
            </div>

            <div className="flex-1 border-t border-(--vscode-border) flex flex-col min-h-0 relative">
              <div className="px-4 py-2 text-[11px] uppercase tracking-wider text-[#cccccc] font-bold flex justify-between items-center">
                <span>Live Session</span>
                <span className="text-[9px] bg-[#007acc20] text-[#007acc] px-1.5 py-0.5 rounded border border-[#007acc40]">
                  {isHost ? 'HOST' : userRole.toUpperCase()}
                </span>
              </div>
              <div className="flex flex-col px-2 gap-1 overflow-y-auto pb-4">
                {awarenessUsers.map((u, idx) => {
                  const isMe = u.name === username;
                  return (
                    <div
                      key={idx}
                      onContextMenu={(e) => handleUserContextMenu(e, u)}
                      className="group flex flex-col p-2 rounded-lg hover:bg-[#2a2d2e] transition-colors cursor-context-menu"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2 text-[13px] text-[#cccccc] truncate">
                          <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: u.color }} />
                          <span className="truncate">{u.name}{isMe ? ' (You)' : ''}</span>
                        </div>
                        <span className={`text-[10px] px-1.5 py-0.5 rounded ${u.role === 'admin' ? 'bg-[#007acc40] text-[#007acc]' :
                          u.role === 'editor' ? 'bg-[#23863620] text-[#238636]' :
                            'bg-[#f4433620] text-[#f44336]'
                          }`}>
                          {u.role || 'editor'}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* User Context Menu */}
              {userMenu.visible && (
                <div
                  className="fixed bg-[#252526] border border-[#454545] shadow-xl py-1 min-w-[160px] rounded-md z-50 text-[13px]"
                  style={{ top: userMenu.y, left: userMenu.x }}
                >
                  <div className="px-3 py-1.5 text-[#858585] border-b border-[#454545] text-[11px] uppercase font-bold truncate">
                    {userMenu.targetUser?.name}
                  </div>
                  <div
                    className="px-3 py-1.5 text-[#cccccc] hover:bg-[#007acc] hover:text-white cursor-pointer"
                    onClick={() => handleRoleChange('admin')}
                  >
                    Make Admin
                  </div>
                  <div
                    className="px-3 py-1.5 text-[#cccccc] hover:bg-[#007acc] hover:text-white cursor-pointer"
                    onClick={() => handleRoleChange('editor')}
                  >
                    Make Editor
                  </div>
                  <div
                    className="px-3 py-1.5 text-[#cccccc] hover:bg-[#007acc] hover:text-white cursor-pointer"
                    onClick={() => handleRoleChange('viewer')}
                  >
                    Make Viewer
                  </div>
                  <div className="h-px bg-[#454545] my-1" />
                  <div
                    className="px-3 py-1.5 text-[#f44336] hover:bg-[#f44336] hover:text-white cursor-pointer"
                    onClick={() => handleRoleChange('rejected')}
                  >
                    Kick from Workspace
                  </div>
                </div>
              )}
            </div>
          </div>
        );
      case 'chat':
        return (
          <div className="flex flex-col h-full overflow-hidden px-4">
            <div className="flex-1 overflow-y-auto space-y-4 mb-4 pr-1 mt-2">
              {messages.map((msg, i) => {
                const isMe = msg.username === username;
                return (
                  <div key={i} className={`flex flex-col text-[13px] ${isMe ? 'items-end' : 'items-start'}`}>
                    <span className="font-bold mb-1 text-[11px]" style={{ color: msg.color || '#007acc' }}>
                      {msg.username}
                    </span>
                    <div className={`px-3 py-2 rounded-xl max-w-[90%] shadow-sm ${isMe ? 'bg-[#007acc] text-white rounded-tr-none' : 'bg-[#2d2d2d] text-[#e0e0e0] border border-[#404040] rounded-tl-none'}`}>
                      {msg.text}
                    </div>
                    {msg.timestamp && (
                      <span className="text-[9px] text-[#777] mt-1">
                        {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
            <div className="bg-[#252526] border border-[#454545] rounded-lg p-1 flex mb-4 shadow-inner focus-within:border-[#007acc] transition-colors duration-200">
              <input
                value={currMessage}
                onChange={(e) => setCurrMessage(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && currMessage.trim()) {
                    const myColor = awarenessUsers.find(u => u.name === username)?.color || '#007acc';
                    sendMessage(currMessage, myColor);
                    setCurrMessage('');
                  }
                }}
                placeholder="Type a message..."
                className="bg-transparent flex-1 border-none outline-none text-[13px] text-[#cccccc] px-3 py-1.5"
              />
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="sidebar bg-(--vscode-sidebar) border-r border-(--vscode-border) flex flex-col h-full overflow-hidden">
      <div className="px-4 py-3 text-[11px] uppercase tracking-wider text-[#cccccc]">
        {activeSidebarTab === 'explorer' ? 'Explorer' : 
         activeSidebarTab === 'search' ? 'Search' : 
         activeSidebarTab === 'ai' ? 'DevSync AI' : 
         activeSidebarTab === 'git' ? 'Source Control' : 'Chat'}
      </div>
      {renderContent()}
    </div>
  );
};
