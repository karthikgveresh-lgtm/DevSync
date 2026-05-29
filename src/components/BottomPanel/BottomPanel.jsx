import React from 'react';
import { useEditor } from '../../context/EditorContext';
import { BottomPanelTabs } from './BottomPanelTabs';
import { TerminalView } from './TerminalView';
import { PreviewView } from './PreviewView';
import { EmptyView } from './EmptyView';

export const BottomPanel = () => {
  const { bottomPanelTab } = useEditor();

  return (
    <div className="bottom-panel bg-[#1e1e1e] flex flex-col h-full relative border-t border-[#2d2d2d]">
      <BottomPanelTabs />
      <div className="flex-1 overflow-hidden min-h-0 flex flex-col">
        <div style={{ display: bottomPanelTab === 'terminal' ? 'flex' : 'none', flex: 1, height: '100%' }}>
          <TerminalView />
        </div>
        <div style={{ display: bottomPanelTab === 'preview' ? 'flex' : 'none', flex: 1, height: '100%' }}>
          <PreviewView />
        </div>
        {(!['terminal', 'preview'].includes(bottomPanelTab)) && (
          <EmptyView tabName={bottomPanelTab} />
        )}
      </div>
    </div>
  );
};
