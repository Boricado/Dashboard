export type ContadorItemType = "monthly_tax" | "startup_task" | "annual_obligation";

export type ContadorCheckpointRecord = {
  item_key: string;
  item_type: ContadorItemType;
  is_completed: boolean;
  completed_at: string | null;
};

export type ContadorBankSummary = {
  hasMovements: boolean;
  transactionCount: number;
  totalExpenses: number;
  totalIncome: number;
  latestTransactionDate: string | null;
};

export type ContadorPageData = {
  checkpoints: Record<string, boolean>;
  bankSummary: ContadorBankSummary;
};
