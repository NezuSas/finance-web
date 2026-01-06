import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/lib/db';

export function useFinanceData() {
  
  // Real-time updates from Dexie
  const localTransactions = useLiveQuery(() => db.transactions.toArray(), []) || [];
  const localPayments = useLiveQuery(() => db.payments.toArray(), []) || [];
  const localWeeks = useLiveQuery(() => db.weeks.toArray(), []) || [];

  // Get current local date
  const todayStr = new Date().toLocaleDateString('en-CA');

  // Pick the most recent week that has already started (on or before today)
  const currentWeek = localWeeks
    .filter(w => w.week_start_date <= todayStr)
    .sort((a, b) => b.week_start_date.localeCompare(a.week_start_date))[0] 
    || localWeeks.sort((a, b) => b.week_start_date.localeCompare(a.week_start_date))[0];

  const weekStart = currentWeek ? currentWeek.week_start_date : '1970-01-01';

  // Calculate Balances for the current week scope
  const totalIncome = localTransactions
    .filter(t => t.type === 'INCOME' && t.date >= weekStart)
    .reduce((sum, t) => sum + Number(t.amount), 0);

  const totalExpense = localTransactions
    .filter(t => t.type === 'EXPENSE' && t.date >= weekStart)
    .reduce((sum, t) => sum + Number(t.amount), 0);

  const openingBalance = currentWeek ? Number(currentWeek.opening_balance) : 0;
  const currentBalance = openingBalance + totalIncome - totalExpense;

  return {
    transactions: localTransactions,
    payments: localPayments,
    weeks: localWeeks,
    currentWeek,
    summary: {
      totalIncome,
      totalExpense,
      openingBalance,
      currentBalance,
    }
  };
}
