// src/components/ChatInterface.tsx
"use client";

import { useChat } from "ai/react";
import { useEffect, useState, useRef } from "react";
import { getFinancialContext } from "@/lib/context-loader";
// Tambahkan BarChart3 dan Lightbulb untuk tombol saran
import { Send, Sparkles, User, Bot, BarChart3, Lightbulb } from "lucide-react";

export default function ChatInterface() {
  const [context, setContext] = useState("");
  
  // 1. Load Data Keuangan saat komponen muncul
  useEffect(() => {
    getFinancialContext().then(setContext);
  }, []);

  const { messages, input, handleInputChange, handleSubmit, isLoading } = useChat({
    api: "/api/chat",
  });

  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // 2. Handle Submit dengan Tipe Data yang Benar
  const handleSend = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    handleSubmit(e, {
      options: {
        body: {
          dataContext: context,
        },
      },
    });
  };

  return (
    <div className="flex flex-col h-[calc(100vh-140px)] bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
      
      {/* Header Chat */}
      <div className="bg-black p-4 flex items-center gap-3 shadow-md z-10">
        <div className="bg-white/20 p-2 rounded-full">
          <Sparkles className="w-4 h-4 text-white" />
        </div>
        <div>
          <h2 className="font-bold text-white text-sm">AI Financial Advisor</h2>
          <p className="text-[10px] text-gray-300">Powered by Llama 3</p>
        </div>
      </div>

      {/* Area Chat Bubble */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
        {messages.length === 0 && (
          <div className="text-center text-gray-400 mt-10 p-6">
            <Sparkles className="w-10 h-10 mx-auto mb-3 text-gray-300" />
            <p className="text-sm font-semibold text-gray-600">Belum ada percakapan.</p>
            <p className="text-xs mt-1 text-gray-400">Tanyakan analisis keuanganmu di sini.</p>
            
            {/* Suggestion Buttons (CLEAN ICON - NO EMOJI) */}
            <div className="mt-6 flex flex-wrap justify-center gap-2">
               <button 
                 onClick={() => handleInputChange({ target: { value: "Analisa pengeluaranku bulan ini" } } as any)}
                 className="text-xs bg-white border border-gray-200 px-4 py-2 rounded-full hover:bg-gray-100 hover:border-gray-300 transition-all flex items-center gap-2 text-gray-700 shadow-sm"
               >
                 <BarChart3 className="w-3 h-3" />
                 <span>Analisa Pengeluaran</span>
               </button>
               
               <button 
                 onClick={() => handleInputChange({ target: { value: "Bagaimana cara berhemat?" } } as any)}
                 className="text-xs bg-white border border-gray-200 px-4 py-2 rounded-full hover:bg-gray-100 hover:border-gray-300 transition-all flex items-center gap-2 text-gray-700 shadow-sm"
               >
                 <Lightbulb className="w-3 h-3" />
                 <span>Tips Hemat</span>
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
            {/* Avatar */}
            <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
              m.role === "user" ? "bg-gray-200" : "bg-black"
            }`}>
              {m.role === "user" ? (
                <User className="w-4 h-4 text-gray-600" />
              ) : (
                <Sparkles className="w-4 h-4 text-white" />
              )}
            </div>

            {/* Bubble Chat */}
            <div
              className={`p-3 rounded-2xl text-sm max-w-[85%] leading-relaxed shadow-sm ${
                m.role === "user"
                  ? "bg-black text-white rounded-tr-none"
                  : "bg-white text-gray-800 border border-gray-200 rounded-tl-none"
              }`}
            >
              <p className="whitespace-pre-wrap">{m.content}</p>
            </div>
          </div>
        ))}
        
        {/* Loading Indicator */}
        {isLoading && (
          <div className="flex items-center gap-2 text-xs text-gray-400 ml-12 animate-pulse">
            <Bot className="w-3 h-3" />
            <span>Sedang menganalisa...</span>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <form onSubmit={handleSend} className="p-3 bg-white border-t border-gray-200 flex gap-2">
        <input
          className="flex-1 p-3 bg-gray-50 text-black border border-gray-200 rounded-lg text-sm focus:ring-1 focus:ring-black focus:border-black focus:outline-none placeholder:text-gray-400 transition-all"
          value={input}
          onChange={handleInputChange}
          placeholder="Ketik pesan..."
          disabled={isLoading}
        />
        <button
          type="submit"
          disabled={isLoading || !input.trim()}
          className="p-3 bg-black text-white rounded-lg disabled:opacity-50 hover:bg-gray-800 transition-colors shadow-sm"
        >
          <Send className="w-4 h-4" />
        </button>
      </form>
    </div>
  );
}