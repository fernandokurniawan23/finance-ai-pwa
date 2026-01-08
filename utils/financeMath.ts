import { Transaction } from "@/lib/db";

export interface ProjectionPoint {
  day: number;
  actual: number | null;
  projected: number | null;
}

export interface ProjectionResult {
  totalProjected: number;
  chartData: ProjectionPoint[];
}

/**
 * Calculates the median value of an array of numbers.
 * Used to filter out spending outliers.
 */
const calculateMedian = (values: number[]): number => {
  if (values.length === 0) return 0;
  
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  
  return sorted.length % 2 !== 0 
    ? sorted[mid] 
    : (sorted[mid - 1] + sorted[mid]) / 2;
};

/**
 * Generates a monthly spending projection using Day-of-Week Median analysis.
 * * @param transactions - List of all transactions from the database.
 * @returns {ProjectionResult} Object containing total projected spend and chart data points.
 */
export const calculateMonthlyProjection = (
  transactions: Transaction[]
): ProjectionResult => {
  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();
  const todayDate = now.getDate();
  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();

  const monthlyExpenses = transactions.filter(t => {
    const d = new Date(t.date);
    return d.getMonth() === currentMonth && 
           d.getFullYear() === currentYear && 
           t.type === "EXPENSE";
  });

  const dayBuckets: Record<number, number[]> = { 0: [], 1: [], 2: [], 3: [], 4: [], 5: [], 6: [] };
  const dailyRealMap: Record<number, number> = {};
  
  monthlyExpenses.forEach(t => {
    const d = new Date(t.date);
    dayBuckets[d.getDay()].push(t.amount);
    
    const dateNum = d.getDate();
    dailyRealMap[dateNum] = (dailyRealMap[dateNum] || 0) + t.amount;
  });

  const dailyMedians = Object.keys(dayBuckets).map(key => 
    calculateMedian(dayBuckets[Number(key)])
  );

  const allAmounts = monthlyExpenses.map(t => t.amount);
  const globalMedian = calculateMedian(allAmounts);
  const finalDailyPredictions = dailyMedians.map(v => v === 0 ? globalMedian : v);

  const chartData: ProjectionPoint[] = [];
  let runningTotal = 0;

  for (let day = 1; day <= daysInMonth; day++) {
    if (day <= todayDate) {
      const dailySpend = dailyRealMap[day] || 0;
      runningTotal += dailySpend;
      
      chartData.push({
        day,
        actual: runningTotal,
        projected: null
      });
    } else {
      const futureDate = new Date(currentYear, currentMonth, day);
      runningTotal += finalDailyPredictions[futureDate.getDay()];

      chartData.push({
        day,
        actual: null,
        projected: runningTotal
      });
    }
  }

  return {
    totalProjected: runningTotal,
    chartData
  };
};