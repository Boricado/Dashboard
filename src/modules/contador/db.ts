import { createSupabaseServerClient } from "@/lib/supabase/server";
import type {
  ContadorBankSummary,
  ContadorCheckpointRecord,
  ContadorItemType,
  ContadorPageData,
  ContadorTaxDeclaration,
} from "@/modules/contador/types";

const monthLabels = [
  "Enero",
  "Febrero",
  "Marzo",
  "Abril",
  "Mayo",
  "Junio",
  "Julio",
  "Agosto",
  "Septiembre",
  "Octubre",
  "Noviembre",
  "Diciembre",
] as const;

type TaxDeclarationRow = {
  id: string;
  declaration_type: "f29";
  period_year: number;
  period_month: number;
  folio: string | null;
  presented_at: string | null;
  movement_status: "sin_movimientos" | "con_movimientos";
  net_sales: number | string | null;
  vat_debit: number | string | null;
  vat_credit: number | string | null;
  previous_credit: number | string | null;
  total_credit: number | string | null;
  iva_credit_to_carry: number | string | null;
  amount_paid: number | string | null;
  sii_codes: Record<string, unknown> | null;
  notes: string | null;
};

async function getContadorContext() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("No hay una sesion activa.");
  }

  return { supabase, userId: user.id };
}

function getFallbackBankSummary(): ContadorBankSummary {
  return {
    hasMovements: false,
    transactionCount: 0,
    totalExpenses: 0,
    totalIncome: 0,
    latestTransactionDate: null,
  };
}

function toNumber(value: number | string | null | undefined) {
  if (typeof value === "number") {
    return Number.isFinite(value) ? value : 0;
  }

  if (typeof value === "string") {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : 0;
  }

  return 0;
}

function mapSiiCodes(value: Record<string, unknown> | null) {
  if (!value) {
    return {};
  }

  return Object.fromEntries(
    Object.entries(value).map(([key, amount]) => [key, toNumber(amount as string | number)]),
  );
}

function mapTaxDeclaration(row: TaxDeclarationRow): ContadorTaxDeclaration {
  const monthName = monthLabels[row.period_month - 1] ?? `Mes ${row.period_month}`;

  return {
    id: row.id,
    declarationType: row.declaration_type,
    periodYear: row.period_year,
    periodMonth: row.period_month,
    periodLabel: `${monthName} ${row.period_year}`,
    folio: row.folio,
    presentedAt: row.presented_at,
    movementStatus: row.movement_status,
    netSales: toNumber(row.net_sales),
    vatDebit: toNumber(row.vat_debit),
    vatCredit: toNumber(row.vat_credit),
    previousCredit: toNumber(row.previous_credit),
    totalCredit: toNumber(row.total_credit),
    ivaCreditToCarry: toNumber(row.iva_credit_to_carry),
    amountPaid: toNumber(row.amount_paid),
    siiCodes: mapSiiCodes(row.sii_codes),
    notes: row.notes,
  };
}

export async function getContadorPageData(): Promise<ContadorPageData> {
  const { supabase, userId } = await getContadorContext();

  const [
    { data: checkpoints, error: checkpointsError },
    { data: transactions, error: transactionsError },
    { data: declarations, error: declarationsError },
  ] = await Promise.all([
      supabase
        .from("contador_checkpoints")
        .select("item_key, item_type, is_completed, completed_at")
        .eq("user_id", userId),
      supabase
        .from("bank_transactions")
        .select("transaction_date, type, total_amount")
        .eq("user_id", userId)
        .order("transaction_date", { ascending: false }),
      supabase
        .from("contador_tax_declarations")
        .select(
          "id, declaration_type, period_year, period_month, folio, presented_at, movement_status, net_sales, vat_debit, vat_credit, previous_credit, total_credit, iva_credit_to_carry, amount_paid, sii_codes, notes",
        )
        .eq("user_id", userId)
        .order("period_year", { ascending: false })
        .order("period_month", { ascending: false }),
    ]);

  if (checkpointsError) {
    throw new Error(checkpointsError.message);
  }

  if (transactionsError) {
    throw new Error(transactionsError.message);
  }

  if (declarationsError) {
    throw new Error(declarationsError.message);
  }

  const checkpointMap = Object.fromEntries(
    ((checkpoints ?? []) as ContadorCheckpointRecord[]).map((item) => [item.item_key, item.is_completed]),
  );

  const bankSummary: ContadorBankSummary = {
    hasMovements: (transactions?.length ?? 0) > 0,
    transactionCount: transactions?.length ?? 0,
    totalExpenses: (transactions ?? [])
      .filter((item) => item.type === "gasto")
      .reduce((sum, item) => sum + Number(item.total_amount ?? 0), 0),
    totalIncome: (transactions ?? [])
      .filter((item) => item.type === "ingreso")
      .reduce((sum, item) => sum + Number(item.total_amount ?? 0), 0),
    latestTransactionDate: transactions?.[0]?.transaction_date ?? null,
  };

  return {
    checkpoints: checkpointMap,
    bankSummary,
    taxDeclarations: ((declarations ?? []) as TaxDeclarationRow[]).map(mapTaxDeclaration),
  };
}

export function getContadorFallbackData(): ContadorPageData {
  return {
    checkpoints: {},
    bankSummary: getFallbackBankSummary(),
    taxDeclarations: [],
  };
}

export async function upsertContadorCheckpoint(
  itemKey: string,
  itemType: ContadorItemType,
  isCompleted: boolean,
) {
  const { supabase, userId } = await getContadorContext();

  const { data, error } = await supabase
    .from("contador_checkpoints")
    .upsert(
      {
        user_id: userId,
        item_key: itemKey,
        item_type: itemType,
        is_completed: isCompleted,
        completed_at: isCompleted ? new Date().toISOString() : null,
      },
      {
        onConflict: "user_id,item_key",
      },
    )
    .select("item_key, item_type, is_completed, completed_at")
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return data as ContadorCheckpointRecord;
}
