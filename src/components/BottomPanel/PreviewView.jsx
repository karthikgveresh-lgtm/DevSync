import React, { useEffect, useState } from 'react';
import { Globe } from 'lucide-react';
import { useEditor } from '../../context/EditorContext';
import { useCollaboration } from '../../context/CollaborationContext';

export const PreviewView = () => {
  const { activeFileId, activeFile } = useEditor();
  const { ydoc } = useCollaboration();
  const [liveDoc, setLiveDoc] = useState('');

  useEffect(() => {
    if (!ydoc || activeFile.type !== 'html') return;

    const yText = ydoc.getText(`file_content_${activeFileId}`);

    // Set initial content
    setLiveDoc(yText.toString());

    let debounceTimer;
    const observer = () => {
      clearTimeout(debounceTimer);
      debounceTimer = setTimeout(() => {
        setLiveDoc(yText.toString());
      }, 300);
    };

    yText.observe(observer);
    return () => {
      yText.unobserve(observer);
      clearTimeout(debounceTimer);
    };
  }, [ydoc, activeFileId, activeFile.type]);

  return (
    <div className="flex-1 flex flex-col bg-white overflow-hidden">
      <div className="bg-[#f3f3f3] p-1.5 flex gap-2 border-b border-[#cccccc] items-center text-[12px] text-[#333] shrink-0">
        <Globe size={14} /> localhost:5173/preview
      </div>
      <iframe title="preview" className="flex-1 w-full h-full border-none" srcDoc={liveDoc} />
    </div>
  );
};
