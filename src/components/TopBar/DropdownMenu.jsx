import React, { useState, useRef, useEffect } from 'react';
import { ChevronRight } from 'lucide-react';

export const DropdownMenu = ({ label, items, isOpen, onToggle, closeAll }) => {
  const menuRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        closeAll();
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen, closeAll]);

  return (
    <div className="relative" ref={menuRef}>
      <div
        className={`menu-item ${isOpen ? 'bg-[rgba(255,255,255,0.1)]' : ''}`}
        onClick={onToggle}
        onMouseEnter={() => {
          // If any menu is open, hovering over another one should open it
          if (document.querySelector('.menu-open')) {
            onToggle();
          }
        }}
      >
        {label}
      </div>

      {isOpen && (
        <div className="absolute left-0 top-full mt-1 z-50 bg-[#252526] border border-[#454545] shadow-lg py-1 min-w-[240px] text-[13px] menu-open">
          {items.map((item, idx) => {
            if (item.separator) {
              return <div key={idx} className="h-px bg-[#454545] my-1 mx-2" />;
            }
            return (
              <div
                key={idx}
                className="px-6 py-1.5 flex justify-between items-center hover:bg-[#04395e] cursor-pointer text-[#cccccc] hover:text-white"
                onClick={() => {
                  if (item.action) item.action();
                  closeAll();
                }}
              >
                <span>{item.label}</span>
                {item.shortcut && <span className="text-[#858585] text-[11px] ml-4">{item.shortcut}</span>}
                {item.submenu && <ChevronRight size={14} className="text-[#858585] ml-4" />}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
