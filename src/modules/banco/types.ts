export const BANK_TRANSACTION_TYPES = ["ingreso", "gasto"] as const;

export type BankTransactionType = (typeof BANK_TRANSACTION_TYPES)[number];

export type BankAccountRecord = {
  id: string;
  user_id: string;
  name: string;
  company_name: string | null;
  currency: string;
  initial_balance: number;
  created_at: string;
  updated_at: string;
};

export type BankTransactionRecord = {
  id: string;
  user_id: string;
  account_id: string;
  transaction_date: string;
  type: BankTransactionType;
  category: string;
  provider: string | null;
  description: string | null;
  document_number: string | null;
  net_amount: number;
  vat_amount: number;
  total_amount: number;
  file_name: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
};

export type BankTransactionInput = {
  transaction_date: string;
  type: BankTransactionType;
  category: string;
  provider?: string;
  description?: string;
  document_number?: string;
  net_amount: number;
  vat_amount?: number;
  total_amount: number;
  file_name?: string;
  notes?: string;
};

export type BankPageData = {
  account: BankAccountRecord;
  transactions: BankTransactionRecord[];
};
