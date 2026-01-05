import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/lib/db';

export function useFinanceData() {
  
  // Real-time updates from Dexie
  const localTransactions = useLiveQuery(() => db.transactions.toArray(), []) || [];
  const localPayments = useLiveQuery(() => db.payments.toArray(), []) || [];
  const localWeeks = useLiveQuery(() => db.weeks.toArray(), []) || [];

  // Calculate Balances
  const totalIncome = localTransactions
    .filter(t => t.type === 'INCOME')
    .reduce((sum, t) => sum + Number(t.amount), 0);

  const totalExpense = localTransactions
    .filter(t => t.type === 'EXPENSE')
    .reduce((sum, t) => sum + Number(t.amount), 0);

  // For MVP, we'll use the most recent week opening balance
  const currentWeek = localWeeks.sort((a, b) => 
    new Date(b.week_start_date).getTime() - new Date(a.week_start_date).getTime()
  )[0];

  const openingBalance = currentWeek ? Number(currentWeek.opening_balance) : 0;
  const currentBalance = openingBalance + totalIncome - totalExpense;

  return {
    transactions: localTransactions,
    payments: localPayments,
    weeks: localWeeks,
    summary: {
      totalIncome,
      totalExpense,
      openingBalance,
      currentBalance,
    }
  };
}
