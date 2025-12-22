"use client";

import { useState } from "react";
import Link from "next/link";
import { PieChart as PieChartIcon, Settings } from "lucide-react";
import TransactionForm from "@/components/TransactionForm";
import TransactionList from "@/components/TransactionList";
import ChatInterface from "@/components/ChatInterface";
import BottomNav from "@/components/BottomNav";

export default function Home() {
  // State untuk tab aktif (Dompet vs AI)
  const [activeTab, setActiveTab] = useState<"tracker" | "advisor">("tracker");

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      
      {/* HEADER */}
      <header className="bg-white p-4 border-b border-gray-200 sticky top-0 z-20 shadow-sm flex justify-between items-center">
        
        {/* Button Settings */}
        <div className="w-8 flex justify-start">
             <Link href="/settings" className="text-gray-400 hover:text-black transition-colors">
                <Settings className="w-6 h-6" />
             </Link>
        </div>
        
        {/* Judul Halaman */}
        <h1 className="text-lg font-bold text-center tracking-tight">
          {activeTab === "tracker" ? " Finance Tracker" : "AI Advisor"}
        </h1>

        {/* Button Stats */}
        <div className="w-8 flex justify-end">
          {activeTab === "tracker" && (
            <Link href="/stats" className="text-gray-600 hover:text-black transition-colors">
              <PieChartIcon className="w-6 h-6" />
            </Link>
          )}
        </div>
      </header>

      {/* MAIN CONTENT AREA */}
      <main className="flex-1 p-4 pb-24">
        {activeTab === "tracker" ? (
          // TAB 1: DOMPET (TRACKER)
          <div className="space-y-6 animate-in fade-in duration-300">
            {/* 1. List Transaksi & Saldo */}
            <TransactionList />
            
            {/* 2. Form Input */}
            <div className="pt-4 border-t border-gray-200">
              <TransactionForm />
            </div>
          </div>
        ) : (
          // TAB 2: AI ADVISOR
          <div className="animate-in slide-in-from-bottom-2 duration-300">
            <ChatInterface />
          </div>
        )}
      </main>

      {/* BOTTOM NAVIGATION */}
      <BottomNav currentTab={activeTab} onTabChange={setActiveTab} />
    </div>
  );
}