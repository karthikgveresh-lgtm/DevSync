import React from 'react';
import { useEditor } from '../../context/EditorContext';
import { X, ChevronUp } from 'lucide-react';

export const BottomPanelTabs = () => {
  const { bottomPanelTab, setBottomPanelTab, setIsBottomPanelOpen } = useEditor();

  const tabs = [
    { id: 'problems', label: 'Problems', hasError: true },
    { id: 'output', label: 'Output' },
    { id: 'debug', label: 'Debug Console' },
    { id: 'terminal', label: 'Terminal' },
    { id: 'ports', label: 'Ports' },
    { id: 'preview', label: 'Preview' }
  ];

  return (
    <div className="flex bg-[#1e1e1e] h-[35px] shrink-0 w-full relative group/tabs">
      <div className="flex-1 flex overflow-x-auto no-scrollbar border-b border-[#2d2d2d]">
        {tabs.map((tab) => {
          const isActive = bottomPanelTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setBottomPanelTab(tab.id)}
              className={`relative flex items-center gap-1.5 px-3 h-full text-[12px] cursor-pointer tracking-wide ${isActive ? 'text-white' : 'text-[#cccccc] hover:text-white'
                }`}
            >
              {isActive && <div className="absolute top-0 left-0 w-full h-1px bg-[#007acc]" />}
              <span>{tab.label}</span>
              {tab.hasError && (
                <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#f14c4c', flexShrink: 0, display: 'inline-block' }} />
              )}
            </button>
          );
        })}
        <div className="flex-1 bg-[#1e1e1e]" />
      </div>

      {/* Global Bottom Panel Toolbar (far right) */}
      <div className="absolute right-4 top-0 h-full flex items-center gap-2">
        <button className="text-[#cccccc] hover:text-white p-0.5 rounded cursor-pointer" title="Maximize Panel Size">
          <ChevronUp size={16} />
        </button>
        <button
          className="text-[#cccccc] hover:text-white p-0.5 rounded cursor-pointer"
          onClick={() => setIsBottomPanelOpen(false)}
          title="Close Panel"
        >
          <X size={16} />
        </button>
      </div>
    </div>
  );
};
