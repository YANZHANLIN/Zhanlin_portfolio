import React, { useState, useRef, useEffect } from 'react';
import { Send, Sparkles, X, Bot, User } from 'lucide-react';
import { generateProjectResponse } from '../services/geminiService';
import { ChatMessage } from '../types';

interface AIChatProps {
  projectTitle: string;
  aiContext: string;
}

const AIChat: React.FC<AIChatProps> = ({ projectTitle, aiContext }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      role: 'model',
      text: `Hello. I am the AI interface for ${projectTitle}. Ask me anything about the design concepts or technical specifications.`,
      timestamp: Date.now()
    }
  ]);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isOpen]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      text: input,
      timestamp: Date.now()
    };

    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);

    try {
      const responseText = await generateProjectResponse(input, aiContext, messages);
      const aiMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'model',
        text: responseText,
        timestamp: Date.now()
      };
      setMessages(prev => [...prev, aiMsg]);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-8 right-8 z-50 flex items-center gap-2 px-4 py-3 rounded-full glass-panel text-blue-400 hover:text-white transition-all hover:scale-105 shadow-[0_0_20px_rgba(59,130,246,0.3)]"
      >
        <Sparkles size={20} />
        <span className="font-semibold text-sm">Ask AI Architect</span>
      </button>
    );
  }

  return (
    <div className="fixed bottom-8 right-8 w-full max-w-sm z-50 flex flex-col rounded-2xl glass-panel shadow-2xl overflow-hidden border border-blue-500/30 animate-in slide-in-from-bottom-10 fade-in duration-300">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-blue-500/20 bg-black/40">
        <div className="flex items-center gap-2 text-blue-400">
          <Sparkles size={18} />
          <span className="font-bold text-sm tracking-wider">GEMINI INTEGRATION</span>
        </div>
        <button onClick={() => setIsOpen(false)} className="text-gray-400 hover:text-white">
          <X size={18} />
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 p-4 h-80 overflow-y-auto custom-scrollbar bg-black/20 flex flex-col gap-4">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}
          >
            <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${msg.role === 'model' ? 'bg-gradient-to-br from-blue-600 to-indigo-900' : 'bg-gray-700'}`}>
              {msg.role === 'model' ? <Bot size={16} className="text-white" /> : <User size={16} className="text-white" />}
            </div>
            <div className={`p-3 rounded-2xl max-w-[80%] text-sm leading-relaxed ${
              msg.role === 'model' 
                ? 'bg-blue-900/20 text-blue-100 border border-blue-500/20 rounded-tl-none' 
                : 'bg-gray-800 text-gray-200 rounded-tr-none'
            }`}>
              {msg.text}
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="flex gap-3">
             <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-600 to-indigo-900 flex items-center justify-center shrink-0">
               <Bot size={16} className="text-white" />
             </div>
             <div className="flex items-center gap-1 p-3 bg-blue-900/10 rounded-2xl rounded-tl-none">
               <span className="w-2 h-2 bg-blue-400 rounded-full animate-bounce"></span>
               <span className="w-2 h-2 bg-blue-400 rounded-full animate-bounce delay-75"></span>
               <span className="w-2 h-2 bg-blue-400 rounded-full animate-bounce delay-150"></span>
             </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-4 bg-black/40 border-t border-blue-500/20">
        <div className="relative">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            placeholder="Ask about materials, structure..."
            className="w-full bg-gray-900/50 border border-gray-700 rounded-xl py-3 px-4 pr-12 text-sm text-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all placeholder-gray-500"
          />
          <button
            onClick={handleSend}
            disabled={!input.trim() || isLoading}
            className="absolute right-2 top-1/2 -translate-y-1/2 p-2 text-blue-400 hover:text-white disabled:opacity-50 transition-colors"
          >
            <Send size={16} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default AIChat;