import React, { useState } from 'react';
import { Hexagon } from 'lucide-react';
import { DropdownMenu } from './DropdownMenu';
import { useEditor } from '../../context/EditorContext';

export const TopBar = () => {
  const { 
    setCreatingNode, isBottomPanelOpen, setIsBottomPanelOpen, 
    openFile, openFolder, setIsSidebarOpen, runCode, 
    setBottomPanelTab, setActiveSidebarTab 
  } = useEditor();
  
  const [openMenu, setOpenMenu] = useState(null);

  const toggleMenu = (menuName) => {
    if (openMenu === menuName) setOpenMenu(null);
    else setOpenMenu(menuName);
  };

  const closeAll = () => setOpenMenu(null);

  const fileMenu = [
    { label: 'New Text File', shortcut: 'Ctrl+N', action: () => setCreatingNode({ active: true, type: 'file', parentId: null }) },
    { label: 'New File...', shortcut: 'Ctrl+Alt+Windows+N', action: () => setCreatingNode({ active: true, type: 'file', parentId: null }) },
    { label: 'New Window', shortcut: 'Ctrl+Shift+N' },
    { separator: true },
    { label: 'Open File...', shortcut: 'Ctrl+O', action: openFile },
    { label: 'Open Folder...', shortcut: 'Ctrl+K Ctrl+O', action: openFolder },
    { label: 'Open Recent', submenu: true },
    { separator: true },
    { label: 'Save', shortcut: 'Ctrl+S' },
    { label: 'Save As...', shortcut: 'Ctrl+Shift+S' },
    { label: 'Save All', shortcut: 'Ctrl+K S' },
    { separator: true },
    { label: 'Exit' }
  ];

  const editMenu = [
    { label: 'Undo', shortcut: 'Ctrl+Z' },
    { label: 'Redo', shortcut: 'Ctrl+Y' },
    { separator: true },
    { label: 'Cut', shortcut: 'Ctrl+X' },
    { label: 'Copy', shortcut: 'Ctrl+C' },
    { label: 'Paste', shortcut: 'Ctrl+V' },
    { separator: true },
    { label: 'Find', shortcut: 'Ctrl+F' },
    { label: 'Replace', shortcut: 'Ctrl+H' }
  ];

  const selectionMenu = [
    { label: 'Select All', shortcut: 'Ctrl+A' },
    { label: 'Expand Selection', shortcut: 'Shift+Alt+RightArrow' },
    { label: 'Shrink Selection', shortcut: 'Shift+Alt+LeftArrow' },
    { separator: true },
    { label: 'Copy Line Up', shortcut: 'Shift+Alt+UpArrow' },
    { label: 'Copy Line Down', shortcut: 'Shift+Alt+DownArrow' },
    { label: 'Move Line Up', shortcut: 'Alt+UpArrow' },
    { label: 'Move Line Down', shortcut: 'Alt+DownArrow' }
  ];

  const terminalMenu = [
    { label: 'New Terminal', shortcut: 'Ctrl+Shift+`', action: () => setIsBottomPanelOpen(true) },
    { label: 'Split Terminal', shortcut: 'Ctrl+Shift+5' },
    { separator: true },
    { label: 'Run Active File', action: () => setIsBottomPanelOpen(true) }
  ];

  const viewMenu = [
    { label: 'Command Palette...', shortcut: 'Ctrl+Shift+P' },
    { separator: true },
    { label: 'Appearance', submenu: true },
    { label: 'Editor Layout', submenu: true },
    { separator: true },
    { label: 'Explorer', shortcut: 'Ctrl+Shift+E', action: () => { setIsSidebarOpen(true); setActiveSidebarTab('explorer'); } },
    { label: 'Search', shortcut: 'Ctrl+Shift+F', action: () => { setIsSidebarOpen(true); setActiveSidebarTab('search'); } },
    { label: 'Output', action: () => { setIsBottomPanelOpen(true); setBottomPanelTab('output'); } },
    { label: 'Terminal', shortcut: 'Ctrl+`', action: () => { setIsBottomPanelOpen(true); setBottomPanelTab('terminal'); } }
  ];

  const runMenu = [
    { label: 'Start Debugging', shortcut: 'F5', action: runCode },
    { label: 'Run Without Debugging', shortcut: 'Ctrl+F5', action: runCode },
    { label: 'Stop Debugging', shortcut: 'Shift+F5' },
    { separator: true },
    { label: 'Install Extensions', action: () => setActiveSidebarTab('extensions') }
  ];

  return (
    <div className="title-bar h-[30px] bg-[#1e1e1e] flex items-center px-3 border-b border-[#2d2d2d] select-none text-[13px] text-[#cccccc]">
      <img src="/logo.png" alt="TeamKode" style={{ height: 18, marginRight: 8, marginLeft: 4 }} />
      
      <DropdownMenu label="File" items={fileMenu} isOpen={openMenu === 'File'} onToggle={() => toggleMenu('File')} closeAll={closeAll} />
      <DropdownMenu label="Edit" items={editMenu} isOpen={openMenu === 'Edit'} onToggle={() => toggleMenu('Edit')} closeAll={closeAll} />
      <DropdownMenu label="Selection" items={selectionMenu} isOpen={openMenu === 'Selection'} onToggle={() => toggleMenu('Selection')} closeAll={closeAll} />
      <DropdownMenu label="View" items={viewMenu} isOpen={openMenu === 'View'} onToggle={() => toggleMenu('View')} closeAll={closeAll} />
      <div className="px-2 py-1 hover:bg-[#2a2d2e] rounded cursor-pointer transition-colors" onClick={closeAll}>Go</div>
      <DropdownMenu label="Run" items={runMenu} isOpen={openMenu === 'Run'} onToggle={() => toggleMenu('Run')} closeAll={closeAll} />
      <DropdownMenu label="Terminal" items={terminalMenu} isOpen={openMenu === 'Terminal'} onToggle={() => toggleMenu('Terminal')} closeAll={closeAll} />
      <div className="px-2 py-1 hover:bg-[#2a2d2e] rounded cursor-pointer transition-colors" onClick={closeAll}>Help</div>
    </div>
  );
};
