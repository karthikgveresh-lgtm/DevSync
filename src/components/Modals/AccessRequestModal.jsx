import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { UserPlus, Check, X, ShieldCheck } from 'lucide-react';

export const AccessRequestModal = ({ requests, onApprove, onReject }) => {
  if (requests.length === 0) return null;

  return (
    <div className="fixed top-6 right-6 z-1000 flex flex-col gap-3 w-80">
      <AnimatePresence>
        {requests.map((req) => (
          <motion.div
            key={req.username}
            initial={{ opacity: 0, x: 50, scale: 0.9 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8, x: 50 }}
            className="bg-[#1e1e1e] border border-[#007acc] rounded-xl p-4 shadow-2xl overflow-hidden relative"
          >
            <div className="absolute top-0 left-0 w-1 h-full bg-[#007acc]"></div>
            <div className="flex items-start gap-3">
              <div className="bg-[#007acc20] p-2 rounded-lg">
                <UserPlus size={20} className="text-[#007acc]" />
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="text-white text-sm font-bold truncate">Join Request</h4>
                <p className="text-[#858585] text-xs truncate mb-3">{req.username}</p>
                <div className="flex gap-2">
                  <button
                    onClick={() => onApprove(req.username)}
                    className="flex-1 bg-[#238636] hover:bg-[#2ea043] text-white text-[11px] font-bold py-1.5 rounded-md flex items-center justify-center gap-1 transition-colors"
                  >
                    <Check size={14} /> Approve
                  </button>
                  <button
                    onClick={() => onReject(req.username)}
                    className="flex-1 bg-[#333] hover:bg-[#444] text-white text-[11px] font-bold py-1.5 rounded-md flex items-center justify-center gap-1 transition-colors"
                  >
                    <X size={14} /> Deny
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
};
