// src/app/page.tsx
"use client";

import { useState, useRef } from "react";
import Link from "next/link";
import { PieChart as PieChartIcon, Settings, Target, Wallet, Sparkles, Trash2 } from "lucide-react";

import TransactionForm from "@/components/TransactionForm";
import TransactionList from "@/components/TransactionList";
import ChatInterface, { ChatInterfaceHandle } from "@/components/ChatInterface";
import BottomNav from "@/components/BottomNav";

export default function Home() {
  const [activeTab, setActiveTab] = useState<"tracker" | "advisor">("tracker");
  const currentYear = new Date().getFullYear();
  const chatRef = useRef<ChatInterfaceHandle>(null);

  return (
    // PENTING: h-[100dvh] dan overflow-hidden mengunci layar agar tidak goyang
    <div className="h-[100dvh] bg-gray-50 flex flex-col overflow-hidden">
      
      {/* HEADER (Fixed Height) */}
      <header className="bg-white p-4 border-b border-gray-200 z-20 shadow-sm flex justify-between items-center flex-shrink-0 h-[60px]">
        <div className="w-16 flex justify-start">
           <Link href="/settings" className="text-gray-400 hover:text-black transition-colors">
              <Settings className="w-6 h-6" />
           </Link>
        </div>
        
        <h1 className="text-lg font-bold text-black flex items-center gap-2">
          {activeTab === "tracker" ? (
            <>
              <Wallet className="w-5 h-5" />
              <span>Finance</span>
            </>
          ) : (
            <>
              <Sparkles className="w-5 h-5" />
              <span>AI Advisor</span>
            </>
          )}
        </h1>

        <div className="w-16 flex justify-end gap-3">
          {activeTab === "tracker" ? (
            <>
              <Link href="/budget" className="text-gray-600 hover:text-red-600 transition-colors">
                <Target className="w-6 h-6" />
              </Link>
              <Link href="/stats" className="text-gray-600 hover:text-blue-600 transition-colors">
                <PieChartIcon className="w-6 h-6" />
              </Link>
            </>
          ) : (
            <button 
              onClick={() => chatRef.current?.clearChat()} 
              className="text-gray-400 hover:text-red-600 transition-colors"
            >
              <Trash2 className="w-6 h-6" />
            </button>
          )}
        </div>
      </header>

      {/* MAIN CONTENT AREA */}
      <main className="flex-1 flex flex-col relative overflow-hidden">
        {activeTab === "tracker" ? (
          // Mode TRACKER: Scroll terjadi di sini (overflow-y-auto)
          <div className="flex-1 overflow-y-auto p-4 pb-24">
            <div className="space-y-6 animate-in fade-in duration-300">
              <TransactionList />
              <div className="pt-4 border-t border-gray-200">
                <TransactionForm />
              </div>
              
              {/* Footer hanya muncul di Tracker */}
              <div className="mt-8 py-5 text-center border-t border-gray-100">
                <div className="flex flex-col gap-0.5">
                  <p className="text-[11px] font-medium text-gray-500">Fernando Kurniawan</p>
                  <p className="text-[10px] text-gray-400">&copy; {currentYear} Finance AI.</p>
                  <p className="text-[9px] text-gray-300">Local-First Architecture</p>
                </div>
              </div>
            </div>
          </div>
        ) : (
          // Mode ADVISOR: Tidak ada scroll di main, serahkan ke ChatInterface
          <div className="absolute inset-0 pb-[70px]"> {/* pb-[70px] memberi ruang untuk Bottom Nav */}
            <ChatInterface ref={chatRef} />
          </div>
        )}
      </main>

      {/* BOTTOM NAV (Fixed) */}
      <BottomNav currentTab={activeTab} onTabChange={setActiveTab} />
    </div>
  );
}