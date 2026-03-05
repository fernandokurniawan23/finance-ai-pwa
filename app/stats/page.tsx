"use client";

import { useLiveQuery } from "dexie-react-hooks";
import { db } from "@/lib/db";
import { useMemo } from "react";
import { 
  PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, 
  XAxis, YAxis, Tooltip, Legend, CartesianGrid, 
  ComposedChart, Area, Line 
} from "recharts";
import { ArrowLeft, TrendingUp, TrendingDown, Wallet, Sparkles, PieChart as PieIcon, MoveHorizontal } from "lucide-react";
import Link from "next/link";
import { calculateMonthlyProjection } from "@/utils/financeMath";

const COLORS = [
  "#3b82f6", "#10b981", "#f59e0b", "#ef4444", 
  "#8b5cf6", "#ec4899", "#06b6d4", "#6366f1"
];

const formatCompactNumber = (number: number) => {
  if (number >= 1000000000000) {
    const val = (number / 1000000000000).toFixed(1);
    return (val.endsWith('.0') ? val.slice(0, -2) : val) + 'T';
  }
  if (number >= 1000000000) {
    const val = (number / 1000000000).toFixed(1);
    return (val.endsWith('.0') ? val.slice(0, -2) : val) + 'M';
  }
  if (number >= 1000000) {
    const val = (number / 1000000).toFixed(1);
    return (val.endsWith('.0') ? val.slice(0, -2) : val) + 'jt';
  }
  if (number >= 1000) {
    return (number / 1000).toFixed(0) + 'rb';
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

  // --- Logic Data Processing ---
  const categoryData = useMemo(() => {
    if (!transactions) return [];
    const expenses = transactions.filter(t => t.type === "EXPENSE");
    const grouped = expenses.reduce((acc, curr) => {
      acc[curr.category] = (acc[curr.category] || 0) + curr.amount;
      return acc;
    }, {} as Record<string, number>);
    return Object.keys(grouped).map((key) => ({
      name: key, value: grouped[key]
    })).sort((a, b) => b.value - a.value);
  }, [transactions]);

  const monthlyData = useMemo(() => {
    if (!transactions) return [];
    const grouped = transactions.reduce((acc, curr) => {
      const date = new Date(curr.date);
      const key = date.toLocaleString("id-ID", { month: "short", year: "2-digit" });
      if (!acc[key]) acc[key] = { name: key, income: 0, expense: 0, rawDate: date };
      
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

  const projection = useMemo(() => {
    if (!transactions || transactions.length === 0) return null;
    return calculateMonthlyProjection(transactions);
  }, [transactions]);

  // --- Render ---
  if (!transactions) return <div className="p-8 text-center text-gray-500 animate-pulse">Memuat data...</div>;

  return (
    <div className="min-h-screen bg-gray-50 pb-20 font-sans">
      
      {/* 1. Header */}
      <div className="sticky top-0 z-20 bg-white/80 backdrop-blur-md border-b border-gray-200 px-4 py-3 flex items-center gap-3 shadow-sm transition-all">
        <Link href="/" className="p-2 -ml-2 hover:bg-gray-100 rounded-full transition-colors text-gray-800">
          <ArrowLeft className="w-6 h-6" />
        </Link>
        <h1 className="text-xl font-bold text-gray-900 tracking-tight">Analisis Keuangan</h1>
      </div>

      <div className="p-4 space-y-6 max-w-4xl mx-auto">

        {/* 2. Summary Cards */}
        <div className="grid grid-cols-2 md:grid-cols-2 gap-3">
            {/* Income Card */}
            <div className="bg-emerald-50/50 p-4 rounded-2xl border border-emerald-100 shadow-sm relative overflow-hidden">
                <div className="flex items-center gap-2 mb-1 z-10 relative">
                    <div className="p-1.5 bg-white rounded-full shadow-sm">
                        <TrendingUp className="w-4 h-4 text-emerald-600" />
                    </div>
                    <span className="text-xs font-bold text-emerald-700 uppercase tracking-wider">Masuk</span>
                </div>
                <p className="text-lg font-extrabold text-emerald-900 z-10 relative truncate">
                    Rp {formatCompactNumber(summary.income)}
                </p>
                <div className="absolute -right-4 -bottom-4 w-16 h-16 bg-emerald-200/20 rounded-full blur-xl"></div>
            </div>

            {/* Expense Card */}
            <div className="bg-rose-50/50 p-4 rounded-2xl border border-rose-100 shadow-sm relative overflow-hidden">
                <div className="flex items-center gap-2 mb-1 z-10 relative">
                    <div className="p-1.5 bg-white rounded-full shadow-sm">
                        <TrendingDown className="w-4 h-4 text-rose-600" />
                    </div>
                    <span className="text-xs font-bold text-rose-700 uppercase tracking-wider">Keluar</span>
                </div>
                <p className="text-lg font-extrabold text-rose-900 z-10 relative truncate">
                    Rp {formatCompactNumber(summary.expense)}
                </p>
                 <div className="absolute -right-4 -bottom-4 w-16 h-16 bg-rose-200/20 rounded-full blur-xl"></div>
            </div>
        </div>

        {/* 3. Smart Forecast */}
        {projection && projection.totalProjected > 0 && (
          <div className="bg-white p-5 rounded-3xl border border-indigo-100 shadow-lg shadow-indigo-100/50 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-50 rounded-bl-full -z-0 opacity-50"></div>
            
            <div className="relative z-10 flex justify-between items-start mb-4">
              <div>
                <h3 className="text-sm font-bold text-indigo-950 flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-indigo-500 fill-indigo-500" />
                  Smart Forecast
                </h3>
                <p className="text-[11px] text-gray-500 mt-1 max-w-[200px] leading-snug">
                  Estimasi harian (Median).
                </p>
              </div>
              <div className="text-right">
                 <p className="text-xs text-indigo-400 font-medium mb-0.5">Proyeksi</p>
                 <p className="text-2xl font-black text-indigo-600 tracking-tight">
                    {formatCompactNumber(projection.totalProjected)}
                 </p>
              </div>
            </div>

            {/* --- RESPONSIVE CHART WRAPPER --- */}
            <div className="w-full overflow-x-auto pb-2 scrollbar-hide">
              {/* logic responsive chart Width */}
              <div className="h-[250px] min-w-[700px] md:min-w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart data={projection.chartData} margin={{ top: 10, right: 20, left: -10, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorActual" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#6366f1" stopOpacity={0.4}/>
                        <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    
                    <XAxis 
                      dataKey="day" 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{ fontSize: 11, fill: '#000000', fontWeight: 600 }} 
                      interval={0}
                      dy={10}
                    />
                    
                    <YAxis 
                      axisLine={false} 
                      tickLine={false} 
                      width={55} 
                      tickFormatter={formatCompactNumber} 
                      tick={{ fontSize: 11, fill: '#000000' }} 
                    />
                    
                    <Tooltip 
                      labelFormatter={(day) => `Tgl ${day}`}
                      labelStyle={{ color: '#000000'}}
                      formatter={(value, name) => [
                        `Rp ${Number(value).toLocaleString("id-ID")}`, 
                        name === 'actual' ? 'Aktual' : 'Proyeksi'
                      ]}
                      contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', fontSize: '12px' }}
                    />
                    
                    <Area 
                      type="monotone" 
                      dataKey="actual" 
                      stroke="#6366f1" 
                      fillOpacity={1} 
                      fill="url(#colorActual)" 
                      strokeWidth={3}
                      activeDot={{ r: 6, strokeWidth: 0 }} 
                    />
                    <Line 
                      type="monotone" 
                      dataKey="projected" 
                      stroke="#fbbf24" 
                      strokeDasharray="4 4" 
                      strokeWidth={3} 
                      dot={false}
                      connectNulls
                    />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>
            </div>
            
            {/* indikator for mobile */}
            <div className="flex md:hidden justify-center items-center gap-1 text-[10px] text-gray-400 mt-1">
                <MoveHorizontal className="w-3 h-3" /> Geser untuk detail
            </div>
          </div>
        )}
        
        {/* 4. Arus Kas Bulanan */}
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100">
          <h3 className="text-sm font-bold text-gray-900 mb-4 flex items-center gap-2">
            <Wallet className="w-4 h-4 text-gray-500" /> Arus Kas Bulanan
          </h3>

          {monthlyData.length > 0 ? (
            <>
                <div className="w-full overflow-x-auto pb-2 scrollbar-hide">
                    {/* logic responsive chart Width*/}
                    <div 
                      className={`h-[250px] md:min-w-full ${monthlyData.length > 4 ? 'min-w-[600px]' : 'w-full'}`}
                    >
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={monthlyData} margin={{ top: 0, right: 0, left: -10, bottom: 0 }} barGap={6}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                            <XAxis 
                                dataKey="name" 
                                axisLine={false} 
                                tickLine={false} 
                                dy={10} 
                                tick={{ fontSize: 11, fill: '#000000', fontWeight: 700 }}
                            />
                            
                            <YAxis 
                                axisLine={false} 
                                tickLine={false} 
                                width={55} 
                                tickFormatter={formatCompactNumber}
                                tick={{ fontSize: 11, fill: '#000000' }}
                            />
                            <Tooltip 
                                cursor={{ fill: '#f8fafc' }}
                                contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                labelStyle={{ color: '#000000'}}
                                formatter={(value) => `Rp ${Number(value).toLocaleString("id-ID")}`}
                            />
                            <Legend verticalAlign="top" height={36} iconType="circle" iconSize={8} />
                            
                            <Bar dataKey="income" name="Masuk" fill="#10b981" radius={[4, 4, 0, 0]} barSize={32} />
                            <Bar dataKey="expense" name="Keluar" fill="#ef4444" radius={[4, 4, 0, 0]} barSize={32} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>
                {/* indicator for mobile */}
                {monthlyData.length > 4 && (
                     <div className="flex md:hidden justify-center items-center gap-1 text-[10px] text-gray-400 mt-1">
                        <MoveHorizontal className="w-3 h-3" /> Geser untuk detail
                    </div>
                )}
            </>
          ) : (
             <EmptyState text="Belum ada data history." />
          )}
        </div>

        {/* 5. Pie Chart */}
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100">
          <h3 className="text-sm font-bold text-gray-900 mb-2 flex items-center gap-2">
            <PieIcon className="w-4 h-4 text-gray-500" /> Komposisi Pengeluaran
          </h3>
          
          {categoryData.length > 0 ? (
            <div className="h-[320px] w-full relative">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={categoryData}
                    cx="50%"
                    cy="45%"
                    innerRadius={70}
                    outerRadius={90}
                    paddingAngle={4}
                    dataKey="value"
                    cornerRadius={4}
                  >
                    {categoryData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} stroke="white" strokeWidth={2} />
                    ))}
                  </Pie>
                  <Tooltip 
                      formatter={(value) => `Rp ${Number(value).toLocaleString("id-ID")}`}
                      contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                  />
                  <Legend iconType="circle" layout="horizontal" verticalAlign="bottom" align="center" wrapperStyle={{ fontSize: '11px', paddingTop: '20px' }} />
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute top-[45%] left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-center pointer-events-none">
                 <p className="text-[10px] text-gray-400 uppercase tracking-wider font-semibold">Total</p>
                 <p className="text-xl font-black text-gray-800 leading-none mt-1">{categoryData.length}</p>
                 <p className="text-[9px] text-gray-400">Kategori</p>
              </div>
            </div>
          ) : (
            <EmptyState text="Belum ada pengeluaran." />
          )}
        </div>

      </div>
    </div>
  );
}

function EmptyState({ text }: { text: string }) {
    return (
        <div className="h-[200px] flex flex-col items-center justify-center text-gray-400 text-sm border-2 border-dashed border-gray-100 rounded-xl bg-gray-50/50 mt-4">
            <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center mb-3">
                <Sparkles className="w-5 h-5 text-gray-300" />
            </div>
            {text}
        </div>
    );
}