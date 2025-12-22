"use client";

import { LayoutDashboard, Sparkles } from "lucide-react";

type Tab = "tracker" | "advisor";

interface BottomNavProps {
  currentTab: Tab;
  /** Callback to lift state up to parent page */
  onTabChange: (tab: Tab) => void;
}

export default function BottomNav({ currentTab, onTabChange }: BottomNavProps) {
  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-6 py-3 flex justify-around items-center z-50 max-w-md mx-auto">
      <button
        onClick={() => onTabChange("tracker")}
        className={`flex flex-col items-center gap-1 transition-colors ${
          currentTab === "tracker" ? "text-blue-600" : "text-gray-400"
        }`}
      >
        <LayoutDashboard className="w-6 h-6" />
        <span className="text-[10px] font-bold">Dompet</span>
      </button>

      <button
        onClick={() => onTabChange("advisor")}
        className={`flex flex-col items-center gap-1 transition-colors ${
          currentTab === "advisor" ? "text-purple-600" : "text-gray-400"
        }`}
      >
        <Sparkles className="w-6 h-6" />
        <span className="text-[10px] font-bold">AI Advisor</span>
      </button>
    </div>
  );
}