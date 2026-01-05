import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/lib/db';

export function useFinanceData() {
  
  // Real-time updates from Dexie
  const localTransactions = useLiveQuery(() => db.transactions.toArray(), []) || [];
  const localPayments = useLiveQuery(() => db.payments.toArray(), []) || [];
  const localWeeks = useLiveQuery(() => db.weeks.toArray(), []) || [];

  // For MVP, we'll use the most recent week opening balance
  const currentWeek = localWeeks.sort((a, b) => 
    new Date(b.week_start_date).getTime() - new Date(a.week_start_date).getTime()
  )[0];

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
