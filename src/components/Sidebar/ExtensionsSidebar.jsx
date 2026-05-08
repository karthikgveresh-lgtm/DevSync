import React from 'react';
import { Search, Filter, MoreHorizontal, Download, Check, Settings, LayoutGrid } from 'lucide-react';

const extensions = [
  { id: 'clangd', name: 'clangd', description: 'C/C++ completion, navigation...', publisher: 'llvm-vs-code-extensions', icon: 'https://raw.githubusercontent.com/vscode-icons/vscode-icons/master/icons/file_type_cpp.svg', status: 'installed', count: '20' },
  { id: 'container', name: 'Container Tools', description: 'Makes it easy to create, mana...', publisher: 'ms-azuretools', icon: 'https://raw.githubusercontent.com/vscode-icons/vscode-icons/master/icons/file_type_docker.svg', status: 'installed' },
  { id: 'debugger', name: 'Debugger for Java', description: 'A lightweight Java debugger...', publisher: 'vscjava', icon: 'https://raw.githubusercontent.com/vscode-icons/vscode-icons/master/icons/file_type_java.svg', status: 'installed' },
  { id: 'docker', name: 'Docker', description: 'Makes it easy to create, mana...', publisher: 'ms-azuretools', icon: 'https://raw.githubusercontent.com/vscode-icons/vscode-icons/master/icons/file_type_docker.svg', status: 'installed' },
  { id: 'es7', name: 'ES7+ React/Redu...', description: 'Extensions for React, React-N...', publisher: 'dsznajder', icon: 'https://raw.githubusercontent.com/vscode-icons/vscode-icons/master/icons/file_type_reactjs.svg', status: 'installed' },
];

export const ExtensionsSidebar = () => {
  return (
    <div className="flex flex-col h-full bg-[#252526] text-[#cccccc]">
      <div className="px-4 py-2 flex items-center justify-between">
        <span className="uppercase text-[11px] font-semibold text-[#858585]">Extensions</span>
        <div className="flex gap-2">
          <button className="text-[#858585] hover:text-white"><Filter size={14} /></button>
          <button className="text-[#858585] hover:text-white"><MoreHorizontal size={14} /></button>
        </div>
      </div>

      <div className="px-2 mb-2">
        <div className="relative">
          <input
            type="text"
            placeholder="Search Extensions in Market..."
            className="w-full bg-[#3c3c3c] border border-[#3c3c3c] focus:border-[#007acc] outline-none pl-2 pr-8 py-1 text-[13px] text-white"
          />
          <button className="absolute right-1 top-1 p-0.5 text-[#858585]">
            <LayoutGrid size={14} />
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        <div className="px-2">
          <div className="flex items-center gap-1 py-1 text-[11px] font-bold uppercase text-[#858585] mt-2 mb-1">
            <span className="cursor-pointer flex items-center gap-1"><Check size={12} /> Installed</span>
            <span className="ml-auto bg-[#3c3c3c] px-1.5 rounded-full">20</span>
          </div>

          {extensions.map(ext => (
            <div key={ext.id} className="flex gap-3 p-2 hover:bg-[#2a2d2e] cursor-pointer group rounded">
              <div className="w-10 h-10 shrink-0 bg-[#333] rounded flex items-center justify-center p-1">
                <img src={ext.icon} alt={ext.name} className="w-full h-full object-contain" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <span className="text-[13px] font-semibold text-[#3794de] truncate">{ext.name}</span>
                  <Settings size={14} className="opacity-0 group-hover:opacity-100 text-[#858585]" />
                </div>
                <div className="text-[11px] text-[#858585] truncate">{ext.description}</div>
                <div className="text-[11px] text-[#858585] truncate opacity-60">{ext.publisher}</div>
              </div>
            </div>
          ))}
        </div>

        <div className="px-2 mt-4">
          <div className="flex items-center gap-1 py-1 text-[11px] font-bold uppercase text-[#858585] mb-1">
            <span className="cursor-pointer flex items-center gap-1"><Download size={12} /> Recommended</span>
            <span className="ml-auto bg-[#3c3c3c] px-1.5 rounded-full">8</span>
          </div>
          <div className="flex gap-3 p-2 hover:bg-[#2a2d2e] cursor-pointer group rounded">
            <div className="w-10 h-10 shrink-0 bg-[#333] rounded flex items-center justify-center p-1 font-bold text-[#007acc]">M</div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <span className="text-[13px] font-semibold text-[#3794de] truncate">markdownlint</span>
                <button className="bg-[#0e639c] text-white text-[11px] px-1.5 rounded">Install</button>
              </div>
              <div className="text-[11px] text-[#858585] truncate">Markdown linting and style c...</div>
              <div className="text-[11px] text-[#858585] truncate opacity-60">DavidAnson</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
