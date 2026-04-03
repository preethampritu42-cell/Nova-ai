/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Send, 
  Image as ImageIcon, 
  X, 
  Bot, 
  User, 
  Loader2, 
  Sparkles,
  Trash2,
  PlusCircle,
  MessageSquare
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { Message, sendMessageStream } from './services/geminiService';

export default function App() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [images, setImages] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [streamingContent, setStreamingContent] = useState('');
  
  const scrollRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, streamingContent]);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    Array.from(files).forEach(file => {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImages(prev => [...prev, reader.result as string]);
      };
      reader.readAsDataURL(file);
    });
  };

  const removeImage = (index: number) => {
    setImages(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if ((!input.trim() && images.length === 0) || isLoading) return;

    const userMessage: Message = {
      role: 'user',
      content: input,
      images: images.length > 0 ? [...images] : undefined
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setImages([]);
    setIsLoading(true);
    setStreamingContent('');

    try {
      const stream = sendMessageStream([...messages, userMessage]);
      let fullResponse = '';
      
      for await (const chunk of stream) {
        fullResponse += chunk;
        setStreamingContent(fullResponse);
      }

      setMessages(prev => [...prev, { role: 'model', content: fullResponse }]);
      setStreamingContent('');
    } catch (error) {
      console.error('Error:', error);
      setMessages(prev => [...prev, { 
        role: 'model', 
        content: "I'm sorry, I encountered an error. Please check your API key and try again." 
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const clearChat = () => {
    setMessages([]);
    setStreamingContent('');
  };

  return (
    <div className="flex h-screen bg-slate-50 font-sans">
      {/* Sidebar */}
      <aside className="hidden md:flex flex-col w-64 bg-white border-r border-slate-200">
        <div className="p-4 border-b border-slate-100">
          <div className="flex items-center gap-2 font-display font-bold text-xl text-brand-600">
            <Sparkles className="w-6 h-6" />
            <span>Nova AI</span>
          </div>
        </div>
        
        <div className="flex-1 overflow-y-auto p-3 space-y-2">
          <button 
            onClick={clearChat}
            className="w-full flex items-center gap-2 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <PlusCircle className="w-4 h-4" />
            New Chat
          </button>
          
          <div className="pt-4">
            <h3 className="px-3 text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Recent</h3>
            {messages.length > 0 ? (
              <div className="px-3 py-2 flex items-center gap-2 text-sm text-slate-600 bg-brand-50 border border-brand-100 rounded-lg">
                <MessageSquare className="w-4 h-4 text-brand-500" />
                <span className="truncate">{messages[0].content || "Image analysis"}</span>
              </div>
            ) : (
              <p className="px-3 text-xs text-slate-400 italic">No recent chats</p>
            )}
          </div>
        </div>

        <div className="p-4 border-t border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-brand-500 flex items-center justify-center text-white font-bold text-xs">
              P
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-slate-900 truncate">Preetham</p>
              <p className="text-xs text-slate-500 truncate">Free Plan</p>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Chat Area */}
      <main className="flex-1 flex flex-col relative">
        {/* Header */}
        <header className="h-16 flex items-center justify-between px-6 bg-white/80 backdrop-blur-md border-b border-slate-200 sticky top-0 z-10">
          <div className="flex items-center gap-2 md:hidden">
            <Sparkles className="w-5 h-5 text-brand-600" />
            <span className="font-display font-bold text-lg">Nova</span>
          </div>
          <div className="hidden md:block">
            <h2 className="font-display font-semibold text-slate-800">Nova Assistant</h2>
          </div>
          <div className="flex items-center gap-2">
            <button 
              onClick={clearChat}
              className="p-2 text-slate-400 hover:text-red-500 transition-colors"
              title="Clear Chat"
            >
              <Trash2 className="w-5 h-5" />
            </button>
          </div>
        </header>

        {/* Messages */}
        <div 
          ref={scrollRef}
          className="flex-1 overflow-y-auto p-6 space-y-8 scroll-smooth"
        >
          {messages.length === 0 && !streamingContent && (
            <div className="h-full flex flex-col items-center justify-center text-center max-w-md mx-auto space-y-6">
              <div className="w-20 h-20 bg-brand-100 rounded-3xl flex items-center justify-center text-brand-600 animate-pulse">
                <Bot className="w-10 h-10" />
              </div>
              <div>
                <h1 className="font-display font-bold text-2xl text-slate-900 mb-2">How can I help you today?</h1>
                <p className="text-slate-500">I'm your AI assistant, ready to help with writing, coding, analysis, or just a friendly chat.</p>
              </div>
              <div className="grid grid-cols-2 gap-3 w-full">
                {["Write a poem", "Explain quantum physics", "Code a React hook", "Analyze an image"].map((suggestion) => (
                  <button 
                    key={suggestion}
                    onClick={() => setInput(suggestion)}
                    className="p-3 text-sm text-slate-600 bg-white border border-slate-200 rounded-xl hover:border-brand-300 hover:bg-brand-50 transition-all text-left"
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
            </div>
          )}

          <AnimatePresence initial={false}>
            {messages.map((msg, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className={`flex gap-4 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}
              >
                <div className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 ${
                  msg.role === 'user' ? 'bg-brand-600 text-white' : 'bg-slate-200 text-slate-600'
                }`}>
                  {msg.role === 'user' ? <User className="w-6 h-6" /> : <Bot className="w-6 h-6" />}
                </div>
                <div className={`flex flex-col max-w-[80%] ${msg.role === 'user' ? 'items-end' : ''}`}>
                  {msg.images && msg.images.length > 0 && (
                    <div className="flex flex-wrap gap-2 mb-2">
                      {msg.images.map((img, i) => (
                        <img 
                          key={i} 
                          src={img} 
                          alt="Uploaded" 
                          className="max-w-xs rounded-lg border border-slate-200 shadow-sm"
                          referrerPolicy="no-referrer"
                        />
                      ))}
                    </div>
                  )}
                  <div className={`p-4 rounded-2xl shadow-sm ${
                    msg.role === 'user' 
                      ? 'bg-brand-600 text-white rounded-tr-none' 
                      : 'bg-white border border-slate-200 rounded-tl-none'
                  }`}>
                    <div className={msg.role === 'user' ? '' : 'markdown-body'}>
                      {msg.role === 'user' ? (
                        <p className="whitespace-pre-wrap">{msg.content}</p>
                      ) : (
                        <ReactMarkdown>{msg.content}</ReactMarkdown>
                      )}
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}

            {streamingContent && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex gap-4"
              >
                <div className="w-10 h-10 rounded-2xl bg-slate-200 text-slate-600 flex items-center justify-center shrink-0">
                  <Bot className="w-6 h-6" />
                </div>
                <div className="flex flex-col max-w-[80%]">
                  <div className="p-4 bg-white border border-slate-200 rounded-2xl rounded-tl-none shadow-sm markdown-body">
                    <ReactMarkdown>{streamingContent}</ReactMarkdown>
                  </div>
                </div>
              </motion.div>
            )}

            {isLoading && !streamingContent && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex gap-4"
              >
                <div className="w-10 h-10 rounded-2xl bg-slate-200 text-slate-600 flex items-center justify-center shrink-0">
                  <Loader2 className="w-6 h-6 animate-spin" />
                </div>
                <div className="p-4 bg-white border border-slate-200 rounded-2xl rounded-tl-none shadow-sm">
                  <div className="flex gap-1">
                    <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce [animation-delay:-0.3s]"></span>
                    <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce [animation-delay:-0.15s]"></span>
                    <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce"></span>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Input Area */}
        <div className="p-6 bg-gradient-to-t from-slate-50 via-slate-50 to-transparent">
          <form 
            onSubmit={handleSubmit}
            className="max-w-4xl mx-auto bg-white rounded-2xl border border-slate-200 shadow-lg p-2 focus-within:border-brand-400 focus-within:ring-2 focus-within:ring-brand-100 transition-all"
          >
            {images.length > 0 && (
              <div className="flex flex-wrap gap-2 p-2 mb-2 border-b border-slate-100">
                {images.map((img, idx) => (
                  <div key={idx} className="relative group">
                    <img 
                      src={img} 
                      className="w-16 h-16 object-cover rounded-lg border border-slate-200" 
                      referrerPolicy="no-referrer"
                    />
                    <button 
                      type="button"
                      onClick={() => removeImage(idx)}
                      className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}
            
            <div className="flex items-end gap-2">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="p-3 text-slate-400 hover:text-brand-500 hover:bg-brand-50 rounded-xl transition-colors"
              >
                <ImageIcon className="w-6 h-6" />
              </button>
              <input 
                type="file" 
                ref={fileInputRef} 
                onChange={handleImageUpload} 
                multiple 
                accept="image/*" 
                className="hidden" 
              />
              
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSubmit(e);
                  }
                }}
                placeholder="Message Nova..."
                rows={1}
                className="flex-1 p-3 bg-transparent border-none focus:ring-0 resize-none text-slate-700 min-h-[48px] max-h-32"
              />
              
              <button
                type="submit"
                disabled={(!input.trim() && images.length === 0) || isLoading}
                className={`p-3 rounded-xl transition-all ${
                  (!input.trim() && images.length === 0) || isLoading
                    ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                    : 'bg-brand-600 text-white hover:bg-brand-700 shadow-md hover:shadow-lg'
                }`}
              >
                {isLoading ? <Loader2 className="w-6 h-6 animate-spin" /> : <Send className="w-6 h-6" />}
              </button>
            </div>
          </form>
          <p className="text-center text-[10px] text-slate-400 mt-3">
            Nova can make mistakes. Check important info. Powered by Gemini.
          </p>
        </div>
      </main>
    </div>
  );
}
