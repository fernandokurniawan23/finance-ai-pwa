"use client";

import { useChat } from "ai/react";
import { useEffect, useRef } from "react";
import { Send, Bot, User, Loader2 } from "lucide-react";
import { getFinancialContext } from "../lib/context-loader";

export default function ChatInterface() {
  const { messages, input, handleInputChange, handleSubmit, isLoading } = useChat({
    api: '/api/chat',
  });
  
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll ke bawah saat ada pesan baru
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Wrapper untuk inject data keuangan saat submit
  const onSubmitWithContext = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    // Ambil data terbaru dari Dexie
    const context = await getFinancialContext();

    // Kirim ke API sebagai "body" tambahan
    handleSubmit(e, {
      options: {
        body: {
          dataContext: context,
        },
      },
    });
  };

  return (
    <div className="flex flex-col h-[calc(100vh-140px)]">
      
      {/* Area Chat */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-gray-400 text-sm text-center opacity-70">
            <Bot className="w-12 h-12 mb-2 text-gray-300" />
            <p>Halo! Saya sudah baca data keuanganmu.</p>
            <p className="mt-1">"Kenapa saya boros minggu ini?"</p>
          </div>
        )}

        {messages.map((m) => (
          <div
            key={m.id}
            className={`flex gap-3 ${
              m.role === "user" ? "flex-row-reverse" : "flex-row"
            }`}
          >
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                m.role === "user" ? "bg-black" : "bg-purple-600"
              }`}
            >
              {m.role === "user" ? (
                <User className="w-4 h-4 text-white" />
              ) : (
                <Bot className="w-4 h-4 text-white" />
              )}
            </div>

            <div
              className={`px-4 py-2 rounded-2xl max-w-[85%] text-sm leading-relaxed shadow-sm whitespace-pre-wrap ${
                m.role === "user"
                  ? "bg-gray-100 text-gray-900 rounded-tr-none"
                  : "bg-purple-50 text-purple-900 rounded-tl-none border border-purple-100"
              }`}
            >
              {m.content}
            </div>
          </div>
        ))}

        {isLoading && (
          <div className="flex items-center gap-2 text-gray-400 text-xs ml-12">
            <Loader2 className="w-3 h-3 animate-spin" />
            <span>Menganalisa data...</span>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Form */}
      <form
        onSubmit={onSubmitWithContext}
        className="p-3 bg-white border-t border-gray-100 flex gap-2"
      >
        <input
          className="flex-1 bg-gray-50 border border-gray-200 rounded-full px-4 py-3 text-sm text-black focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all placeholder:text-gray-400"
          value={input}
          onChange={handleInputChange}
          placeholder="Tanya soal keuanganmu..."
        />
        <button
          type="submit"
          disabled={isLoading || !input.trim()}
          className="bg-black text-white p-3 rounded-full hover:bg-gray-800 disabled:opacity-50 transition-colors shadow-md"
        >
          <Send className="w-4 h-4" />
        </button>
      </form>
    </div>
  );
}