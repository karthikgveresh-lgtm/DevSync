import React from 'react';

export const EmptyView = ({ tabName }) => {
  return (
    <div className="flex-1 flex items-center justify-center text-[#858585] text-[13px] bg-[#1e1e1e]">
      Nothing to show in {tabName}
    </div>
  );
};
