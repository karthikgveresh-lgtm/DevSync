import React from 'react';
import { motion } from 'framer-motion';
import { ShieldAlert, Loader2, XCircle } from 'lucide-react';

export const WaitingRoom = ({ email, status, onRetry }) => {
  return (
    <div className="fixed inset-0 bg-[#0a0a0a] flex items-center justify-center z-100 px-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-md w-full bg-[#1e1e1e] border border-[#333] rounded-2xl p-8 shadow-2xl text-center"
      >
        <div className="flex justify-center mb-6">
          <div className="relative">
            <div className="absolute inset-0 bg-[#007acc] blur-2xl opacity-20 rounded-full animate-pulse"></div>
            <ShieldAlert size={64} className="text-[#007acc] relative z-10" />
          </div>
        </div>

        <h1 className="text-2xl font-bold text-white mb-2">Security Authorization</h1>
        <p className="text-[#858585] mb-8 text-sm">
          Hello <span className="text-white font-medium">{email}</span>, your request to join the workspace is being reviewed.
        </p>

        {status === 'pending' && (
          <div className="flex flex-col items-center py-6">
            <Loader2 size={32} className="text-[#007acc] animate-spin mb-4" />
            <p className="text-white font-medium animate-pulse">Waiting for host approval...</p>
            <p className="text-[#666] text-xs mt-2 italic">The workspace owner needs to grant you access.</p>
          </div>
        )}

        {status === 'rejected' && (
          <div className="flex flex-col items-center py-6">
            <XCircle size={48} className="text-[#f44336] mb-4" />
            <p className="text-white font-medium">Access Denied</p>
            <p className="text-[#858585] text-sm mt-2 mb-6">The host has declined your request to join.</p>
            <button
              onClick={onRetry}
              className="w-full bg-[#333] hover:bg-[#444] text-white py-3 rounded-xl transition-all font-bold"
            >
              Go Back
            </button>
          </div>
        )}
      </motion.div>
    </div>
  );
};
