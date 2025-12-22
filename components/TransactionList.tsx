"use client";

import { useLiveQuery } from "dexie-react-hooks";
import { db } from "../lib/db";
import { Trash2, ChevronRight } from "lucide-react";
import Link from "next/link";

export default function TransactionList() {
  // UBID: Batasi hanya 5 transaksi terbaru
  const transactions = useLiveQuery(
    () => db.transactions.orderBy("createdAt").reverse().limit(5).toArray()
  );

  const balance = useLiveQuery(async () => {
    const all = await db.transactions.toArray();
    return all.reduce((acc, curr) => {
      return curr.type === "INCOME" ? acc + curr.amount : acc - curr.amount;
    }, 0);
  });

  const handleDelete = async (id?: number) => {
    if (!id) return;
    if (confirm("Hapus transaksi ini?")) {
      await db.transactions.delete(id);
    }
  };

  if (!transactions) return <p className="text-center py-4 text-gray-400">Memuat data...</p>;

  return (
    <div className="space-y-6">
      {/* Kartu Saldo */}
      <div className="bg-blue-600 text-white p-6 rounded-2xl shadow-xl relative overflow-hidden">
         <div className="relative z-10">
          <p className="text-gray-400 text-xs font-medium uppercase tracking-wider mb-1">Total Saldo</p>
          <h1 className="text-4xl font-bold tracking-tight">
            Rp {balance?.toLocaleString("id-ID") ?? 0}
          </h1>
        </div>
      </div>

      {/* Header Section dengan Tombol "Lihat Semua" */}
      <div className="flex justify-between items-end">
        <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider">
          Riwayat Terbaru
        </h3>
        <Link href="/history" className="text-xs font-bold text-blue-600 flex items-center hover:underline">
          Lihat Semua <ChevronRight className="w-3 h-3 ml-1" />
        </Link>
      </div>
      
      {/* List 5 Transaksi */}
      {transactions.length === 0 ? (
        <div className="text-center p-8 bg-gray-100 rounded-xl border border-dashed border-gray-300 text-gray-400">
          <p>Belum ada data.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {transactions.map((t) => (
<div
                key={t.id}
                className="flex justify-between items-center bg-white p-4 rounded-xl border border-gray-100 shadow-sm"
              >
                <div className="flex-1 overflow-hidden pr-2">
                  {/* Kategori Utama (Bold) */}
                  <p className="font-bold text-gray-900 text-sm truncate">
                    {t.category}
                  </p>
                  
                  {/* Detail Deskripsi (Lebih kecil & abu-abu) */}
                  {/* Menampilkan deskripsi jika ada dan beda dengan kategori */}
                  <p className="text-xs text-gray-500 truncate mt-0.5 italic">
                    {t.description && t.description !== t.category 
                      ? t.description 
                      : t.date // Kalau gak ada deskripsi, tampilkan tanggal aja
                    }
                  </p>
                </div>
                
                <div className="flex items-center gap-3 shrink-0">
                  <span
                    className={`font-mono font-bold text-sm ${
                      t.type === "INCOME" ? "text-green-600" : "text-red-600"
                    }`}
                  >
                    {t.type === "INCOME" ? "+" : "-"} Rp {t.amount.toLocaleString("id-ID")}
                  </span>
                  
                  <button
                    onClick={() => handleDelete(t.id)}
                    className="p-2 text-gray-300 hover:text-red-600 hover:bg-red-50 rounded-full transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
          ))}
        </div>
      )}
    </div>
  );
}