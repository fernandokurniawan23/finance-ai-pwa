"use client";

import { useLiveQuery } from "dexie-react-hooks";
import { db } from "@/lib/db";
import { useMemo } from "react";
import { 
  PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, 
  XAxis, YAxis, Tooltip, Legend, CartesianGrid 
} from "recharts";
import { ArrowLeft, TrendingUp, TrendingDown, CreditCard } from "lucide-react";
import Link from "next/link";

const COLORS = [
  "#3b82f6", "#10b981", "#f59e0b", "#ef4444", 
  "#8b5cf6", "#ec4899", "#06b6d4", "#6366f1"
];

// Helper: Format angka jadi pendek
const formatCompactNumber = (number: number) => {
  if (number >= 1000000000) {
    return (number / 1000000000).toFixed(0) + 'M'; // Milyar
  } else if (number >= 1000000) {
    return (number / 1000000).toFixed(0) + 'jt'; // Juta
  } else if (number >= 1000) {
    return (number / 1000).toFixed(0) + 'rb'; // Ribu
  }
  return number.toString();
};

interface MonthlyChartData {
  name: string;
  income: number;
  expense: number;
  rawDate: Date;
}

export default function StatsPage() {
  const transactions = useLiveQuery(() => db.transactions.toArray());

  const categoryData = useMemo(() => {
    if (!transactions) return [];
    const expenses = transactions.filter(t => t.type === "EXPENSE");
    
    const grouped = expenses.reduce((acc, curr) => {
      acc[curr.category] = (acc[curr.category] || 0) + curr.amount;
      return acc;
    }, {} as Record<string, number>);

    return Object.keys(grouped).map((key) => ({
      name: key,
      value: grouped[key]
    })).sort((a, b) => b.value - a.value);
  }, [transactions]);

  const monthlyData = useMemo(() => {
    if (!transactions) return [];

    const grouped = transactions.reduce((acc, curr) => {
      const date = new Date(curr.date);
      const key = date.toLocaleString("id-ID", { month: "short", year: "2-digit" });

      if (!acc[key]) {
        acc[key] = { name: key, income: 0, expense: 0, rawDate: date };
      }
      
      if (curr.type === "INCOME") acc[key].income += curr.amount;
      else acc[key].expense += curr.amount;

      return acc;
    }, {} as Record<string, MonthlyChartData>);

    return Object.values(grouped).sort((a, b) => a.rawDate.getTime() - b.rawDate.getTime());
  }, [transactions]);

  const summary = useMemo(() => {
    if (!transactions) return { income: 0, expense: 0, balance: 0 };
    const income = transactions.filter(t => t.type === "INCOME").reduce((acc, t) => acc + t.amount, 0);
    const expense = transactions.filter(t => t.type === "EXPENSE").reduce((acc, t) => acc + t.amount, 0);
    return { income, expense, balance: income - expense };
  }, [transactions]);

  if (!transactions) return <p className="p-8 text-center text-gray-500">Memuat data...</p>;

  return (
    <div className="min-h-screen bg-gray-50 pb-10">
      <div className="bg-white p-4 border-b border-gray-200 sticky top-0 z-10 flex items-center gap-3 shadow-sm">
        <Link href="/" className="p-2 hover:bg-gray-100 rounded-full transition-colors text-black">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <h1 className="text-lg font-bold text-black">Analisis Keuangan</h1>
      </div>

      <div className="p-4 space-y-6">

        {/* RINGKASAN */}
        <div className="grid grid-cols-2 gap-4">
            <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
                <div className="flex items-center gap-2 mb-2 text-gray-500">
                    <TrendingUp className="w-4 h-4 text-green-600" />
                    <span className="text-xs font-medium uppercase">Pemasukan</span>
                </div>
                <p className="text-lg font-bold text-black">Rp {summary.income.toLocaleString("id-ID")}</p>
            </div>
            <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
                <div className="flex items-center gap-2 mb-2 text-gray-500">
                    <TrendingDown className="w-4 h-4 text-red-600" />
                    <span className="text-xs font-medium uppercase">Pengeluaran</span>
                </div>
                <p className="text-lg font-bold text-black">Rp {summary.expense.toLocaleString("id-ID")}</p>
            </div>
        </div>
        
        {/* CHART 1: BAR CHART (ARUS KAS) */}
        <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-200">
          <h3 className="text-sm font-bold text-black mb-6 flex items-center gap-2">
            <CreditCard className="w-4 h-4" /> Arus Kas Bulanan
          </h3>

          {monthlyData.length > 0 ? (
            <div className="h-[250px] w-full text-xs">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={monthlyData} margin={{ top: 10, right: 0, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e5e5" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} dy={10} />
                  
                  <YAxis 
                    axisLine={false} 
                    tickLine={false} 
                    width={40} 
                    tickFormatter={formatCompactNumber}
                    tick={{ fontSize: 10, fill: '#737373' }}
                  />
                  
                  <Tooltip 
                    cursor={{ fill: '#f5f5f5' }}
                    contentStyle={{ borderRadius: '8px', border: '1px solid #e5e5e5', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                    formatter={(value) => `Rp ${Number(value).toLocaleString("id-ID")}`}
                  />
                  <Legend verticalAlign="top" height={36} iconType="circle" />
                  <Bar dataKey="income" name="Masuk" fill="#10b981" radius={[4, 4, 0, 0]} barSize={20} />
                  <Bar dataKey="expense" name="Keluar" fill="#ef4444" radius={[4, 4, 0, 0]} barSize={20} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-[200px] flex items-center justify-center text-gray-400 text-sm border border-dashed border-gray-200 rounded-lg">
              Belum ada data history.
            </div>
          )}
        </div>

        {/* CHART 2: PIE CHART (KOMPOSISI) */}
        <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-200">
          <h3 className="text-sm font-bold text-black mb-2 flex items-center gap-2">
            <TrendingDown className="w-4 h-4" /> Komposisi Pengeluaran
          </h3>
          
          {categoryData.length > 0 ? (
            <div className="h-[300px] w-full relative">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={categoryData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {categoryData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} stroke="none" />
                    ))}
                  </Pie>
                  <Tooltip 
                     formatter={(value) => `Rp ${Number(value).toLocaleString("id-ID")}`}
                     contentStyle={{ borderRadius: '8px', border: '1px solid #e5e5e5' }}
                  />
                  <Legend iconType="circle" layout="horizontal" verticalAlign="bottom" align="center" />
                </PieChart>
              </ResponsiveContainer>
              
              <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-[60%] text-center pointer-events-none">
                 <p className="text-[10px] text-gray-400 uppercase tracking-wide">Total</p>
                 <p className="text-sm font-bold text-black">
                    {categoryData.length > 0 ? (categoryData.length + " Kat") : "0"}
                 </p>
              </div>
            </div>
          ) : (
            <div className="h-[200px] flex items-center justify-center text-gray-400 text-sm border border-dashed border-gray-200 rounded-lg mt-4">
              Belum ada pengeluaran.
            </div>
          )}
        </div>

      </div>
    </div>
  );
}