import { db } from "./db";

export async function getFinancialContext(): Promise<string> {
  // 1. Ambil Data Transaksi 30 Hari Terakhir
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  const dateStr = thirtyDaysAgo.toISOString().split('T')[0];
  const currentMonth = new Date().toISOString().substring(0, 7); // "2025-12"

  const transactions = await db.transactions
    .where("date")
    .aboveOrEqual(dateStr)
    .toArray();

  const budgets = await db.budgets.toArray();

  // 2. Hitung Status Budget
  let budgetAlerts = "";
  if (budgets.length > 0) {
    const monthlyExpenses = transactions.filter(t => 
      t.type === "EXPENSE" && t.date.startsWith(currentMonth)
    );

    const alerts = budgets.map(b => {
      const spent = monthlyExpenses
        .filter(t => t.category === b.category)
        .reduce((sum, t) => sum + t.amount, 0);
      
      if (spent > b.limit) {
        return `- BAHAYA: User sudah BOROS di kategori '${b.category}'. Terpakai Rp ${spent} dari batas Rp ${b.limit}. MARAHI user tentang ini!`;
      } else if (spent > b.limit * 0.8) {
        return `- WARNING: Kategori '${b.category}' sudah hampir habis (80%). Beri peringatan.`;
      }
      return null;
    }).filter(Boolean); // Hapus null

    if (alerts.length > 0) {
      budgetAlerts = `
      STATUS BUDGET (PENTING!):
      ${alerts.join("\n")}
      `;
    }
  }

  // 3. Ringkasan Transaksi Biasa
  let totalIncome = 0;
  let totalExpense = 0;
  
  const historyString = transactions.map(t => {
    if (t.type === 'INCOME') totalIncome += t.amount;
    else totalExpense += t.amount;
    
    const detailText = t.description && t.description !== t.category 
      ? `(Detail: ${t.description})` 
      : "";

    return `- ${t.date}: ${t.type} - ${t.category} ${detailText} -> Rp ${t.amount}`;
  }).join("\n");

  // 4. Return Context
  return `
    RINGKASAN KEUANGAN:
    Total Pemasukan: Rp ${totalIncome}
    Total Pengeluaran: Rp ${totalExpense}
    Sisa Cashflow: Rp ${totalIncome - totalExpense}
    
    ${budgetAlerts}
    
    DETAIL TRANSAKSI:
    ${historyString}
  `;
}