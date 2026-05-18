import React, { useState, useRef, useEffect } from 'react';
import { Bot, Send, Sparkles, Code2, AlertCircle } from 'lucide-react';
import { useEditor } from '../../context/EditorContext';

export const AiCopilotSidebar = () => {
  const { files, activeFileId, handleEditorChange } = useEditor();
  const [messages, setMessages] = useState([
    { role: 'assistant', content: 'Hi! I am DevSync AI. I can read your workspace, find bugs, and write code for you. What do you need help with?' }
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef(null);

  const activeFile = files.find(f => f.id === activeFileId);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  const handleSend = () => {
    if (!input.trim()) return;
    
    const userMessage = input.trim();
    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setInput('');
    setIsTyping(true);

    // Simulated AI response for the hackathon prototype
    setTimeout(() => {
      let aiResponse = "I'm analyzing your request...";
      
      if (userMessage.toLowerCase().includes('fix') || userMessage.toLowerCase().includes('bug')) {
        aiResponse = `I looked at \`${activeFile?.name || 'your code'}\` and found a potential issue. Try wrapping that logic in a try-catch block to handle the error properly.`;
      } else if (userMessage.toLowerCase().includes('explain')) {
        aiResponse = `In \`${activeFile?.name || 'this file'}\`, you are using React hooks to manage state. The useEffect hook ensures that your component re-renders when dependencies change.`;
      } else if (userMessage.toLowerCase().includes('generate') || userMessage.toLowerCase().includes('create')) {
        aiResponse = `Here is the generated boilerplate for \`${activeFile?.name || 'the component'}\`. I've added a basic structure using TailwindCSS.`;
      } else {
        aiResponse = `I've analyzed the workspace context. You are currently editing \`${activeFile?.name || 'a file'}\`. How can I help you write this better?`;
      }

      setMessages(prev => [...prev, { role: 'assistant', content: aiResponse }]);
      setIsTyping(false);
    }, 1500);
  };

  return (
    <div className="flex flex-col h-full bg-[#252526] text-[#cccccc]">
      <div className="px-4 py-2 flex items-center gap-2 border-b border-[#3c3c3c]">
        <Bot size={16} className="text-[#a89eff]" />
        <span className="uppercase text-[11px] font-semibold text-[#858585]">DevSync Copilot</span>
        <span className="ml-auto text-[9px] bg-[#7c6fff20] text-[#a89eff] px-1.5 py-0.5 rounded border border-[#7c6fff40]">
          BETA
        </span>
      </div>

      <div className="flex-1 overflow-y-auto p-3 space-y-4">
        {messages.map((msg, idx) => (
          <div key={idx} className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
            <div className={`flex items-start gap-2 max-w-[95%] ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
              <div className="w-6 h-6 shrink-0 rounded flex items-center justify-center mt-0.5" 
                   style={{ background: msg.role === 'user' ? '#0e639c' : '#333' }}>
                {msg.role === 'user' ? <span className="text-[10px] text-white font-bold">U</span> : <Sparkles size={12} className="text-[#a89eff]" />}
              </div>
              <div className={`px-3 py-2 text-[13px] rounded-lg shadow-sm ${
                msg.role === 'user' 
                  ? 'bg-[#0e639c] text-white rounded-tr-sm' 
                  : 'bg-[#2d2d2d] text-[#cccccc] border border-[#3c3c3c] rounded-tl-sm'
              }`}>
                {msg.content}
              </div>
            </div>
          </div>
        ))}
        {isTyping && (
          <div className="flex items-start gap-2">
            <div className="w-6 h-6 shrink-0 rounded bg-[#333] flex items-center justify-center mt-0.5">
              <Sparkles size={12} className="text-[#a89eff] animate-pulse" />
            </div>
            <div className="px-3 py-2 text-[13px] rounded-lg bg-[#2d2d2d] border border-[#3c3c3c] text-[#858585] rounded-tl-sm">
              <span className="animate-pulse">Thinking...</span>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="p-3 border-t border-[#3c3c3c] bg-[#252526]">
        {activeFile && (
          <div className="flex items-center gap-1.5 text-[10px] text-[#858585] mb-2 px-1">
            <Code2 size={12} />
            Context: <span className="text-[#007acc] truncate">{activeFile.name}</span>
          </div>
        )}
        <div className="flex items-center bg-[#3c3c3c] rounded-md border border-[#454545] focus-within:border-[#007acc] transition-colors p-1 pr-2">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
            placeholder="Ask DevSync AI..."
            className="w-full bg-transparent border-none outline-none text-[13px] text-white px-2 py-1.5 resize-none min-h-[36px] max-h-[120px]"
            rows={1}
          />
          <button 
            onClick={handleSend}
            disabled={!input.trim() || isTyping}
            className={`p-1.5 rounded transition-colors shrink-0 ${
              input.trim() && !isTyping ? 'bg-[#007acc] text-white hover:bg-[#005f9e]' : 'text-[#858585] cursor-not-allowed'
            }`}
          >
            <Send size={14} />
          </button>
        </div>
        <div className="text-[9px] text-[#858585] text-center mt-2 flex items-center justify-center gap-1">
          <AlertCircle size={10} /> AI can make mistakes. Check its code.
        </div>
      </div>
    </div>
  );
};
