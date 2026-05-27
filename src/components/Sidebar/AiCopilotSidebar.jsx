import React, { useState, useRef, useEffect } from 'react';
import { Bot, Send, Sparkles, Code2, AlertCircle, Key, Check } from 'lucide-react';
import { useEditor } from '../../context/EditorContext';

export const AiCopilotSidebar = () => {
  const { files, activeFileId, handleEditorChange } = useEditor();
  const [apiKey, setApiKey] = useState(localStorage.getItem('devsync_gemini_key') || '');
  const [showKeyInput, setShowKeyInput] = useState(!localStorage.getItem('devsync_gemini_key'));
  const [keyInput, setKeyInput] = useState(apiKey);
  
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

  const saveApiKey = () => {
    if (keyInput.trim()) {
      localStorage.setItem('devsync_gemini_key', keyInput.trim());
      setApiKey(keyInput.trim());
      setShowKeyInput(false);
    }
  };

  const handleSend = async () => {
    if (!input.trim()) return;
    if (!apiKey) {
      setShowKeyInput(true);
      return;
    }
    
    const userMessage = input.trim();
    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setInput('');
    setIsTyping(true);

    try {
      const fileContext = activeFile ? `Context: You are helping the user edit the file named '${activeFile.name}'.\nThe current file content is:\n\`\`\`\n${activeFile.content}\n\`\`\`\n\n` : '';
      const prompt = `${fileContext}User's request: ${userMessage}\n\nPlease provide a clear, concise, and helpful response. If providing code, use markdown code blocks.`;

      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${apiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }]
        })
      });

      const data = await response.json();
      
      if (data.error) {
        throw new Error(data.error.message || 'API Error');
      }

      const aiResponse = data.candidates?.[0]?.content?.parts?.[0]?.text || "I couldn't generate a response.";
      setMessages(prev => [...prev, { role: 'assistant', content: aiResponse }]);

    } catch (error) {
      console.error(error);
      setMessages(prev => [...prev, { role: 'assistant', content: `❌ Error: ${error.message}. Please check your API key and try again.` }]);
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-[#252526] text-[#cccccc]">
      <div className="px-4 py-2 flex items-center gap-2 border-b border-[#3c3c3c]">
        <Bot size={16} className="text-[#a89eff]" />
        <span className="uppercase text-[11px] font-semibold text-[#858585]">DevSync Copilot</span>
        <button 
          onClick={() => setShowKeyInput(!showKeyInput)}
          className="ml-auto text-[10px] text-[#858585] hover:text-white flex items-center gap-1"
        >
          <Key size={12} /> API Key
        </button>
      </div>

      {showKeyInput && (
        <div className="p-3 bg-[#2d2d2d] border-b border-[#3c3c3c] text-[12px]">
          <div className="mb-2 text-[#cccccc]">Enter your free Google Gemini API Key to enable real AI responses.</div>
          <div className="flex gap-2">
            <input 
              type="password"
              value={keyInput}
              onChange={e => setKeyInput(e.target.value)}
              placeholder="AIzaSy..."
              className="flex-1 bg-[#1e1e1e] border border-[#3c3c3c] focus:border-[#007acc] outline-none px-2 py-1 rounded text-white"
            />
            <button 
              onClick={saveApiKey}
              className="bg-[#007acc] hover:bg-[#005f9e] text-white px-2 py-1 rounded flex items-center gap-1"
            >
              <Check size={14} /> Save
            </button>
          </div>
          <div className="mt-2 text-[10px] text-[#858585]">
            Get a free key from <a href="https://aistudio.google.com/" target="_blank" rel="noreferrer" className="text-[#007acc] hover:underline">Google AI Studio</a>.
          </div>
        </div>
      )}

      <div className="flex-1 overflow-y-auto p-3 space-y-4">
        {messages.map((msg, idx) => (
          <div key={idx} className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
            <div className={`flex items-start gap-2 max-w-[95%] ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
              <div className="w-6 h-6 shrink-0 rounded flex items-center justify-center mt-0.5" 
                   style={{ background: msg.role === 'user' ? '#0e639c' : '#333' }}>
                {msg.role === 'user' ? <span className="text-[10px] text-white font-bold">U</span> : <Sparkles size={12} className="text-[#a89eff]" />}
              </div>
              <div className={`px-3 py-2 text-[13px] rounded-lg shadow-sm whitespace-pre-wrap ${
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
            placeholder={apiKey ? "Ask DevSync AI..." : "Enter API Key above first..."}
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
