"use client";

import { useState, useEffect } from "react";
import { db } from "../lib/db";

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

const INCOME_CATEGORIES = [
  "Gaji Utama",
  "Bonus / THR",
  "Freelance / Side Job",
  "Investasi",
  "Hadiah / Hibah",
  "Lainnya"
];

export default function TransactionForm() {
  // Helper untuk Local Timezone
  const getTodayString = () => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState(EXPENSE_CATEGORIES[0]);
  const [description, setDescription] = useState("");
  const [date, setDate] = useState(getTodayString());
  const [type, setType] = useState<"INCOME" | "EXPENSE">("EXPENSE");
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (type === "EXPENSE") setCategory(EXPENSE_CATEGORIES[0]);
    else setCategory(INCOME_CATEGORIES[0]);
  }, [type]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount) return;

    setIsLoading(true);
    try {
      await db.transactions.add({
        amount: parseFloat(amount),
        category,
        description: description || category,
        type,
        date: date,
        createdAt: Date.now(),
      });

      // Reset Form
      setAmount("");
      setDescription("");
      setDate(getTodayString());
    } catch (error) {
      console.error("Gagal simpan:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 mb-6">
      <h2 className="text-lg font-bold mb-4 text-black">Catat Transaksi</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        
        {/* Toggle Button */}
        <div className="flex gap-2 bg-gray-50 p-1 rounded-lg">
          <button
            type="button"
            onClick={() => setType("EXPENSE")}
            className={`flex-1 py-2 rounded-md font-bold text-sm transition-all ${
              type === "EXPENSE"
                ? "bg-white text-red-600 shadow-sm border border-gray-200"
                : "text-gray-400 hover:text-gray-600"
            }`}
          >
            Pengeluaran
          </button>
          <button
            type="button"
            onClick={() => setType("INCOME")}
            className={`flex-1 py-2 rounded-md font-bold text-sm transition-all ${
              type === "INCOME"
                ? "bg-white text-green-600 shadow-sm border border-gray-200"
                : "text-gray-400 hover:text-gray-600"
            }`}
          >
            Pemasukan
          </button>
        </div>

        {/* Input Tanggal */}
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1">
            Tanggal
          </label>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="w-full p-3 border border-gray-200 rounded-lg text-black font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
            required
          />
        </div>

        {/* Input Nominal */}
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1">
            Nominal (Rp)
          </label>
          <input
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="0"
            className="w-full p-3 border border-gray-200 rounded-lg text-xl font-bold text-black focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder:text-gray-300"
            required
          />
        </div>

        {/* Dropdown Kategori */}
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1">
            Kategori
          </label>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="w-full p-3 border border-gray-200 rounded-lg text-black font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
          >
            {(type === "EXPENSE" ? EXPENSE_CATEGORIES : INCOME_CATEGORIES).map((cat) => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
        </div>

        {/* Input Deskripsi */}
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1">
            Catatan Detail (Opsional)
          </label>
          <input
            type="text"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder={
              type === "INCOME" 
                ? "Cth: Proyek Website PT ABC" 
                : "Cth: Nasi Padang + Es Teh"
            }
            className="w-full p-3 border border-gray-200 rounded-lg text-black text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder:text-gray-400"
          />
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className={`w-full py-3.5 rounded-lg font-bold text-white transition-colors shadow-md ${
             type === "INCOME" 
                ? "bg-green-600 hover:bg-green-700" 
                : "bg-black hover:bg-gray-800"
          }`}
        >
          {isLoading ? "Menyimpan..." : "Simpan"}
        </button>
      </form>
    </div>
  );
}