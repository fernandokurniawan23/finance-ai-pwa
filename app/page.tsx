"use client";

import { useState } from "react";
import Link from "next/link";
import { PieChart as PieChartIcon, Settings, Target, Wallet, Sparkles } from "lucide-react";

import TransactionForm from "@/components/TransactionForm";
import TransactionList from "@/components/TransactionList";
import ChatInterface from "@/components/ChatInterface";
import BottomNav from "@/components/BottomNav";

export default function Home() {
  const [activeTab, setActiveTab] = useState<"tracker" | "advisor">("tracker");

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* App Bar */}
      <header className="bg-white p-4 border-b border-gray-200 sticky top-0 z-20 shadow-sm flex justify-between items-center">
        
        {/* Settings */}
        <div className="w-16 flex justify-start">
           <Link href="/settings" className="text-gray-400 hover:text-black transition-colors" aria-label="Settings">
              <Settings className="w-6 h-6" />
           </Link>
        </div>
        
        {/* Title*/}
        <h1 className="text-lg font-bold text-center tracking-tight text-black flex items-center justify-center gap-2">
          {activeTab === "tracker" ? (
            <>
              <Wallet className="w-5 h-5" />
              <span>Finance Tracker</span>
            </>
          ) : (
            <>
              <Sparkles className="w-5 h-5" />
              <span>AI Advisor</span>
            </>
          )}
        </h1>

        {/* Actions (Budget & Stats) */}
        <div className="w-16 flex justify-end gap-3">
          {activeTab === "tracker" && (
            <>
              <Link href="/budget" className="text-gray-600 hover:text-red-600 transition-colors" aria-label="Budget Target">
                <Target className="w-6 h-6" />
              </Link>
              <Link href="/stats" className="text-gray-600 hover:text-blue-600 transition-colors" aria-label="Statistics">
                <PieChartIcon className="w-6 h-6" />
              </Link>
            </>
          )}
        </div>
      </header>

      {/* Main Content View */}
      <main className="flex-1 p-4 pb-24">
        {activeTab === "tracker" ? (
          <div className="space-y-6 animate-in fade-in duration-300">
            <TransactionList />
            <div className="pt-4 border-t border-gray-200">
              <TransactionForm />
            </div>
          </div>
        ) : (
          <div className="animate-in slide-in-from-bottom-2 duration-300">
            <ChatInterface />
          </div>
        )}
      </main>

      <BottomNav currentTab={activeTab} onTabChange={setActiveTab} />
    </div>
  );
}