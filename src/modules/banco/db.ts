import { createSupabaseServerClient } from "@/lib/supabase/server";
import type {
  BankAccountRecord,
  BankPageData,
  BankTransactionInput,
  BankTransactionRecord,
} from "@/modules/banco/types";

export const BANK_DOCUMENTS_BUCKET = "bank-documents";

const INITIAL_ACCOUNT = {
  name: "Caja · Banco",
  company_name: "Aguirre Ingenieria SpA",
  currency: "CLP",
  initial_balance: 1_000_000,
};

const INITIAL_TRANSACTIONS = [
  {
    transaction_date: "2026-04-14",
    type: "gasto" as const,
    category: "herramientas",
    provider: "Easy Retail S.A.",
    description: 'Sierra de banco 10" 1800W Einhell TC-TS 20252U + costo despacho',
    document_number: "F-37602746",
    net_amount: 118479,
    vat_amount: 22511,
    total_amount: 140990,
    file_name: "20260414 Easy2.pdf",
    file_path: null,
    file_mime_type: "application/pdf",
    file_size: null,
    notes: null,
  },
  {
    transaction_date: "2026-04-14",
    type: "gasto" as const,
    category: "herramientas",
    provider: "Easy Retail S.A.",
    description: 'Ingleteadora telescopica 8" 1500W Einhell TC-SM 21312 + costo despacho',
    document_number: "F-37602741",
    net_amount: 120992,
    vat_amount: 22988,
    total_amount: 143980,
    file_name: "20260414 Easy.pdf",
    file_path: null,
    file_mime_type: "application/pdf",
    file_size: null,
    notes: null,
  },
];

type BankContext = {
  supabase: Awaited<ReturnType<typeof createSupabaseServerClient>>;
  userId: string;
};

type FileUpdate =
  | {
      mode: "keep";
    }
  | {
      mode: "remove";
    }
  | {
      mode: "replace";
      file_name: string;
      file_path: string;
      file_mime_type: string;
      file_size: number;
    };

export function getBankFallbackData(): BankPageData {
  const now = new Date().toISOString();

  return {
    account: {
      id: "local-bank-account",
      user_id: "local-user",
      name: INITIAL_ACCOUNT.name,
      company_name: INITIAL_ACCOUNT.company_name,
      currency: INITIAL_ACCOUNT.currency,
      initial_balance: INITIAL_ACCOUNT.initial_balance,
      created_at: now,
      updated_at: now,
    },
    transactions: INITIAL_TRANSACTIONS.map((transaction, index) => ({
      id: `local-bank-transaction-${index + 1}`,
      user_id: "local-user",
      account_id: "local-bank-account",
      created_at: now,
      updated_at: now,
      ...transaction,
    })),
  };
}

async function getBankContext(): Promise<BankContext> {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("No hay una sesion activa.");
  }

  return { supabase, userId: user.id };
}

async function ensurePrimaryAccount(context: BankContext) {
  const { supabase, userId } = context;

  const { data: existingAccount, error: accountError } = await supabase
    .from("bank_accounts")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();

  if (accountError) {
    throw new Error(accountError.message);
  }

  if (existingAccount) {
    return existingAccount as BankAccountRecord;
  }

  const { data: createdAccount, error: createAccountError } = await supabase
    .from("bank_accounts")
    .insert({
      user_id: userId,
      ...INITIAL_ACCOUNT,
    })
    .select("*")
    .single();

  if (createAccountError) {
    throw new Error(createAccountError.message);
  }

  return createdAccount as BankAccountRecord;
}

async function ensureBankSeedData() {
  const context = await getBankContext();
  const { supabase, userId } = context;
  const account = await ensurePrimaryAccount(context);

  const initialDocumentNumbers = INITIAL_TRANSACTIONS.map(
    (transaction) => transaction.document_number,
  );

  const { data: seededTransactions, error: seededTransactionsError } = await supabase
    .from("bank_transactions")
    .select("id, document_number, created_at")
    .eq("user_id", userId)
    .in("document_number", initialDocumentNumbers)
    .order("created_at", { ascending: true });

  if (seededTransactionsError) {
    throw new Error(seededTransactionsError.message);
  }

  const existingByDocument = new Map<string, { id: string }[]>();

  for (const transaction of seededTransactions ?? []) {
    const documentNumber = transaction.document_number;

    if (!documentNumber) {
      continue;
    }

    const bucket = existingByDocument.get(documentNumber) ?? [];
    bucket.push({ id: transaction.id as string });
    existingByDocument.set(documentNumber, bucket);
  }

  const duplicateIds = Array.from(existingByDocument.values()).flatMap((items) =>
    items.slice(1).map((item) => item.id),
  );

  if (duplicateIds.length > 0) {
    const { error: deleteDuplicatesError } = await supabase
      .from("bank_transactions")
      .delete()
      .eq("user_id", userId)
      .in("id", duplicateIds);

    if (deleteDuplicatesError) {
      throw new Error(deleteDuplicatesError.message);
    }
  }

  const missingTransactions = INITIAL_TRANSACTIONS.filter(
    (transaction) => !existingByDocument.has(transaction.document_number),
  );

  if (missingTransactions.length === 0) {
    return;
  }

  const { error: seedError } = await supabase.from("bank_transactions").insert(
    missingTransactions.map((transaction) => ({
      user_id: userId,
      account_id: account.id,
      ...transaction,
    })),
  );

  if (seedError) {
    throw new Error(seedError.message);
  }
}

export async function getBankPageData(): Promise<BankPageData> {
  await ensureBankSeedData();
  const { supabase, userId } = await getBankContext();

  const [{ data: account, error: accountError }, { data: transactions, error: transactionsError }] =
    await Promise.all([
      supabase
        .from("bank_accounts")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: true })
        .limit(1)
        .single(),
      supabase
        .from("bank_transactions")
        .select("*")
        .eq("user_id", userId)
        .order("transaction_date", { ascending: false })
        .order("created_at", { ascending: false }),
    ]);

  if (accountError) {
    throw new Error(accountError.message);
  }

  if (transactionsError) {
    throw new Error(transactionsError.message);
  }

  return {
    account: account as BankAccountRecord,
    transactions: (transactions ?? []) as BankTransactionRecord[],
  };
}

export async function createBankTransaction(input: BankTransactionInput) {
  const context = await getBankContext();
  const { supabase, userId } = context;
  const account = await ensurePrimaryAccount(context);

  const { data, error } = await supabase
    .from("bank_transactions")
    .insert({
      user_id: userId,
      account_id: account.id,
      transaction_date: input.transaction_date,
      type: input.type,
      category: input.category,
      provider: input.provider ?? null,
      description: input.description ?? null,
      document_number: input.document_number ?? null,
      net_amount: input.net_amount,
      vat_amount: input.vat_amount ?? 0,
      total_amount: input.total_amount,
      file_name: input.file_name ?? null,
      file_path: input.file_path ?? null,
      file_mime_type: input.file_mime_type ?? null,
      file_size: input.file_size ?? null,
      notes: input.notes ?? null,
    })
    .select("*")
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return data as BankTransactionRecord;
}

export async function getBankTransactionById(id: string) {
  const { supabase, userId } = await getBankContext();

  const { data, error } = await supabase
    .from("bank_transactions")
    .select("*")
    .eq("user_id", userId)
    .eq("id", id)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? null) as BankTransactionRecord | null;
}

export async function updateBankTransaction(
  id: string,
  input: BankTransactionInput,
  fileUpdate: FileUpdate = { mode: "keep" },
) {
  const { supabase, userId } = await getBankContext();
  const existing = await getBankTransactionById(id);

  if (!existing) {
    throw new Error("Transaccion no encontrada.");
  }

  if (
    existing.file_path &&
    (fileUpdate.mode === "remove" || fileUpdate.mode === "replace")
  ) {
    const { error: storageDeleteError } = await supabase.storage
      .from(BANK_DOCUMENTS_BUCKET)
      .remove([existing.file_path]);

    if (storageDeleteError) {
      throw new Error(storageDeleteError.message);
    }
  }

  const patch: Record<string, unknown> = {
    transaction_date: input.transaction_date,
    type: input.type,
    category: input.category,
    provider: input.provider ?? null,
    description: input.description ?? null,
    document_number: input.document_number ?? null,
    net_amount: input.net_amount,
    vat_amount: input.vat_amount ?? 0,
    total_amount: input.total_amount,
    notes: input.notes ?? null,
  };

  if (fileUpdate.mode === "remove") {
    patch.file_name = null;
    patch.file_path = null;
    patch.file_mime_type = null;
    patch.file_size = null;
  } else if (fileUpdate.mode === "replace") {
    patch.file_name = fileUpdate.file_name;
    patch.file_path = fileUpdate.file_path;
    patch.file_mime_type = fileUpdate.file_mime_type;
    patch.file_size = fileUpdate.file_size;
  }

  const { data, error } = await supabase
    .from("bank_transactions")
    .update(patch)
    .eq("user_id", userId)
    .eq("id", id)
    .select("*")
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return data as BankTransactionRecord;
}

export async function deleteBankTransaction(id: string) {
  const { supabase, userId } = await getBankContext();
  const existing = await getBankTransactionById(id);

  if (!existing) {
    throw new Error("Transaccion no encontrada.");
  }

  if (existing.file_path) {
    const { error: storageDeleteError } = await supabase.storage
      .from(BANK_DOCUMENTS_BUCKET)
      .remove([existing.file_path]);

    if (storageDeleteError) {
      throw new Error(storageDeleteError.message);
    }
  }

  const { error } = await supabase
    .from("bank_transactions")
    .delete()
    .eq("user_id", userId)
    .eq("id", id);

  if (error) {
    throw new Error(error.message);
  }
}
