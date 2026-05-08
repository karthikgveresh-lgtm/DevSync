import React from 'react';
import { GitBranch, Radio, Bell, CheckCircle2 } from 'lucide-react';
import { useEditor } from '../../context/EditorContext';

export const StatusBar = () => {
  const { activeFile } = useEditor();

  return (
    <div className="status-bar h-[22px] bg-[#007acc] flex items-center justify-between px-3 text-[12px] text-white select-none">
      <div className="flex items-center gap-4 h-full">
        <div className="flex items-center gap-1 hover:bg-[rgba(255,255,255,0.1)] px-1 cursor-pointer h-full">
          <GitBranch size={12} />
          <span>main*</span>
        </div>
        <div className="flex items-center gap-1 hover:bg-[rgba(255,255,255,0.1)] px-1 cursor-pointer h-full">
          <Radio size={12} />
          <span>0</span>
        </div>
      </div>
      
      <div className="flex items-center gap-4 h-full">
        <div className="hover:bg-[rgba(255,255,255,0.1)] px-1 cursor-pointer h-full flex items-center">
          Ln 1, Col 1
        </div>
        <div className="hover:bg-[rgba(255,255,255,0.1)] px-1 cursor-pointer h-full flex items-center">
          Spaces: 2
        </div>
        <div className="hover:bg-[rgba(255,255,255,0.1)] px-1 cursor-pointer h-full flex items-center">
          UTF-8
        </div>
        <div className="hover:bg-[rgba(255,255,255,0.1)] px-1 cursor-pointer h-full flex items-center">
          {activeFile.type.toUpperCase()}
        </div>
        <div className="hover:bg-[rgba(255,255,255,0.1)] px-1 cursor-pointer h-full flex items-center">
          <CheckCircle2 size={12} className="mr-1" />
          Prettier
        </div>
        <div className="hover:bg-[rgba(255,255,255,0.1)] px-1 cursor-pointer h-full flex items-center">
          <Bell size={12} />
        </div>
      </div>
    </div>
  );
};
