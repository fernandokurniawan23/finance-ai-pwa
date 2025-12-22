"use client";

import { useState } from "react";
import { ArrowLeft, Download, Upload, AlertTriangle, ShieldCheck } from "lucide-react";
import Link from "next/link";
import { exportData, importData } from "@/lib/backup-helper";
import { useRouter } from "next/navigation";

export default function SettingsPage() {
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  // Handle Download
  const handleBackup = async () => {
    setIsLoading(true);
    try {
      await exportData();
      alert("Backup berhasil didownload! Simpan file ini di tempat aman (Google Drive/iCloud).");
    } catch (error) {
      alert("Gagal backup data.");
    } finally {
      setIsLoading(false);
    }
  };

  // Handle Upload
  const handleRestore = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!confirm("PERINGATAN: Restore akan MENGHAPUS data yang ada sekarang dan menggantinya dengan data dari file backup. Lanjutkan?")) {
      // Reset input agar bisa pilih file yang sama lagi kalau batal
      e.target.value = ""; 
      return;
    }

    setIsLoading(true);
    try {
      await importData(file);
      alert("Data berhasil dipulihkan!");
      router.push("/"); // Kembali ke dashboard
    } catch (error) {
      alert("Gagal restore: Format file salah atau rusak.");
    } finally {
      setIsLoading(false);
      e.target.value = "";
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-10">
      {/* Header */}
      <div className="bg-white p-4 border-b border-gray-200 sticky top-0 z-10 flex items-center gap-3">
        <Link href="/" className="p-2 hover:bg-gray-100 rounded-full transition-colors">
          <ArrowLeft className="w-5 h-5 text-gray-700" />
        </Link>
        <h1 className="text-lg font-bold text-gray-900">Pengaturan & Data</h1>
      </div>

      <div className="p-4 space-y-6">
        
        {/* Card Info */}
        <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 flex gap-3 items-start">
          <ShieldCheck className="w-6 h-6 text-blue-600 shrink-0 mt-0.5" />
          <div>
            <h3 className="font-bold text-blue-900 text-sm">Data Tersimpan Lokal</h3>
            <p className="text-xs text-blue-700 mt-1 leading-relaxed">
              Semua data keuanganmu tersimpan di dalam memori browser HP ini. 
              Kami tidak menyimpannya di server. Lakukan Backup rutin agar data tidak hilang.
            </p>
          </div>
        </div>

        {/* Action Area */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          
          {/* Tombol Backup */}
          <div className="p-4 border-b border-gray-100">
            <h3 className="font-bold text-gray-900 mb-1">Backup Data</h3>
            <p className="text-xs text-gray-500 mb-4">Download semua transaksi ke file JSON.</p>
            
            <button
              onClick={handleBackup}
              disabled={isLoading}
              className="w-full flex items-center justify-center gap-2 bg-black text-white py-3 rounded-lg font-bold hover:bg-gray-800 transition-colors disabled:opacity-50"
            >
              <Download className="w-4 h-4" />
              {isLoading ? "Memproses..." : "Download Backup"}
            </button>
          </div>

          {/* Tombol Restore */}
          <div className="p-4">
            <h3 className="font-bold text-gray-900 mb-1">Restore Data</h3>
            <p className="text-xs text-gray-500 mb-4">Upload file JSON untuk mengembalikan data.</p>
            
            <div className="relative">
               {/* Input File Hidden tapi menutupi tombol */}
               <input 
                  type="file" 
                  accept=".json"
                  onChange={handleRestore}
                  disabled={isLoading}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
               />
               <button
                disabled={isLoading}
                className="w-full flex items-center justify-center gap-2 bg-white text-red-600 border border-red-200 py-3 rounded-lg font-bold hover:bg-red-50 transition-colors"
              >
                <Upload className="w-4 h-4" />
                Upload File Restore
              </button>
            </div>
            
            <div className="flex items-center gap-2 mt-3 text-red-500 bg-red-50 p-2 rounded-lg">
                <AlertTriangle className="w-4 h-4" />
                <span className="text-[10px] font-medium">Warning: Data saat ini akan ditimpa.</span>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}