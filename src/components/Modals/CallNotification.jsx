import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Phone, PhoneOff, MicOff, PhoneCall } from 'lucide-react';

// ─── CallNotification ─────────────────────────────────────────────────────────
// Shows a stylish floating card when someone is ringing (like the AccessRequestModal)
export const CallNotification = ({ incomingCall, username, onAccept, onAcceptMuted, onReject }) => {
  if (!incomingCall || incomingCall.caller === username) return null;

  const callerName = incomingCall.caller;

  return (
    <AnimatePresence>
      <div className="fixed top-6 right-6 z-9999 flex flex-col gap-3 w-80">
        <motion.div
          initial={{ opacity: 0, x: 60, scale: 0.9 }}
          animate={{ opacity: 1, x: 0, scale: 1 }}
          exit={{ opacity: 0, scale: 0.85, x: 60 }}
          transition={{ type: 'spring', stiffness: 260, damping: 24 }}
          className="bg-[#1e1e1e] border border-[#238636] rounded-xl p-4 shadow-2xl overflow-hidden relative"
        >
          {/* Left accent bar */}
          <div className="absolute top-0 left-0 w-1 h-full bg-[#238636] rounded-l-xl" />

          {/* Pulsing glow ring */}
          <motion.div
            className="absolute top-0 left-0 w-full h-full rounded-xl pointer-events-none"
            animate={{ boxShadow: ['0 0 0px #23863630', '0 0 24px #23863650', '0 0 0px #23863630'] }}
            transition={{ repeat: Infinity, duration: 1.6 }}
          />

          <div className="flex items-start gap-3 relative">
            {/* Animated phone icon */}
            <div className="bg-[#23863620] p-2.5 rounded-xl shrink-0">
              <motion.div
                animate={{ rotate: [0, -15, 15, -10, 10, 0] }}
                transition={{ repeat: Infinity, duration: 1.2, ease: 'easeInOut' }}
              >
                <PhoneCall size={20} className="text-[#238636]" />
              </motion.div>
            </div>

            <div className="flex-1 min-w-0">
              <h4 className="text-white text-sm font-bold">Incoming Call</h4>
              <p className="text-[#858585] text-xs truncate mb-3">
                <span className="text-[#2ea043] font-semibold">{callerName}</span> is ringing…
              </p>

              {/* Action buttons */}
              <div className="flex gap-2">
                {/* Reject */}
                <motion.button
                  whileHover={{ scale: 1.07 }}
                  whileTap={{ scale: 0.93 }}
                  onClick={onReject}
                  title="Reject"
                  className="flex-1 flex items-center justify-center gap-1.5 bg-[#e51400] hover:bg-[#c50000] text-white text-[11px] font-bold py-2 rounded-lg transition-colors"
                >
                  <PhoneOff size={14} />
                  Reject
                </motion.button>

                {/* Accept & Mute */}
                <motion.button
                  whileHover={{ scale: 1.07 }}
                  whileTap={{ scale: 0.93 }}
                  onClick={onAcceptMuted}
                  title="Accept with mic muted"
                  className="flex-1 flex items-center justify-center gap-1.5 bg-[#2d2d2d] hover:bg-[#404040] text-white border border-[#555] text-[11px] font-bold py-2 rounded-lg transition-colors"
                >
                  <MicOff size={14} />
                  Muted
                </motion.button>

                {/* Accept */}
                <motion.button
                  whileHover={{ scale: 1.07 }}
                  whileTap={{ scale: 0.93 }}
                  onClick={onAccept}
                  title="Accept call"
                  className="flex-1 flex items-center justify-center gap-1.5 bg-[#238636] hover:bg-[#2ea043] text-white text-[11px] font-bold py-2 rounded-lg transition-colors"
                >
                  <Phone size={14} />
                  Accept
                </motion.button>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
