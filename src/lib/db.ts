import Dexie, { type Table } from 'dexie';

export interface LocalTransaction {
  id: string; // UUID
  type: 'INCOME' | 'EXPENSE';
  amount: number;
  date: string;
  counterparty: string;
  description: string;
  method: string;
  linked_payment_id?: string;
  updated_at: string;
  is_synced: number; // 0 for false, 1 for true
}

export interface LocalPayment {
  id: string;
  payee: string;
  amount: number;
  due_date: string;
  status: 'PENDING' | 'PAID';
  notes: string;
  updated_at: string;
  is_synced: number;
}

export interface LocalWeeklyPeriod {
  id: string;
  week_start_date: string;
  opening_balance: number;
  updated_at: string;
  is_synced: number;
}

export class FinTrackDB extends Dexie {
  transactions!: Table<LocalTransaction>;
  payments!: Table<LocalPayment>;
  weeks!: Table<LocalWeeklyPeriod>;

  constructor() {
    super('FinTrackDB');
    this.version(1).stores({
      transactions: 'id, type, date, method, is_synced',
      payments: 'id, due_date, status, is_synced',
      weeks: 'id, week_start_date, is_synced'
    });
  }
}

export const db = new FinTrackDB();
