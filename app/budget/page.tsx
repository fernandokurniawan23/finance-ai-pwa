"use client";

import { useState, useMemo } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { db } from "@/lib/db";
import { ArrowLeft, Plus, Trash2, AlertTriangle } from "lucide-react";
import Link from "next/link";

const EXPENSE_CATEGORIES = [
  "Makanan & Minuman",
  "Transportasi",
  "Belanja Rutin",
  "Tagihan & Langganan",
  "Hiburan",
  "Kesehatan",
  "Pendidikan",
  "Investasi",
  "Lainnya"
];

export default function BudgetPage() {
  const [selectedCategory, setSelectedCategory] = useState(EXPENSE_CATEGORIES[0]);
  const [limitAmount, setLimitAmount] = useState("");
  
  // 1. Ambil Data Budget & Transaksi
  const budgets = useLiveQuery(() => db.budgets.toArray());
  const transactions = useLiveQuery(() => db.transactions.toArray());

  // 2. Logic Simpan
  const handleSaveBudget = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!limitAmount) return;

    try {
      await db.budgets.put({
        category: selectedCategory,
        limit: parseFloat(limitAmount),
      });
      setLimitAmount("");
      alert(`Target untuk ${selectedCategory} berhasil diset!`);
    } catch (error) {
      console.error("Gagal save budget:", error);
    }
  };

  // 3. Logic Hapus
  const handleDelete = async (id?: number) => {
    if (id) await db.budgets.delete(id);
  };

  // 4. Hitung Progress
  const budgetProgress = useMemo(() => {
    if (!budgets || !transactions) return [];

    const currentMonth = new Date().toISOString().substring(0, 7); // "2025-12"
    const monthlyExpenses = transactions.filter(t => 
      t.type === "EXPENSE" && t.date.startsWith(currentMonth)
    );

    return budgets.map(b => {
      const spent = monthlyExpenses
        .filter(t => t.category === b.category)
        .reduce((sum, t) => sum + t.amount, 0);
      
      const percentage = Math.min((spent / b.limit) * 100, 100);
      
      let color = "bg-green-500";
      if (percentage >= 80) color = "bg-yellow-500";
      if (percentage >= 100) color = "bg-red-600";

      return { ...b, spent, percentage, color, isOver: spent > b.limit };
    });
  }, [budgets, transactions]);

  return (
    <div className="min-h-screen bg-gray-50 pb-10">
      {/* Header */}
      <div className="bg-white p-4 border-b border-gray-200 sticky top-0 z-10 flex items-center gap-3">
        <Link href="/" className="p-2 hover:bg-gray-100 rounded-full transition-colors">
          <ArrowLeft className="w-5 h-5 text-black" />
        </Link>
        <h1 className="text-lg font-bold text-black">Atur Budget Bulanan</h1>
      </div>

      <div className="p-4 space-y-8">
        
        {/* FORM INPUT BUDGET */}
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100">
          <h2 className="font-bold text-black text-lg mb-4">Pasang Target Baru</h2>
          <form onSubmit={handleSaveBudget} className="space-y-4">
            <div>
              <label className="block text-sm font-bold text-black mb-1">Kategori</label>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="w-full p-3 border border-gray-200 rounded-lg bg-white text-black font-medium focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {EXPENSE_CATEGORIES.map(c => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-bold text-black mb-1">Batas Maksimal (Rp)</label>
              <input
                type="number"
                value={limitAmount}
                onChange={(e) => setLimitAmount(e.target.value)}
                placeholder="Contoh: 500000"
                className="w-full p-3 border border-gray-200 rounded-lg font-bold text-black focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder:text-gray-400"
                required
              />
            </div>
            <button type="submit" className="w-full bg-black text-white py-3 rounded-lg font-bold flex justify-center items-center gap-2 hover:bg-gray-800 transition-colors">
              <Plus className="w-4 h-4" /> Simpan Target
            </button>
          </form>
        </div>

        {/* LIST PROGRESS BARS */}
        <div className="space-y-4">
          <h3 className="text-sm font-bold text-black uppercase tracking-wider">Status Bulan Ini</h3>
          
          {budgetProgress.length === 0 ? (
            <div className="text-center p-8 bg-white rounded-xl border border-dashed border-gray-300">
              <p className="text-black font-medium">Belum ada budget.</p>
              <p className="text-xs text-gray-500">Pasang target di atas untuk mulai memantau.</p>
            </div>
          ) : (
            budgetProgress.map((item) => (
              <div key={item.id} className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm relative overflow-hidden">
                
                {/* Header Item */}
                <div className="flex justify-between items-end mb-2 relative z-10">
                  <div>
                    <p className="font-bold text-black text-base">{item.category}</p>
                    <p className="text-sm text-gray-900 mt-1 font-medium">
                      Terpakai: <span className={item.isOver ? "text-red-600 font-bold" : "text-black"}>Rp {item.spent.toLocaleString("id-ID")}</span> 
                      <span className="mx-2 text-gray-400">/</span> 
                      Target: Rp {item.limit.toLocaleString("id-ID")}
                    </p>
                  </div>
                  <button onClick={() => handleDelete(item.id)} className="text-gray-400 hover:text-red-600 p-1">
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>

                {/* Progress Bar Container */}
                <div className="h-4 w-full bg-gray-100 rounded-full overflow-hidden relative z-10 mt-2 border border-gray-200">
                  <div 
                    className={`h-full ${item.color} transition-all duration-500 ease-out`}
                    style={{ width: `${item.percentage}%` }}
                  />
                </div>

                {/* Over Budget Alert */}
                {item.isOver && (
                  <div className="mt-3 flex items-center gap-2 text-red-600 text-sm font-bold animate-pulse bg-red-50 p-2 rounded-lg">
                    <AlertTriangle className="w-4 h-4" />
                    <span>OVER BUDGET! Kurangi jajan.</span>
                  </div>
                )}
              </div>
            ))
          )}
        </div>

      </div>
    </div>
  );
}