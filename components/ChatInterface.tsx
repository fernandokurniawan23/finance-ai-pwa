// src/components/ChatInterface.tsx
"use client";

import { useChat } from "ai/react";
import { useEffect, useState, useRef } from "react";
import { getFinancialContext } from "@/lib/context-loader";
import { db } from "@/lib/db";
import { Send, Sparkles, User, Bot, BarChart3, Lightbulb, Trash2 } from "lucide-react";

export default function ChatInterface() {
  const [context, setContext] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // 1. Configure Vercel AI SDK
  const { 
    messages, 
    input, 
    handleInputChange, 
    handleSubmit, 
    isLoading, 
    setMessages, 
    setInput 
  } = useChat({
    api: "/api/chat",
    onFinish: async (message) => {
      // Persist assistant response to local DB
      await db.chats.add({
        role: 'assistant',
        content: message.content,
        createdAt: Date.now()
      });
    },
  });

  // 2. Hydrate History & Context on Mount
  useEffect(() => {
    const initializeChat = async () => {
      // Load financial context for RAG
      const financeData = await getFinancialContext();
      setContext(financeData);

      // Load chat history from IndexedDB
      const history = await db.chats.orderBy("createdAt").toArray();
      
      if (history.length > 0) {
        // Transform DB schema to AI SDK schema
        setMessages(history.map(h => ({
          id: h.id ? h.id.toString() : Math.random().toString(),
          role: h.role as 'user' | 'assistant',
          content: h.content
        })));
      }
    };
    initializeChat();
  }, [setMessages]);

  // 3. Auto-scroll behavior
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  // 4. Message Submission Handler
  const handleSend = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!input.trim()) return;

    // Persist user message to local DB immediately
    await db.chats.add({
      role: 'user',
      content: input,
      createdAt: Date.now()
    });
    
    // Dispatch to API with Data Context
    handleSubmit(e, {
      options: {
        body: { dataContext: context },
      },
    });
  };

  // 5. Clear History Handler
  const clearChat = async () => {
    if (confirm("Hapus semua riwayat percakapan?")) {
      await db.chats.clear();
      setMessages([]);
    }
  };

  // 6. Suggestion Chip Handler
  const handleSuggestion = (text: string) => {
    setInput(text);
  };

  return (
    <div className="flex flex-col h-[calc(100vh-140px)] bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
      
      {/* Header */}
      <div className="bg-white border-b border-gray-200 p-4 flex items-center justify-between shadow-sm z-10">
        <div className="flex items-center gap-3">
          <div className="bg-black p-2 rounded-lg">
            <Sparkles className="w-4 h-4 text-white" />
          </div>
          <div>
            <h2 className="font-bold text-gray-900 text-sm">Financial Advisor</h2>
            <p className="text-[10px] text-gray-500">AI Professional Assistant</p>
          </div>
        </div>

        {messages.length > 0 && (
          <button 
            onClick={clearChat}
            className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-full transition-all"
            title="Clear Chat History"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Chat Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
        {messages.length === 0 && (
          <div className="text-center text-gray-400 mt-10 p-6">
            <div className="bg-white p-4 rounded-full inline-block shadow-sm mb-4">
              <Bot className="w-8 h-8 text-gray-800" />
            </div>
            <p className="text-sm font-semibold text-gray-700">Halo! Ada yang bisa saya bantu?</p>
            <p className="text-xs mt-1 text-gray-500 max-w-xs mx-auto">
              Saya siap menganalisis data keuangan Anda secara profesional.
            </p>
            
            {/* Suggestions */}
            <div className="mt-6 flex flex-wrap justify-center gap-2">
               <button 
                 onClick={() => handleSuggestion("Analisa pengeluaran saya bulan ini")}
                 className="text-xs bg-white border border-gray-200 px-4 py-2 rounded-full hover:bg-gray-100 hover:border-black transition-all flex items-center gap-2 text-gray-700 shadow-sm"
               >
                 <BarChart3 className="w-3 h-3" />
                 <span>Analisa Pengeluaran</span>
               </button>
               
               <button 
                 onClick={() => handleSuggestion("Berikan saran penghematan")}
                 className="text-xs bg-white border border-gray-200 px-4 py-2 rounded-full hover:bg-gray-100 hover:border-black transition-all flex items-center gap-2 text-gray-700 shadow-sm"
               >
                 <Lightbulb className="w-3 h-3" />
                 <span>Saran Hemat</span>
               </button>
            </div>
          </div>
        )}

        {messages.map((m) => (
          <div
            key={m.id}
            className={`flex items-start gap-3 ${
              m.role === "user" ? "flex-row-reverse" : "flex-row"
            }`}
          >
            <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 border ${
              m.role === "user" ? "bg-gray-100 border-gray-200" : "bg-black border-black"
            }`}>
              {m.role === "user" ? (
                <User className="w-4 h-4 text-gray-600" />
              ) : (
                <Sparkles className="w-4 h-4 text-white" />
              )}
            </div>

            <div
              className={`p-3.5 rounded-2xl text-sm max-w-[85%] leading-relaxed shadow-sm ${
                m.role === "user"
                  ? "bg-black text-white rounded-tr-none"
                  : "bg-white text-gray-800 border border-gray-200 rounded-tl-none"
              }`}
            >
              <p className="whitespace-pre-wrap font-medium">{m.content}</p>
            </div>
          </div>
        ))}
        
        {isLoading && (
          <div className="flex items-center gap-2 text-xs text-gray-500 ml-12 bg-white px-3 py-2 rounded-full shadow-sm w-fit border border-gray-100">
            <div className="flex gap-1">
              <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce [animation-delay:-0.3s]"></span>
              <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce [animation-delay:-0.15s]"></span>
              <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce"></span>
            </div>
            <span>Menganalisa data...</span>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <form onSubmit={handleSend} className="p-3 bg-white border-t border-gray-200 flex gap-2">
        <input
          className="flex-1 p-3 bg-gray-50 text-black border border-gray-200 rounded-xl text-sm focus:ring-1 focus:ring-black focus:border-black focus:outline-none placeholder:text-gray-400 transition-all"
          value={input}
          onChange={handleInputChange}
          placeholder="Tanyakan sesuatu..."
          disabled={isLoading}
        />
        <button
          type="submit"
          disabled={isLoading || !input.trim()}
          className="p-3 bg-black text-white rounded-xl disabled:opacity-50 hover:bg-gray-800 transition-colors shadow-sm flex items-center justify-center"
        >
          <Send className="w-4 h-4" />
        </button>
      </form>
    </div>
  );
}