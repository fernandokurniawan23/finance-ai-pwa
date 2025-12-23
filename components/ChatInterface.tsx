// src/components/ChatInterface.tsx
"use client";

import { useChat } from "ai/react";
import { useEffect, useState, useRef, forwardRef, useImperativeHandle } from "react";
import { getFinancialContext } from "@/lib/context-loader";
import { db } from "@/lib/db";
import { Send, User, Sparkles, BarChart3, Lightbulb, Bot } from "lucide-react";

export interface ChatInterfaceHandle {
  clearChat: () => void;
}

const ChatInterface = forwardRef<ChatInterfaceHandle>((props, ref) => {
  const [context, setContext] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

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
      await db.chats.add({
        role: 'assistant',
        content: message.content,
        createdAt: Date.now()
      });
    },
  });

  useImperativeHandle(ref, () => ({
    clearChat: async () => {
      if (messages.length === 0) return;
      if (confirm("Hapus semua riwayat percakapan?")) {
        await db.chats.clear();
        setMessages([]);
      }
    }
  }));

  useEffect(() => {
    const initializeChat = async () => {
      const financeData = await getFinancialContext();
      setContext(financeData);
      const history = await db.chats.orderBy("createdAt").toArray();
      if (history.length > 0) {
        setMessages(history.map(h => ({
          id: h.id ? h.id.toString() : Math.random().toString(),
          role: h.role as 'user' | 'assistant',
          content: h.content
        })));
      }
    };
    initializeChat();
  }, [setMessages]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  const handleSend = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!input.trim()) return;

    await db.chats.add({
      role: 'user',
      content: input,
      createdAt: Date.now()
    });
    
    handleSubmit(e, {
      options: { body: { dataContext: context } },
    });
  };

  const handleSuggestion = (text: string) => {
    setInput(text);
  };

  return (
    <div className="flex flex-col h-full bg-gray-50/50 font-sans">
      
      {/* AREA SCROLL PESAN */}
      <div className="flex-1 overflow-y-auto p-4">
        
        {/* LOGIKA EMPTY STATE (CENTERING) */}
        {messages.length === 0 ? (
          // Jika kosong: Gunakan flex container penuh untuk menengahkan konten
          <div className="h-full flex flex-col items-center justify-center text-center animate-in fade-in duration-700">
            <div className="relative">
                <div className="absolute -inset-1 bg-indigo-500 rounded-full blur opacity-20 animate-pulse"></div>
                <div className="relative bg-white p-5 rounded-2xl shadow-sm border border-indigo-50 mb-4">
                    <Bot className="w-10 h-10 text-indigo-600" />
                </div>
            </div>
            
            <h3 className="text-base font-bold text-gray-800">AI Financial Advisor</h3>
            <p className="text-xs mt-2 text-gray-500 max-w-xs mx-auto leading-relaxed">
              Saya siap menganalisis data keuanganmu. <br/> Bingung mau tanya apa? Coba ini:
            </p>
            
            <div className="mt-8 flex flex-wrap justify-center gap-3">
               <button 
                 onClick={() => handleSuggestion("Analisa pengeluaran saya")}
                 className="group text-xs bg-white border border-gray-200 px-4 py-2.5 rounded-xl hover:border-indigo-500 hover:shadow-md hover:shadow-indigo-100 transition-all duration-300 flex items-center gap-2 text-gray-600"
               >
                 <div className="p-1 bg-indigo-50 rounded-md group-hover:bg-indigo-100 transition-colors">
                    <BarChart3 className="w-3.5 h-3.5 text-indigo-600" />
                 </div>
                 <span>Analisa Pengeluaran</span>
               </button>
               
               <button 
                 onClick={() => handleSuggestion("Saran agar lebih hemat")}
                 className="group text-xs bg-white border border-gray-200 px-4 py-2.5 rounded-xl hover:border-amber-500 hover:shadow-md hover:shadow-amber-100 transition-all duration-300 flex items-center gap-2 text-gray-600"
               >
                 <div className="p-1 bg-amber-50 rounded-md group-hover:bg-amber-100 transition-colors">
                    <Lightbulb className="w-3.5 h-3.5 text-amber-600" />
                 </div>
                 <span>Saran Hemat</span>
               </button>
            </div>
          </div>
        ) : (
          // Jika ada pesan: Tampilkan list pesan seperti biasa
          <div className="flex flex-col justify-end min-h-full space-y-5 pb-2">
            {messages.map((m) => (
              <div
                key={m.id}
                className={`flex items-end gap-3 animate-in slide-in-from-bottom-2 duration-500 ${
                  m.role === "user" ? "flex-row-reverse" : "flex-row"
                }`}
              >
                <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 shadow-sm ${
                  m.role === "user" 
                    ? "bg-gray-900 ring-2 ring-gray-100" 
                    : "bg-white border border-indigo-100 text-indigo-600"
                }`}>
                  {m.role === "user" ? (
                    <User className="w-4 h-4 text-white" />
                  ) : (
                    <Sparkles className="w-4 h-4 fill-current" />
                  )}
                </div>

                <div
                  className={`px-5 py-3.5 rounded-2xl text-[13.5px] max-w-[85%] leading-relaxed shadow-sm ${
                    m.role === "user"
                      ? "bg-gradient-to-br from-gray-800 to-black text-white rounded-br-none"
                      : "bg-white text-gray-700 border border-gray-100 rounded-bl-none"
                  }`}
                >
                  <p className="whitespace-pre-wrap tracking-wide">{m.content}</p>
                </div>
              </div>
            ))}
            
            {isLoading && (
              <div className="flex items-center gap-2 ml-11 animate-pulse">
                <div className="bg-white px-4 py-3 rounded-2xl rounded-bl-none shadow-sm border border-gray-100 flex gap-1.5">
                    <span className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce [animation-delay:-0.3s]"></span>
                    <span className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce [animation-delay:-0.15s]"></span>
                    <span className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce"></span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* INPUT BAR (Fixed Bottom of Chat Area) */}
      <div className="p-3 bg-white/80 backdrop-blur-md border-t border-gray-100 flex-shrink-0">
        <form onSubmit={handleSend} className="flex gap-2 relative">
            <input
            className="flex-1 pl-4 pr-4 py-3 bg-gray-50 text-black border border-gray-200 rounded-2xl text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 focus:outline-none placeholder:text-gray-400 transition-all shadow-sm"
            value={input}
            onChange={handleInputChange}
            placeholder="Ketik pesan..."
            disabled={isLoading}
            />
            <button
            type="submit"
            disabled={isLoading || !input.trim()}
            className="p-3 bg-black text-white rounded-xl disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-800 hover:scale-95 active:scale-90 transition-all duration-200 shadow-md flex items-center justify-center"
            >
            <Send className="w-4 h-4" />
            </button>
        </form>
      </div>
    </div>
  );
});

ChatInterface.displayName = "ChatInterface";
export default ChatInterface;