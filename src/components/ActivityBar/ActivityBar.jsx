import React from 'react';
import { Files, Search, Blocks, MessageSquare, Bot, Phone, Video, User as UserIcon, Settings, GitBranch } from 'lucide-react';
import { useEditor } from '../../context/EditorContext';
import { motion } from 'framer-motion';

export const ActivityBar = () => {
  const { activeSidebarTab, setActiveSidebarTab, startVoiceCall, incomingCall, username } = useEditor();

  const hasIncomingCall = incomingCall && incomingCall.caller !== username;

  const startVideoCall = () => {
    if (typeof window.__devSyncStartVideoCall === 'function') {
      window.__devSyncStartVideoCall();
    }
  };

  const iconClass = (tab) =>
    `cursor-pointer ${activeSidebarTab === tab
      ? 'text-white border-l-2 border-white ml-[2px] pl-[2px]'
      : 'text-[#858585] hover:text-white'
    }`;

  return (
    <div className="activity-bar bg-(--vscode-activity-bar) flex flex-col items-center py-4 gap-6">
      <Files onClick={() => setActiveSidebarTab('explorer')} className={iconClass('explorer')} size={24} strokeWidth={1.5} />
      <Search onClick={() => setActiveSidebarTab('search')} className={iconClass('search')} size={24} strokeWidth={1.5} />
      <Blocks onClick={() => setActiveSidebarTab('extensions')} className={iconClass('extensions')} size={24} strokeWidth={1.5} />
      <MessageSquare onClick={() => setActiveSidebarTab('chat')} className={iconClass('chat')} size={24} strokeWidth={1.5} />
      <Bot onClick={() => setActiveSidebarTab('ai')} className={iconClass('ai')} size={24} strokeWidth={1.5} />
      <GitBranch onClick={() => setActiveSidebarTab('git')} className={iconClass('git')} size={24} strokeWidth={1.5} title="Source Control" />

      {/* ── Voice Call ── */}
      <div className="relative">
        <motion.div whileHover={{ scale: 1.15 }} whileTap={{ scale: 0.9 }}
          onClick={startVoiceCall} title="Start Voice Call"
          className="cursor-pointer text-[#858585] hover:text-white">
          <Phone size={24} strokeWidth={1.5} />
        </motion.div>
        {hasIncomingCall && (
          <motion.div
            animate={{ scale: [1, 1.4, 1] }}
            transition={{ repeat: Infinity, duration: 0.9 }}
            className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-[#238636] border-2 border-[#252526]"
          />
        )}
      </div>

      {/* ── Video Call ── */}
      <motion.div whileHover={{ scale: 1.15 }} whileTap={{ scale: 0.9 }}
        onClick={startVideoCall} title="Start Video Call"
        className="cursor-pointer text-[#858585] hover:text-[#4caf50]">
        <Video size={24} strokeWidth={1.5} />
      </motion.div>

      <div className="flex-1" />
      <UserIcon className="text-[#858585] hover:text-white cursor-pointer" size={24} strokeWidth={1.5} />
      <Settings className="text-[#858585] hover:text-white cursor-pointer" size={24} strokeWidth={1.5} />
    </div>
  );
};
