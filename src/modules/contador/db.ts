import { createSupabaseServerClient } from "@/lib/supabase/server";
import type {
  ContadorBankSummary,
  ContadorCheckpointRecord,
  ContadorItemType,
  ContadorPageData,
} from "@/modules/contador/types";

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

export async function getContadorPageData(): Promise<ContadorPageData> {
  const { supabase, userId } = await getContadorContext();

  const [{ data: checkpoints, error: checkpointsError }, { data: transactions, error: transactionsError }] =
    await Promise.all([
      supabase
        .from("contador_checkpoints")
        .select("item_key, item_type, is_completed, completed_at")
        .eq("user_id", userId),
      supabase
        .from("bank_transactions")
        .select("transaction_date, type, total_amount")
        .eq("user_id", userId)
        .order("transaction_date", { ascending: false }),
    ]);

  if (checkpointsError) {
    throw new Error(checkpointsError.message);
  }

  if (transactionsError) {
    throw new Error(transactionsError.message);
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
  };
}

export function getContadorFallbackData(): ContadorPageData {
  return {
    checkpoints: {},
    bankSummary: getFallbackBankSummary(),
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
