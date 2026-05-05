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

export type ContadorTaxDeclaration = {
  id: string;
  declarationType: "f29";
  periodYear: number;
  periodMonth: number;
  periodLabel: string;
  folio: string | null;
  presentedAt: string | null;
  movementStatus: "sin_movimientos" | "con_movimientos";
  netSales: number;
  vatDebit: number;
  vatCredit: number;
  previousCredit: number;
  totalCredit: number;
  ivaCreditToCarry: number;
  amountPaid: number;
  siiCodes: Record<string, number>;
  notes: string | null;
};

export type ContadorPageData = {
  checkpoints: Record<string, boolean>;
  bankSummary: ContadorBankSummary;
  taxDeclarations: ContadorTaxDeclaration[];
};
