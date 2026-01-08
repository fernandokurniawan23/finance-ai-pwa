"use client";

import { useState, useMemo } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { db, Transaction } from "@/lib/db";
import { ArrowLeft, Trash2, Filter, Calendar, X, StickyNote, Receipt } from "lucide-react";
import Link from "next/link";

export default function HistoryPage() {
  // --- State Management ---
  const [selectedPeriod, setSelectedPeriod] = useState<string>("ALL");
  
  // State for Modal Detail
  const [selectedTx, setSelectedTx] = useState<Transaction | null>(null);

  // --- Data Fetching ---
  const allTransactions = useLiveQuery(() => 
    db.transactions.orderBy("date").reverse().toArray()
  );

  // --- Handlers ---
  const handleDelete = async (e: React.MouseEvent, id?: number) => {
    e.stopPropagation();
    if (!id) return;
    if (confirm("Hapus transaksi ini?")) {
      await db.transactions.delete(id);
      if (selectedTx?.id === id) setSelectedTx(null);
    }
  };

  const handleDeleteFromModal = async (id?: number) => {
    if (!id) return;
    if (confirm("Hapus transaksi ini?")) {
      await db.transactions.delete(id);
      setSelectedTx(null);
    }
  };

  // --- Data Processing ---
  const filterOptions = useMemo(() => {
    if (!allTransactions) return [];
    const uniqueMonths = new Set<string>();
    allTransactions.forEach(t => {
      uniqueMonths.add(t.date.substring(0, 7));
    });
    return Array.from(uniqueMonths).sort().reverse();
  }, [allTransactions]);

  const filteredData = useMemo(() => {
    if (!allTransactions) return [];
    if (selectedPeriod === "ALL") return allTransactions;
    return allTransactions.filter(t => t.date.startsWith(selectedPeriod));
  }, [allTransactions, selectedPeriod]);

  const summary = useMemo(() => {
    const income = filteredData.reduce((acc, t) => (t.type === "INCOME" ? acc + t.amount : acc), 0);
    const expense = filteredData.reduce((acc, t) => (t.type === "EXPENSE" ? acc + t.amount : acc), 0);
    return { income, expense, balance: income - expense };
  }, [filteredData]);

  const groupedData = useMemo(() => {
    return filteredData.reduce((groups, transaction) => {
      const dateObj = new Date(transaction.date);
      const monthYear = dateObj.toLocaleString("id-ID", { month: "long", year: "numeric" });
      if (!groups[monthYear]) groups[monthYear] = [];
      groups[monthYear].push(transaction);
      return groups;
    }, {} as Record<string, Transaction[]>);
  }, [filteredData]);

  const formatPeriodLabel = (yyyyMm: string) => {
    const [year, month] = yyyyMm.split("-");
    const date = new Date(parseInt(year), parseInt(month) - 1);
    return date.toLocaleString("id-ID", { month: "long", year: "numeric" });
  };

  if (!allTransactions) return <div className="p-8 text-center text-gray-400">Memuat data...</div>;

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col relative">
      
      {/* 1. HEADER FIXED */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-20">
        <div className="p-4 flex items-center gap-3">
          <Link href="/" className="p-2 hover:bg-gray-100 rounded-full transition-colors">
            <ArrowLeft className="w-5 h-5 text-gray-700" />
          </Link>
          <div className="flex-1">
            <h1 className="text-lg font-bold text-gray-900">Riwayat Transaksi</h1>
          </div>
        </div>

        {/* Filter Dropdown */}
        <div className="px-4 pb-4">
          <div className="relative">
            <select
              value={selectedPeriod}
              onChange={(e) => setSelectedPeriod(e.target.value)}
              className="w-full appearance-none bg-gray-100 border border-transparent hover:border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-black focus:border-black block p-3 pl-10 font-medium cursor-pointer transition-all"
            >
              <option value="ALL">Semua Waktu</option>
              {filterOptions.map((period) => (
                <option key={period} value={period}>{formatPeriodLabel(period)}</option>
              ))}
            </select>
            <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
              <Calendar className="w-4 h-4 text-gray-500" />
            </div>
            <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
              <Filter className="w-4 h-4 text-gray-400" />
            </div>
          </div>
        </div>
      </div>

      {/* 2. CONTENT SCROLLABLE */}
      <div className="flex-1 p-4 pb-20 space-y-6">
        
        {/* Summary Boxes */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-green-50 p-4 rounded-xl border border-green-100">
            <p className="text-xs text-green-600 font-bold uppercase mb-1">Pemasukan</p>
            <p className="text-lg font-bold text-green-700 truncate">+ {summary.income.toLocaleString("id-ID")}</p>
          </div>
          <div className="bg-red-50 p-4 rounded-xl border border-red-100">
            <p className="text-xs text-red-600 font-bold uppercase mb-1">Pengeluaran</p>
            <p className="text-lg font-bold text-red-700 truncate">- {summary.expense.toLocaleString("id-ID")}</p>
          </div>
        </div>

        {/* List Transaksi */}
        <div className="space-y-6">
          {Object.keys(groupedData).length === 0 ? (
            <div className="text-center py-10 text-gray-400"><p>Tidak ada transaksi.</p></div>
          ) : (
            Object.keys(groupedData).map((monthYear) => (
              <div key={monthYear} className="animate-in fade-in duration-500">
                {selectedPeriod === "ALL" && (
                  <h2 className="text-sm font-bold text-gray-500 mb-3 px-1 uppercase tracking-wider">{monthYear}</h2>
                )}
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                  {groupedData[monthYear].map((t, index) => (
                    <div 
                      key={t.id} 
                      onClick={() => setSelectedTx(t)}
                      className={`flex justify-between items-center p-4 cursor-pointer hover:bg-gray-50 active:bg-gray-100 transition-colors ${
                        index !== groupedData[monthYear].length - 1 ? 'border-b border-gray-50' : ''
                      }`}
                    >
                      <div className="flex-1 min-w-0 pr-4">
                        <div className="flex items-center gap-2">
                           <p className="font-bold text-gray-900 text-sm truncate">{t.category}</p>
                        </div>
                        <p className="text-xs text-gray-400 mt-0.5">
                          {new Date(t.date).toLocaleDateString("id-ID", { day: 'numeric', month: 'long' })}
                        </p>
                      </div>
                      <div className="flex items-center gap-3 shrink-0">
                        <span className={`font-mono font-bold text-sm whitespace-nowrap ${t.type === "INCOME" ? "text-green-600" : "text-red-600"}`}>
                          {t.type === "INCOME" ? "+" : "-"} {t.amount.toLocaleString("id-ID")}
                        </span>
                        <button 
                          onClick={(e) => handleDelete(e, t.id)}
                          className="p-2 text-gray-300 hover:text-red-500 rounded-full transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* 3. MODAL DETAIL (POP-UP) */}
      {selectedTx && (
        // Backdrop Gelap
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-200">
            
            {/* Kartu Modal */}
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden relative animate-in zoom-in-95 duration-200">
                
                {/* Header Modal */}
                <div className="bg-gray-50 p-4 border-b border-gray-100 flex justify-between items-center">
                    <h3 className="font-bold text-gray-800 flex items-center gap-2">
                        <Receipt className="w-4 h-4 text-gray-500" /> Detail Transaksi
                    </h3>
                    <button 
                        onClick={() => setSelectedTx(null)}
                        className="p-1 rounded-full bg-gray-200 hover:bg-gray-300 transition-colors"
                    >
                        <X className="w-4 h-4 text-gray-600" />
                    </button>
                </div>

                {/* Body Modal */}
                <div className="p-6 text-center">
                    {/* Icon Besar */}
                    <div className="flex justify-center mb-4">
                        <div className={`p-4 rounded-full ${
                             selectedTx.type === "INCOME" ? "bg-green-100" : "bg-red-100"
                        }`}>
                             <Receipt className={`w-8 h-8 ${
                                  selectedTx.type === "INCOME" ? "text-green-600" : "text-red-600"
                             }`} />
                        </div>
                    </div>

                    {/* Nominal Besar */}
                    <h2 className={`text-2xl font-black mb-1 tracking-tight ${
                        selectedTx.type === "INCOME" ? "text-green-600" : "text-red-600"
                    }`}>
                        {selectedTx.type === "INCOME" ? "+" : "-"} Rp {selectedTx.amount.toLocaleString("id-ID")}
                    </h2>
                    
                    <p className="text-gray-500 text-sm font-medium mb-6">
                        {new Date(selectedTx.date).toLocaleDateString("id-ID", { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
                    </p>

                    {/* Informasi Detail */}
                    <div className="space-y-3 text-left">
                        <div className="bg-gray-50 p-3 rounded-lg border border-gray-100">
                            <p className="text-[10px] uppercase text-gray-400 font-bold tracking-wider mb-1">Kategori</p>
                            <p className="font-semibold text-gray-800">{selectedTx.category}</p>
                        </div>

                        {/* DESKRIPSI (Tampil jika ada) */}
                        <div className="bg-gray-50 p-3 rounded-lg border border-gray-100">
                            <p className="text-[10px] uppercase text-gray-400 font-bold tracking-wider mb-1 flex items-center gap-1">
                                <StickyNote className="w-3 h-3" /> Catatan
                            </p>
                            <p className="text-sm text-gray-700 italic leading-relaxed">
                                {(selectedTx.description && selectedTx.description.trim()) 
                                    ? selectedTx.description 
                                    : "Tidak ada catatan."
                                }
                            </p>
                        </div>
                    </div>
                </div>

                {/* Footer Modal */}
                <div className="p-4 border-t border-gray-100 bg-gray-50 flex gap-3">
                    <button 
                        onClick={() => handleDeleteFromModal(selectedTx.id)}
                        className="flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl border border-red-200 text-red-600 font-semibold hover:bg-red-50 transition-colors text-sm"
                    >
                        <Trash2 className="w-4 h-4" /> Hapus
                    </button>
                    <button 
                        onClick={() => setSelectedTx(null)}
                        className="flex-1 py-2.5 px-4 rounded-xl bg-black text-white font-semibold hover:bg-gray-800 transition-colors text-sm shadow-md shadow-gray-200"
                    >
                        Tutup
                    </button>
                </div>

            </div>
        </div>
      )}

    </div>
  );
}