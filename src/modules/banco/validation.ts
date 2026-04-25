import {
  BANK_TRANSACTION_TYPES,
  type BankTransactionInput,
  type BankTransactionType,
} from "@/modules/banco/types";

type ValidationSuccess<T> = {
  ok: true;
  data: T;
};

type ValidationFailure = {
  ok: false;
  error: string;
};

type ValidationResult<T> = ValidationSuccess<T> | ValidationFailure;

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function requiredTrimmedText(value: unknown) {
  if (typeof value !== "string") {
    return null;
  }

  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function optionalTrimmedText(value: unknown) {
  if (value == null || value === "") {
    return null;
  }

  if (typeof value !== "string") {
    return null;
  }

  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function parseTransactionType(value: unknown): BankTransactionType | null {
  if (typeof value !== "string") {
    return null;
  }

  return BANK_TRANSACTION_TYPES.includes(value as BankTransactionType)
    ? (value as BankTransactionType)
    : null;
}

function parseDate(value: unknown) {
  if (typeof value !== "string") {
    return null;
  }

  return /^\d{4}-\d{2}-\d{2}$/.test(value) ? value : null;
}

function parseMoney(value: unknown) {
  if (typeof value === "number" && Number.isFinite(value)) {
    return Math.round(value);
  }

  if (typeof value !== "string") {
    return null;
  }

  const cleaned = value.replace(/[^\d-]/g, "");
  if (!cleaned) {
    return null;
  }

  const parsed = Number(cleaned);
  return Number.isFinite(parsed) ? Math.round(parsed) : null;
}

export function validateBankTransactionInput(
  payload: unknown,
): ValidationResult<BankTransactionInput> {
  if (!isPlainObject(payload)) {
    return { ok: false, error: "El cuerpo de la solicitud es invalido." };
  }

  const transaction_date = parseDate(payload.transaction_date);
  if (!transaction_date) {
    return { ok: false, error: "La fecha debe usar formato YYYY-MM-DD." };
  }

  const type = parseTransactionType(payload.type);
  if (!type) {
    return { ok: false, error: "El tipo debe ser ingreso o gasto." };
  }

  const category = requiredTrimmedText(payload.category);
  if (!category) {
    return { ok: false, error: "La categoria es obligatoria." };
  }

  const total_amount = parseMoney(payload.total_amount);
  if (total_amount == null || total_amount <= 0) {
    return { ok: false, error: "El total debe ser mayor que cero." };
  }

  const net_amount = parseMoney(payload.net_amount);
  if (net_amount == null || net_amount < 0) {
    return { ok: false, error: "El neto no es valido." };
  }

  const vat_amount =
    payload.vat_amount == null || payload.vat_amount === ""
      ? Math.max(total_amount - net_amount, 0)
      : parseMoney(payload.vat_amount);

  if (vat_amount == null || vat_amount < 0) {
    return { ok: false, error: "El IVA no es valido." };
  }

  return {
    ok: true,
    data: {
      transaction_date,
      type,
      category,
      provider: optionalTrimmedText(payload.provider) ?? undefined,
      description: optionalTrimmedText(payload.description) ?? undefined,
      document_number: optionalTrimmedText(payload.document_number) ?? undefined,
      net_amount,
      vat_amount,
      total_amount,
      file_name: optionalTrimmedText(payload.file_name) ?? undefined,
      notes: optionalTrimmedText(payload.notes) ?? undefined,
    },
  };
}
