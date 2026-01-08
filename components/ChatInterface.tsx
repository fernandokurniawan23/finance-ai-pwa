"use client";

import { useChat } from "ai/react";
import { useEffect, useState, useRef, forwardRef, useImperativeHandle } from "react";
import { getFinancialContext } from "@/lib/context-loader";
import { db, Transaction } from "@/lib/db";
import { Message } from "ai";
import { useSpeechRecognition } from "@/hooks/useSpeechRecognition";
import { Send, User, Sparkles, BarChart3, Lightbulb, Bot, CheckCircle2, Mic, MicOff } from "lucide-react";

const PARSE_REGEX = /:::TRANSACTION_START:::([\s\S]*?):::TRANSACTION_END:::/;
const RENDER_CLEAN_REGEX = /:::TRANSACTION_START:::[\s\S]*/g;

export interface ChatInterfaceHandle {
  clearChat: () => void;
}

/**
 * Sanitizes message content to hide internal protocol data from the UI.
 * @param content Raw message string possibly containing hidden JSON blocks.
 */
const sanitizeMessage = (content: string): string => {
  return content.replace(RENDER_CLEAN_REGEX, '').trim();
};

const ChatInterface = forwardRef<ChatInterfaceHandle>((props, ref) => {
  const [context, setContext] = useState("");
  const [saveStatus, setSaveStatus] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const { isListening, transcript, startListening, isSupported, resetTranscript } = useSpeechRecognition();

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

      const match = message.content.match(PARSE_REGEX);
      if (match && match[1]) {
        try {
          const rawData = JSON.parse(match[1]);
          const transaction: Transaction = {
            amount: Number(rawData.amount),
            type: rawData.type as 'INCOME' | 'EXPENSE',
            category: rawData.category,
            description: rawData.description,
            date: rawData.date,
            createdAt: Date.now()
          };

          await db.transactions.add(transaction);
          setContext(await getFinancialContext());
          setSaveStatus(`Saved: ${transaction.description}`);
          setTimeout(() => setSaveStatus(null), 3000);
        } catch (error) {
          console.error("[Transaction Parse Failed]", error);
        }
      }
    },
  });

  // Sync speech transcript to input field
  useEffect(() => {
    if (transcript) {
      setInput(transcript);
      resetTranscript();
    }
  }, [transcript, setInput, resetTranscript]);

  useImperativeHandle(ref, () => ({
    clearChat: async () => {
      if (messages.length > 0 && confirm("Delete conversation history?")) {
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
      // MAPPING TYPE-SAFE
      const formattedHistory: Message[] = history.map(h => ({
        id: h.id?.toString() || crypto.randomUUID(),
        role: h.role as Message['role'],
        content: h.content,
      }));
      
      setMessages(formattedHistory);
    }
  };
  initializeChat();
}, [setMessages]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading, saveStatus]);

  const handleSend = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!input.trim()) return;
    await db.chats.add({ role: 'user', content: input, createdAt: Date.now() });
    handleSubmit(e, { options: { body: { dataContext: context } } });
  };

  const handleSuggestion = (text: string) => setInput(text);

  return (
    <div className="flex flex-col h-full bg-gray-50/50 font-sans relative">
      
      {saveStatus && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-50 bg-green-600 text-white px-5 py-2.5 rounded-full shadow-xl text-sm font-medium flex items-center gap-2 animate-in slide-in-from-top-4 fade-in">
          <CheckCircle2 className="w-4 h-4 text-white/90" />
          <span>{saveStatus}</span>
        </div>
      )}

      <div className="flex-1 overflow-y-auto p-4">
        {messages.length === 0 ? (
           <div className="h-full flex flex-col items-center justify-center text-center animate-in fade-in duration-700">
              <div className="relative">
                <div className="absolute -inset-1 bg-indigo-500 rounded-full blur opacity-20 animate-pulse"></div>
                <div className="relative bg-white p-5 rounded-2xl shadow-sm border border-indigo-50 mb-4">
                    <Bot className="w-10 h-10 text-indigo-600" />
                </div>
              </div>
              <h3 className="text-base font-bold text-gray-800">AI Financial Advisor</h3>
              
              <div className="mt-8 flex flex-wrap justify-center gap-3">
               <button onClick={() => handleSuggestion("Analisa pengeluaran saya")} className="group text-xs bg-white border border-gray-200 px-4 py-2.5 rounded-xl hover:border-indigo-500 transition-all flex items-center gap-2 text-gray-600">
                 <BarChart3 className="w-3.5 h-3.5 text-indigo-600" /> <span>Analisa Pengeluaran</span>
               </button>
               <button onClick={() => handleSuggestion("Saran agar lebih hemat")} className="group text-xs bg-white border border-gray-200 px-4 py-2.5 rounded-xl hover:border-amber-500 transition-all flex items-center gap-2 text-gray-600">
                 <Lightbulb className="w-3.5 h-3.5 text-amber-600" /> <span>Saran Hemat</span>
               </button>
              </div>
           </div>
        ) : (
          <div className="flex flex-col justify-end min-h-full space-y-5 pb-2">
            {messages.map((m) => (
              <div key={m.id} className={`flex items-end gap-3 animate-in slide-in-from-bottom-2 duration-500 ${m.role === "user" ? "flex-row-reverse" : "flex-row"}`}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 shadow-sm ${m.role === "user" ? "bg-gray-900 ring-2 ring-gray-100" : "bg-white border text-indigo-600"}`}>
                  {m.role === "user" ? <User className="w-4 h-4 text-white" /> : <Sparkles className="w-4 h-4 fill-current" />}
                </div>
                <div className={`px-5 py-3.5 rounded-2xl text-[13.5px] max-w-[85%] leading-relaxed shadow-sm ${m.role === "user" ? "bg-gradient-to-br from-gray-800 to-black text-white rounded-br-none" : "bg-white text-gray-700 border rounded-bl-none"}`}>
                  <p className="whitespace-pre-wrap tracking-wide">{sanitizeMessage(m.content)}</p>
                </div>
              </div>
            ))}
            {isLoading && <div className="flex ml-11 animate-pulse">...</div>}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      <div className="p-3 bg-white/80 backdrop-blur-md border-t border-gray-100 flex-shrink-0">
        <form onSubmit={handleSend} className="flex gap-2 relative items-end">
            
            {isSupported && (
              <button
                type="button"
                onClick={startListening}
                disabled={isListening || isLoading}
                className={`p-3 rounded-2xl transition-all duration-300 shadow-sm border ${
                  isListening 
                    ? "bg-red-50 border-red-200 text-red-600 animate-pulse ring-2 ring-red-100" 
                    : "bg-gray-50 border-gray-200 text-gray-500 hover:bg-gray-100 hover:text-gray-700"
                }`}
              >
                {isListening ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
              </button>
            )}

            <input
              className="flex-1 pl-4 pr-4 py-3 bg-gray-50 text-black border border-gray-200 rounded-2xl text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 focus:outline-none placeholder:text-gray-400 transition-all shadow-sm"
              value={input}
              onChange={handleInputChange}
              placeholder={isListening ? "Listening..." : "Type or speak..."}
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