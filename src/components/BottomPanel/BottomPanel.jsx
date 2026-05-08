import React from 'react';
import { useEditor } from '../../context/EditorContext';
import { BottomPanelTabs } from './BottomPanelTabs';
import { TerminalView } from './TerminalView';
import { PreviewView } from './PreviewView';
import { EmptyView } from './EmptyView';

export const BottomPanel = () => {
  const { bottomPanelTab } = useEditor();

  const renderContent = () => {
    switch (bottomPanelTab) {
      case 'terminal':
        return <TerminalView />;
      case 'preview':
        return <PreviewView />;
      default:
        return <EmptyView tabName={bottomPanelTab} />;
    }
  };

  return (
    <div className="bottom-panel bg-[#1e1e1e] flex flex-col h-full relative border-t border-[#2d2d2d]">
      <BottomPanelTabs />
      <div className="flex-1 overflow-hidden min-h-0 flex flex-col">
        {renderContent()}
      </div>
    </div>
  );
};
