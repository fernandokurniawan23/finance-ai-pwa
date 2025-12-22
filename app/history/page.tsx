"use client";

import { useState, useMemo } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { db, Transaction } from "@/lib/db";
import { ArrowLeft, Trash2, Filter, Calendar } from "lucide-react";
import Link from "next/link";

export default function HistoryPage() {
  // 1. State untuk Filter
  const [selectedPeriod, setSelectedPeriod] = useState<string>("ALL");

  // 2. Ambil SEMUA data dulu
  const allTransactions = useLiveQuery(() => 
    db.transactions.orderBy("date").reverse().toArray()
  );

  // 3. Logic Hapus
  const handleDelete = async (id?: number) => {
    if (!id) return;
    if (confirm("Hapus transaksi ini?")) await db.transactions.delete(id);
  };

  // 4. Generate Opsi Filter
  const filterOptions = useMemo(() => {
    if (!allTransactions) return [];
    
    const uniqueMonths = new Set<string>();
    allTransactions.forEach(t => {
      // format YYYY-MM
      const monthKey = t.date.substring(0, 7); 
      uniqueMonths.add(monthKey);
    });

    // Array descending
    return Array.from(uniqueMonths).sort().reverse();
  }, [allTransactions]);

  // 5. Filter Data berdasarkan State
  const filteredData = useMemo(() => {
    if (!allTransactions) return [];
    if (selectedPeriod === "ALL") return allTransactions;
    return allTransactions.filter(t => t.date.startsWith(selectedPeriod));
  }, [allTransactions, selectedPeriod]);

  // 6. Hitung Total Dinamis
  const summary = useMemo(() => {
    const income = filteredData.reduce((acc, t) => (t.type === "INCOME" ? acc + t.amount : acc), 0);
    const expense = filteredData.reduce((acc, t) => (t.type === "EXPENSE" ? acc + t.amount : acc), 0);
    return { income, expense, balance: income - expense };
  }, [filteredData]);

  // 7. Grouping Data
  const groupedData = useMemo(() => {
    return filteredData.reduce((groups, transaction) => {
      const dateObj = new Date(transaction.date);
      const monthYear = dateObj.toLocaleString("id-ID", { month: "long", year: "numeric" });
      
      if (!groups[monthYear]) groups[monthYear] = [];
      groups[monthYear].push(transaction);
      return groups;
    }, {} as Record<string, Transaction[]>);
  }, [filteredData]);

  // Format label dropdown
  const formatPeriodLabel = (yyyyMm: string) => {
    const [year, month] = yyyyMm.split("-");
    const date = new Date(parseInt(year), parseInt(month) - 1);
    return date.toLocaleString("id-ID", { month: "long", year: "numeric" });
  };

  if (!allTransactions) return <div className="p-8 text-center text-gray-400">Memuat data...</div>;

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      
      {/* HEADER FIXED */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-20">
        <div className="p-4 flex items-center gap-3">
          <Link href="/" className="p-2 hover:bg-gray-100 rounded-full transition-colors">
            <ArrowLeft className="w-5 h-5 text-gray-700" />
          </Link>
          <div className="flex-1">
            <h1 className="text-lg font-bold text-gray-900">Riwayat Transaksi</h1>
          </div>
        </div>

        {/* AREA FILTER */}
        <div className="px-4 pb-4">
          <div className="relative">
            <select
              value={selectedPeriod}
              onChange={(e) => setSelectedPeriod(e.target.value)}
              className="w-full appearance-none bg-gray-100 border border-transparent hover:border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-black focus:border-black block p-3 pl-10 font-medium cursor-pointer transition-all"
            >
              <option value="ALL">Semua Waktu</option>
              {filterOptions.map((period) => (
                <option key={period} value={period}>
                  {formatPeriodLabel(period)}
                </option>
              ))}
            </select>
            {/* Icon Calendar Absolute */}
            <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
              <Calendar className="w-4 h-4 text-gray-500" />
            </div>
            {/* Icon Chevron Custom */}
            <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
              <Filter className="w-4 h-4 text-gray-400" />
            </div>
          </div>
        </div>
      </div>

      {/* CONTENT SCROLLABLE */}
      <div className="flex-1 p-4 pb-10 space-y-6">
        
        {/* SUMMARY CARD */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-green-50 p-4 rounded-xl border border-green-100">
            <p className="text-xs text-green-600 font-bold uppercase mb-1">Pemasukan</p>
            <p className="text-lg font-bold text-green-700 truncate">
              + {summary.income.toLocaleString("id-ID")}
            </p>
          </div>
          <div className="bg-red-50 p-4 rounded-xl border border-red-100">
            <p className="text-xs text-red-600 font-bold uppercase mb-1">Pengeluaran</p>
            <p className="text-lg font-bold text-red-700 truncate">
              - {summary.expense.toLocaleString("id-ID")}
            </p>
          </div>
        </div>

        {/* LIST TRANSAKSI */}
        <div className="space-y-6">
          {Object.keys(groupedData).length === 0 ? (
            <div className="text-center py-10 text-gray-400">
              <p>Tidak ada transaksi pada periode ini.</p>
            </div>
          ) : (
            Object.keys(groupedData).map((monthYear) => (
              <div key={monthYear} className="animate-in fade-in duration-500">
                {selectedPeriod === "ALL" && (
                  <h2 className="text-sm font-bold text-gray-500 mb-3 px-1 uppercase tracking-wider">
                    {monthYear}
                  </h2>
                )}

                <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                  {groupedData[monthYear].map((t, index) => (
                    <div 
                      key={t.id} 
                      className={`flex justify-between items-center p-4 ${
                        index !== groupedData[monthYear].length - 1 ? 'border-b border-gray-50' : ''
                      }`}
                    >
                      <div className="flex-1 min-w-0 pr-4"> {/* min-w-0 for truncation */}
                        <p className="font-bold text-gray-900 text-sm truncate">{t.category}</p>
                        <p className="text-xs text-gray-400 mt-0.5">
                          {new Date(t.date).toLocaleDateString("id-ID", { day: 'numeric', month: 'long', year: 'numeric' })}
                        </p>
                      </div>
                      
                      <div className="flex items-center gap-3 shrink-0">
                        <span className={`font-mono font-bold text-sm whitespace-nowrap ${
                          t.type === "INCOME" ? "text-green-600" : "text-red-600"
                        }`}>
                          {t.type === "INCOME" ? "+" : "-"} {t.amount.toLocaleString("id-ID")}
                        </span>
                        <button 
                          onClick={() => handleDelete(t.id)}
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
    </div>
  );
}