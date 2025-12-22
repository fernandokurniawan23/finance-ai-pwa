import Dexie, { Table } from 'dexie';

export interface Transaction {
  id?: number;
  amount: number;
  type: 'INCOME' | 'EXPENSE';
  category: string;
  description: string;
  date: string;
  createdAt: number;
}

export interface ChatMessage {
  id?: number;
  role: 'user' | 'assistant' | 'system';
  content: string;
  createdAt: number;
}

export interface Budget {
  id?: number;
  category: string;
  limit: number;
}

class FinanceDB extends Dexie {
  transactions!: Table<Transaction>;
  chats!: Table<ChatMessage>;
  budgets!: Table<Budget>;

  constructor() {
    super('FinanceAI_DB');
    this.version(2).stores({
      transactions: '++id, type, category, date, createdAt',
      chats: '++id, createdAt',
      budgets: '++id, &category'
    });
  }
}

export const db = new FinanceDB();