import { db, Transaction } from "./db";

/**
 * 1. BACKUP: Mengambil semua data DB dan mendownloadnya sebagai JSON
 */
export async function exportData() {
  try {
    // Ambil semua transaksi
    const transactions = await db.transactions.toArray();
    
    // Bungkus dalam object agar scalable
    const backupData = {
      version: 1,
      timestamp: new Date().toISOString(),
      data: {
        transactions,
      },
    };

    // Blob dan Link Download
    const blob = new Blob([JSON.stringify(backupData, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    
    // Trigger download element
    const a = document.createElement("a");
    a.href = url;
    a.download = `finance-backup-${new Date().toISOString().split("T")[0]}.json`;
    document.body.appendChild(a);
    a.click();
    
    // Cleanup
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    return true;
  } catch (error) {
    console.error("Backup Failed:", error);
    throw new Error("Gagal melakukan backup data.");
  }
}

/**
 * 2. RESTORE: Membaca file JSON dan memasukkannya ke DB
 */
export async function importData(file: File) {
  return new Promise<void>((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = async (e) => {
      try {
        const text = e.target?.result as string;
        if (!text) throw new Error("File kosong");

        const parsed = JSON.parse(text);

        // VALIDASI SEDERHANA
        if (!parsed.data || !Array.isArray(parsed.data.transactions)) {
          throw new Error("Format file tidak valid atau rusak.");
        }

        const transactions: Transaction[] = parsed.data.transactions;

        // EKSEKUSI DATABASE
        // transaction 'rw' agar atomik 
        await db.transaction("rw", db.transactions, async () => {
          // Opsi A: Hapus data lama, ganti dengan backup
          await db.transactions.clear();
          
          // Masukkan data baru
          await db.transactions.bulkAdd(transactions);
        });

        resolve();
      } catch (err) {
        console.error("Restore Failed:", err);
        reject(err);
      }
    };

    reader.onerror = () => reject(new Error("Gagal membaca file."));
    reader.readAsText(file);
  });
}