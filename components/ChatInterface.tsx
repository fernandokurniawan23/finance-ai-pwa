"use client";

import {
  useEffect,
  useState,
  useRef,
  forwardRef,
  useImperativeHandle,
} from "react";
import { getFinancialContext } from "@/lib/context-loader";
import { db, Transaction } from "@/lib/db";
import { useSpeechRecognition } from "@/hooks/useSpeechRecognition";
import {
  Send,
  User,
  Sparkles,
  BarChart3,
  Lightbulb,
  Bot,
  CheckCircle2,
  Mic,
  MicOff,
} from "lucide-react";

/* ===============================
   TYPES
================================ */
type ChatMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
};

/* ===============================
   CONSTANTS
================================ */
const PARSE_REGEX = /:::TRANSACTION_START:::([\s\S]*?):::TRANSACTION_END:::/;
const RENDER_CLEAN_REGEX = /:::TRANSACTION_START:::[\s\S]*?:::TRANSACTION_END:::/g;

/* ===============================
   HELPERS
================================ */
const sanitizeMessage = (content: string): string =>
  content.replace(RENDER_CLEAN_REGEX, "").trim();

const getAnonId = () => {
  if (typeof window === "undefined") return null;
  let id = localStorage.getItem("anon_id");
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem("anon_id", id);
  }
  return id;
};

const sanitizeStreamingMessage = (content: string): string => {
  if (content.includes(":::TRANSACTION_START:::")) {
    return content.split(":::TRANSACTION_START:::")[0].trim();
  }
  return content;
};

/* ===============================
   IMPERATIVE HANDLE
================================ */
export interface ChatInterfaceHandle {
  clearChat: () => void;
}

/* ===============================
   COMPONENT
================================ */
const ChatInterface = forwardRef<ChatInterfaceHandle>((_, ref) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [context, setContext] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [saveStatus, setSaveStatus] = useState<string | null>(null);
  const [draftTx, setDraftTx] = useState<Transaction | null>(null);
  const [isDraftPending, setIsDraftPending] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const lastTranscriptRef = useRef<string>("");

  const {
    isListening,
    transcript,
    startListening,
    isSupported,
    resetTranscript,
  } = useSpeechRecognition();

  /* ===============================
     INIT
  ================================ */
  useEffect(() => {
    const init = async () => {
      const financeData = await getFinancialContext();
      setContext(financeData);

      const history = await db.chats.orderBy("createdAt").toArray();
      if (history.length > 0) {
        setMessages(
          history
            .filter(
              (h): h is typeof h & { role: "user" | "assistant" } =>
                h.role === "user" || h.role === "assistant"
            )
            .map((h) => ({
              id: h.id?.toString() || crypto.randomUUID(),
              role: h.role,
              content: h.content,
            }))
        );
      }
    };
    init();
  }, []);

  /* ===============================
     AUTOSCROLL
  ================================ */
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading, saveStatus, draftTx]);

  /* ===============================
     CLEAR CHAT
  ================================ */
  useImperativeHandle(ref, () => ({
    clearChat: async () => {
      if (messages.length > 0 && confirm("Delete conversation history?")) {
        await db.chats.clear();
        setMessages([]);
        setDraftTx(null);
      }
    },
  }));

  /* ===============================
     SEND MESSAGE
  ================================ */
  const handleSend = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    resetTranscript();
    lastTranscriptRef.current = "";
    setDraftTx(null);

    const userMessage: ChatMessage = {
      id: crypto.randomUUID(),
      role: "user",
      content: input,
    };

    await db.chats.add({
      role: "user",
      content: input,
      createdAt: Date.now(),
    });

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);


    const res = await fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        messages: [...messages, userMessage],
        dataContext: context,
        anonId: getAnonId(),
      }),
    });

    if (res.status === 429) {
      setMessages((prev) => [
        ...prev,
        {
          id: crypto.randomUUID(),
          role: "assistant",
          content:
            "Sistem AI sedang sibuk (limit provider). Silakan coba beberapa saat lagi.",
        },
      ]);
      setIsLoading(false);
      setIsDraftPending(false);
      return;
    }

    const reader = res.body?.getReader();
    const decoder = new TextDecoder();
    let assistantText = "";

    while (reader) {
      const { value, done } = await reader.read();
      if (done) break;

      assistantText += decoder.decode(value);

      setMessages((prev) => {
        const copy = [...prev];
        const last = copy[copy.length - 1];
        if (last?.role === "assistant") {
          last.content = assistantText;
        } else {
          copy.push({
            id: crypto.randomUUID(),
            role: "assistant",
            content: assistantText,
          });
        }
        return copy;
      });
    }

    setIsLoading(false);
    setIsDraftPending(false);

    await db.chats.add({
      role: "assistant",
      content: assistantText,
      createdAt: Date.now(),
    });

    const match = assistantText.match(PARSE_REGEX);
    if (match?.[1]) {
      try {
        const raw = JSON.parse(match[1]);

        setIsDraftPending(true); // aktifkan HANYA kalau memang ada draft

        setDraftTx({
          amount: Number(raw.amount),
          type: raw.type,
          category: raw.category,
          description: raw.description,
          date: raw.date,
          createdAt: Date.now(),
        });
      } catch {
        setDraftTx(null);
      }
    } else {
      setIsDraftPending(false);
    }
  };

  /* ===============================
     SAVE DRAFT (EXPLICIT APPROVAL)
  ================================ */
  const handleSaveDraft = async () => {
    if (!draftTx) return;
    await db.transactions.add(draftTx);
    setContext(await getFinancialContext());
    setSaveStatus(`Saved: ${draftTx.description}`);
    setDraftTx(null);
    setTimeout(() => setSaveStatus(null), 3000);
  };

  const handleDiscardDraft = () => {
    setDraftTx(null);
  };

  const handleSuggestion = (text: string) => setInput(text);

  /* ===============================
     UI
  ================================ */
  return (
    <div className="flex flex-col h-full bg-gray-50/50 font-sans relative">
      {saveStatus && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-50 bg-green-600 text-white px-5 py-2.5 rounded-full shadow-xl text-sm font-medium flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-white/90" />
          <span>{saveStatus}</span>
        </div>
      )}

      <div className="flex-1 overflow-y-auto p-4">
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center">
            <Bot className="w-10 h-10 text-indigo-600 mb-4" />
            <h3 className="text-base font-bold text-gray-800">
              AI Financial Advisor
            </h3>
            <div className="mt-6 flex gap-3">
              <button
                onClick={() => handleSuggestion("Analisa pengeluaran saya")}
                className="group text-xs bg-white border border-gray-200 px-4 py-2.5 rounded-xl hover:border-indigo-500 hover:shadow-sm transition-all flex items-center gap-2 text-gray-700"
              >
                <BarChart3 className="w-4 h-4 text-indigo-600 group-hover:scale-105 transition-transform" />
                <span>Analisa Pengeluaran</span>
              </button>
              <button
                onClick={() => handleSuggestion("Saran agar lebih hemat")}
                className="group text-xs bg-white border border-gray-200 px-4 py-2.5 rounded-xl hover:border-amber-500 hover:shadow-sm transition-all flex items-center gap-2 text-gray-700"
              >
                <Lightbulb className="w-4 h-4 text-amber-600 group-hover:scale-105 transition-transform" />
                <span>Saran Hemat</span>
              </button>
            </div>
          </div>
        ) : (
          <div className="flex flex-col space-y-5 pb-2">
            {messages.map((m) => (
              <div
                key={m.id}
                className={`flex items-end gap-3 ${
                  m.role === "user" ? "flex-row-reverse" : "flex-row"
                }`}
              >
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 shadow-sm ${
                    m.role === "user"
                      ? "bg-gray-900 ring-2 ring-gray-100"
                      : "bg-indigo-50 border border-indigo-200"
                  }`}
                >
                  {m.role === "user" ? (
                    <User className="w-4 h-4 text-white" />
                  ) : (
                    <Sparkles className="w-4 h-4 text-indigo-600" />
                  )}
                </div>
                <div
                  className={`px-5 py-3.5 rounded-2xl text-sm max-w-[85%] leading-relaxed shadow-sm ${
                    m.role === "user"
                      ? "bg-gradient-to-br from-gray-800 to-black text-white rounded-br-none"
                      : "bg-white text-gray-800 border rounded-bl-none"
                  }`}
                >
                  {isLoading && m.role === "assistant"
                    ? sanitizeStreamingMessage(m.content)
                    : sanitizeMessage(m.content)}
                </div>
              </div>
            ))}

            {isDraftPending && !draftTx && (
              <div className="ml-11 text-xs text-gray-500 animate-pulse">
                Menyiapkan draft transaksi…
              </div>
            )}

            {draftTx && (
              <div className="ml-11 max-w-[85%] bg-white border border-indigo-200 rounded-2xl shadow-sm p-4 space-y-3">
                <div className="text-xs font-semibold text-indigo-600">
                  Draft Transaksi
                </div>

                <select
                  className="w-full px-3 py-2 text-sm text-black bg-gray-50 border border-gray-300 rounded-xl
                            focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500"
                  value={draftTx.category}
                  onChange={(e) =>
                    setDraftTx({ ...draftTx, category: e.target.value })
                  }
                >
                  {/* EXPENSE */}
                  {draftTx.type === "EXPENSE" && (
                    <>
                      <option value="Makanan & Minuman">Makanan & Minuman</option>
                      <option value="Transportasi">Transportasi</option>
                      <option value="Tagihan & Langganan">Tagihan & Langganan</option>
                      <option value="Belanja Kebutuhan">Belanja Kebutuhan</option>
                      <option value="Belanja Non-Kebutuhan">Belanja Non-Kebutuhan</option>
                      <option value="Kesehatan">Kesehatan</option>
                      <option value="Pendidikan">Pendidikan</option>
                      <option value="Hiburan">Hiburan</option>
                      <option value="Keluarga & Sosial">Keluarga & Sosial</option>
                      <option value="Cash Out (Pengeluaran Tunai)">Cash Out (Pengeluaran Tunai)</option>
                      <option value="Darurat">Darurat</option>
                      <option value="Lainnya">Lainnya</option>
                    </>
                  )}

                  {/* INCOME */}
                  {draftTx.type === "INCOME" && (
                    <>
                      <option value="Gaji Utama">Gaji Utama</option>
                      <option value="Gaji Tambahan">Gaji Tambahan</option>
                      <option value="Bonus / THR">Bonus / THR</option>
                      <option value="Freelance">Freelance</option>
                      <option value="Usaha">Usaha</option>
                      <option value="Hasil Investasi">Hasil Investasi</option>
                      <option value="Hadiah / Refund">Hadiah / Refund</option>
                      <option value="Lainnya">Lainnya</option>
                    </>
                  )}
                </select>

                <input
                  className="w-full px-3 py-2 text-sm text-black bg-gray-50 border border-gray-300 rounded-xl
                    focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500"
                  value={draftTx.description}
                  onChange={(e) =>
                    setDraftTx({ ...draftTx, description: e.target.value })
                  }
                />

                <input
                  type="number"
                  className="w-full px-3 py-2 text-sm text-black bg-gray-50 border border-gray-300 rounded-xl
                    focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500"
                  value={draftTx.amount}
                  onChange={(e) =>
                    setDraftTx({ ...draftTx, amount: Number(e.target.value) })
                  }
                />

                <div className="flex gap-2">
                  <button
                    onClick={handleSaveDraft}
                    className="px-4 py-2 bg-indigo-600 text-white rounded-xl text-xs shadow-sm
                              hover:bg-indigo-700 transition"
                  >
                    Simpan Transaksi
                  </button>

                  <button
                    onClick={handleDiscardDraft}
                    className="px-4 py-2 bg-gray-100 text-black rounded-xl text-xs
                              border border-gray-300 hover:bg-gray-200 transition"
                  >
                    Batal
                  </button>
                </div>
              </div>
            )}

            {isLoading && <div className="ml-11 animate-pulse">...</div>}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      <div className="p-3 bg-white border-t">
        <form onSubmit={handleSend} className="flex gap-2 items-end">
          {isSupported && (
            <button
              type="button"
              onClick={startListening}
              disabled={isListening || isLoading}
              className={`p-3 rounded-2xl border transition-all duration-200 shadow-sm ${
                isListening
                  ? "bg-red-50 border-red-300 text-red-600 ring-2 ring-red-100 animate-pulse"
                  : "bg-gray-50 border-gray-300 text-gray-700 hover:bg-gray-100 hover:text-gray-900"
              }`}
            >
              {isListening ? (
                <MicOff className="w-5 h-5" />
              ) : (
                <Mic className="w-5 h-5" />
              )}
            </button>
          )}

          <input
            className="flex-1 px-4 py-3 bg-gray-50 text-gray-900 border border-gray-300 rounded-2xl text-sm
                      placeholder:text-gray-400
                      focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500
                      disabled:opacity-60 disabled:cursor-not-allowed
                      transition-all shadow-sm"
            value={isListening ? transcript : input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={isListening ? "Listening..." : "Type or speak..."}
            disabled={isLoading}
          />

          <button
            type="submit"
            disabled={isLoading || !input.trim()}
            className="p-3 bg-black text-white rounded-xl"
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