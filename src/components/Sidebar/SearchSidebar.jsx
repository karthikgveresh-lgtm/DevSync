import React, { useState } from 'react';
import { Search as SearchIcon, ChevronRight, ChevronDown, Replace, ArrowDown, CaseSensitive, WholeWord, Regex } from 'lucide-react';
import { useEditor } from '../../context/EditorContext';

export const SearchSidebar = () => {
  const { searchQuery, handleSearch, searchResults, openFileById } = useEditor();
  const [replaceQuery, setReplaceQuery] = useState('');
  const [isReplaceOpen, setIsReplaceOpen] = useState(true);

  return (
    <div className="flex flex-col h-full bg-[#252526] text-[#cccccc]">
      <div className="px-4 py-2 flex items-center justify-between">
        <span className="uppercase text-[11px] font-semibold text-[#858585]">Search</span>
        <div className="flex gap-2">
          <button className="text-[#858585] hover:text-white"><SearchIcon size={14} /></button>
          <button className="text-[#858585] hover:text-white"><Replace size={14} /></button>
        </div>
      </div>
      
      <div className="px-2 space-y-1">
        <div className="flex items-start gap-1">
          <div 
            onClick={() => setIsReplaceOpen(!isReplaceOpen)}
            className="mt-2 cursor-pointer text-[#858585] hover:text-white"
          >
            {isReplaceOpen ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
          </div>
          <div className="flex-1 space-y-1">
            <div className="relative group">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => handleSearch(e.target.value)}
                placeholder="Search"
                className="w-full bg-[#3c3c3c] border border-[#3c3c3c] focus:border-[#007acc] outline-none pl-2 pr-20 py-1 text-[13px] text-white"
              />
              <div className="absolute right-1 top-1 flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                <button title="Match Case" className="p-0.5 hover:bg-[#454545] rounded text-[#858585]"><CaseSensitive size={14} /></button>
                <button title="Match Whole Word" className="p-0.5 hover:bg-[#454545] rounded text-[#858585]"><WholeWord size={14} /></button>
                <button title="Use Regular Expression" className="p-0.5 hover:bg-[#454545] rounded text-[#858585]"><Regex size={14} /></button>
              </div>
            </div>

            {isReplaceOpen && (
              <div className="relative">
                <input
                  type="text"
                  value={replaceQuery}
                  onChange={(e) => setReplaceQuery(e.target.value)}
                  placeholder="Replace"
                  className="w-full bg-[#3c3c3c] border border-[#3c3c3c] focus:border-[#007acc] outline-none pl-2 pr-8 py-1 text-[13px] text-white"
                />
                <button title="Replace All" className="absolute right-1 top-1 p-0.5 hover:bg-[#454545] rounded text-[#858585]">
                  <ArrowDown size={14} />
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto mt-4">
        {searchResults.length > 0 ? (
          <div className="px-2">
            <div className="flex items-center gap-1 py-1 text-[13px] font-bold border-b border-[#2d2d2d] mb-1 pb-1">
              <ChevronDown size={16} />
              <span>{searchResults.length} results in {new Set(searchResults.map(r => r.fileId)).size} files</span>
            </div>
            {searchResults.map((result, idx) => (
              <div 
                key={idx}
                onClick={() => openFileById(result.fileId)}
                className="pl-6 py-1 hover:bg-[#2a2d2e] cursor-pointer group border-l border-transparent hover:border-[#007acc]"
              >
                <div className="text-[12px] text-[#858585] group-hover:text-white truncate">
                  <span className="text-[#007acc] mr-2 font-mono">Ln {result.line}:</span>
                  {result.text}
                </div>
                <div className="text-[11px] text-[#858585] opacity-60 truncate">{result.fileName}</div>
              </div>
            ))}
          </div>
        ) : searchQuery ? (
          <div className="px-4 py-2 text-[13px] text-[#858585]">No results found in your workspace.</div>
        ) : (
          <div className="px-4 py-8 flex flex-col items-center justify-center text-center opacity-40">
            <SearchIcon size={48} className="mb-4" />
            <div className="text-[13px]">Search across files</div>
          </div>
        )}
      </div>
    </div>
  );
};
