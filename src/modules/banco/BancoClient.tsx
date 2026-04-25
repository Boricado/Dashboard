"use client";

import { useMemo, useState } from "react";
import type {
  BankPageData,
  BankTransactionRecord,
  BankTransactionType,
} from "@/modules/banco/types";

const CATEGORY_OPTIONS = [
  "herramientas",
  "materiales",
  "servicios",
  "transporte",
  "otros",
] as const;

type Draft = {
  transaction_date: string;
  type: BankTransactionType;
  category: string;
  provider: string;
  description: string;
  document_number: string;
  net_amount: string;
  vat_amount: string;
  total_amount: string;
  file_name: string;
  notes: string;
};

function formatClp(value: number) {
  return new Intl.NumberFormat("es-CL", {
    style: "currency",
    currency: "CLP",
    maximumFractionDigits: 0,
  }).format(value);
}

function toInputDate(date: Date) {
  const offset = date.getTimezoneOffset();
  const local = new Date(date.getTime() - offset * 60000);
  return local.toISOString().slice(0, 10);
}

function createDraft(): Draft {
  return {
    transaction_date: toInputDate(new Date()),
    type: "gasto",
    category: "herramientas",
    provider: "",
    description: "",
    document_number: "",
    net_amount: "0",
    vat_amount: "",
    total_amount: "0",
    file_name: "",
    notes: "",
  };
}

function getDocumentHref(fileName: string | null) {
  if (!fileName) {
    return null;
  }

  return `/facturas/banco/${encodeURIComponent(fileName)}`;
}

export function BancoClient(props: { initialData: BankPageData }) {
  const [transactions, setTransactions] = useState(props.initialData.transactions);
  const [showForm, setShowForm] = useState(false);
  const [draft, setDraft] = useState<Draft>(createDraft);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const totals = useMemo(() => {
    const totalGastos = transactions
      .filter((item) => item.type === "gasto")
      .reduce((sum, item) => sum + item.total_amount, 0);
    const totalIngresos = transactions
      .filter((item) => item.type === "ingreso")
      .reduce((sum, item) => sum + item.total_amount, 0);

    return {
      totalGastos,
      totalIngresos,
      available:
        props.initialData.account.initial_balance + totalIngresos - totalGastos,
    };
  }, [props.initialData.account.initial_balance, transactions]);

  function updateDraft<K extends keyof Draft>(key: K, value: Draft[K]) {
    setDraft((current) => {
      const next = { ...current, [key]: value };

      if (key === "net_amount" && /^\d+$/.test(String(value))) {
        const net = Number(value);
        const vat = Math.round(net * 0.19);
        next.vat_amount = String(vat);
        next.total_amount = String(net + vat);
      }

      return next;
    });
  }

  async function saveTransaction() {
    setIsSaving(true);
    setError(null);
    setMessage(null);

    const response = await fetch("/api/bank/transactions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(draft),
    });

    const payload = await response.json();
    setIsSaving(false);

    if (!response.ok) {
      setError(payload.error ?? "No se pudo guardar la transaccion.");
      return;
    }

    setTransactions((current) => [payload.transaction as BankTransactionRecord, ...current]);
    setDraft(createDraft());
    setShowForm(false);
    setMessage("Transaccion guardada en Supabase.");
  }

  return (
    <div className="flex flex-col gap-6">
      <section className="app-card p-8">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-4xl font-semibold tracking-tight text-[var(--ink)]">
              Caja · Banco
            </h1>
            <p className="mt-2 text-lg text-[var(--muted)]">
              {props.initialData.account.company_name ?? "Registro de ingresos y gastos"}
            </p>
          </div>

          <button
            type="button"
            onClick={() => {
              setShowForm((current) => !current);
              setMessage(null);
              setError(null);
            }}
            className="rounded-full bg-emerald-700 px-5 py-3 text-sm font-semibold text-white"
          >
            {showForm ? "Cancelar" : "+ Registrar"}
          </button>
        </div>

        <div className="mt-8 grid gap-4 xl:grid-cols-3">
          <article className="app-card p-5 shadow-[0_8px_24px_rgba(31,27,22,0.04)]">
            <div className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[var(--muted)]">
              Saldo inicial
            </div>
            <div className="mt-4 text-5xl font-semibold text-[var(--ink)]">
              {formatClp(props.initialData.account.initial_balance)}
            </div>
          </article>

          <article className="app-card p-5 shadow-[0_8px_24px_rgba(31,27,22,0.04)]">
            <div className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[var(--muted)]">
              Total gastos
            </div>
            <div className="mt-4 text-5xl font-semibold text-red-500">
              -{formatClp(totals.totalGastos)}
            </div>
            <div className="mt-3 text-sm text-[var(--muted)]">
              {transactions.filter((item) => item.type === "gasto").length} transacciones
            </div>
          </article>

          <article className="app-card p-5 shadow-[0_8px_24px_rgba(31,27,22,0.04)]">
            <div className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[var(--muted)]">
              Saldo disponible
            </div>
            <div className="mt-4 text-5xl font-semibold text-emerald-700">
              {formatClp(totals.available)}
            </div>
          </article>
        </div>
      </section>

      {showForm ? (
        <section className="app-card p-6">
          <h2 className="text-2xl font-semibold text-[var(--ink)]">Nueva transaccion</h2>

          <div className="mt-6 grid gap-4 xl:grid-cols-4">
            <label className="grid gap-2 text-sm">
              <span className="font-medium text-[var(--muted)]">Fecha</span>
              <input
                type="date"
                value={draft.transaction_date}
                onChange={(event) => updateDraft("transaction_date", event.target.value)}
                className="h-12 rounded-[1rem] border border-[var(--line)] bg-white px-4 outline-none focus:border-emerald-600"
              />
            </label>

            <label className="grid gap-2 text-sm">
              <span className="font-medium text-[var(--muted)]">Tipo</span>
              <select
                value={draft.type}
                onChange={(event) => updateDraft("type", event.target.value as BankTransactionType)}
                className="h-12 rounded-[1rem] border border-[var(--line)] bg-white px-4 outline-none focus:border-emerald-600"
              >
                <option value="gasto">Gasto</option>
                <option value="ingreso">Ingreso</option>
              </select>
            </label>

            <label className="grid gap-2 text-sm">
              <span className="font-medium text-[var(--muted)]">Categoria</span>
              <select
                value={draft.category}
                onChange={(event) => updateDraft("category", event.target.value)}
                className="h-12 rounded-[1rem] border border-[var(--line)] bg-white px-4 outline-none focus:border-emerald-600"
              >
                {CATEGORY_OPTIONS.map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </select>
            </label>

            <label className="grid gap-2 text-sm">
              <span className="font-medium text-[var(--muted)]">N documento</span>
              <input
                type="text"
                value={draft.document_number}
                onChange={(event) => updateDraft("document_number", event.target.value)}
                placeholder="F-12345"
                className="h-12 rounded-[1rem] border border-[var(--line)] bg-white px-4 outline-none focus:border-emerald-600"
              />
            </label>
          </div>

          <div className="mt-4 grid gap-4 xl:grid-cols-2">
            <label className="grid gap-2 text-sm">
              <span className="font-medium text-[var(--muted)]">Proveedor / origen</span>
              <input
                type="text"
                value={draft.provider}
                onChange={(event) => updateDraft("provider", event.target.value)}
                placeholder="Nombre empresa o persona"
                className="h-12 rounded-[1rem] border border-[var(--line)] bg-white px-4 outline-none focus:border-emerald-600"
              />
            </label>

            <label className="grid gap-2 text-sm">
              <span className="font-medium text-[var(--muted)]">Descripcion</span>
              <input
                type="text"
                value={draft.description}
                onChange={(event) => updateDraft("description", event.target.value)}
                placeholder="Que se compro o cobro"
                className="h-12 rounded-[1rem] border border-[var(--line)] bg-white px-4 outline-none focus:border-emerald-600"
              />
            </label>
          </div>

          <div className="mt-4 grid gap-4 xl:grid-cols-4">
            <label className="grid gap-2 text-sm xl:col-span-3">
              <span className="font-medium text-[var(--muted)]">Archivo asociado</span>
              <input
                type="text"
                value={draft.file_name}
                onChange={(event) => updateDraft("file_name", event.target.value)}
                placeholder="20260414 Easy.pdf"
                className="h-12 rounded-[1rem] border border-[var(--line)] bg-white px-4 outline-none focus:border-emerald-600"
              />
            </label>

            <label className="grid gap-2 text-sm">
              <span className="font-medium text-[var(--muted)]">Notas</span>
              <input
                type="text"
                value={draft.notes}
                onChange={(event) => updateDraft("notes", event.target.value)}
                placeholder="Opcional"
                className="h-12 rounded-[1rem] border border-[var(--line)] bg-white px-4 outline-none focus:border-emerald-600"
              />
            </label>
          </div>

          <div className="mt-4 grid gap-4 xl:grid-cols-3">
            <label className="grid gap-2 text-sm">
              <span className="font-medium text-[var(--muted)]">Neto ($)</span>
              <input
                type="text"
                value={draft.net_amount}
                onChange={(event) => updateDraft("net_amount", event.target.value)}
                className="h-12 rounded-[1rem] border border-[var(--line)] bg-white px-4 outline-none focus:border-emerald-600"
              />
            </label>

            <label className="grid gap-2 text-sm">
              <span className="font-medium text-[var(--muted)]">IVA 19% ($)</span>
              <input
                type="text"
                value={draft.vat_amount}
                onChange={(event) => updateDraft("vat_amount", event.target.value)}
                placeholder="auto"
                className="h-12 rounded-[1rem] border border-[var(--line)] bg-white px-4 outline-none focus:border-emerald-600"
              />
            </label>

            <label className="grid gap-2 text-sm">
              <span className="font-medium text-[var(--muted)]">Total ($)</span>
              <input
                type="text"
                value={draft.total_amount}
                onChange={(event) => updateDraft("total_amount", event.target.value)}
                className="h-12 rounded-[1rem] border border-[var(--line)] bg-white px-4 outline-none focus:border-emerald-600"
              />
            </label>
          </div>

          <div className="mt-5 border-t border-[var(--line)] pt-4">
            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="rounded-full px-4 py-2 text-sm font-semibold text-[var(--ink)]"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={saveTransaction}
                disabled={isSaving}
                className="rounded-full bg-emerald-700 px-5 py-2 text-sm font-semibold text-white disabled:opacity-60"
              >
                {isSaving ? "Guardando..." : "Guardar"}
              </button>
            </div>
          </div>
        </section>
      ) : null}

      {message ? (
        <section className="app-card p-6 text-center text-emerald-700">
          {message}
        </section>
      ) : null}

      {error ? (
        <section className="app-card p-6 text-center text-red-500">
          {error}
        </section>
      ) : null}

      <section className="app-card p-6">
        <div className="flex items-end justify-between gap-3">
          <div>
            <h2 className="text-2xl font-semibold text-[var(--ink)]">Movimientos</h2>
            <p className="mt-1 text-sm text-[var(--muted)]">
              Facturas y registros reales de caja.
            </p>
          </div>
        </div>

        <div className="mt-5 overflow-hidden rounded-[1.5rem] border border-[var(--line)] bg-white">
          <div className="overflow-x-auto">
            <table className="min-w-[1120px] table-fixed border-collapse">
              <thead className="bg-[#f2f0fb] text-xs font-semibold uppercase tracking-[0.14em] text-[var(--muted)]">
                <tr>
                  <th className="px-4 py-3 text-left">Fecha</th>
                  <th className="px-4 py-3 text-left">Tipo</th>
                  <th className="px-4 py-3 text-left">Categoria</th>
                  <th className="px-4 py-3 text-left">Proveedor</th>
                  <th className="px-4 py-3 text-left">Documento</th>
                  <th className="px-4 py-3 text-left">Descripcion</th>
                  <th className="px-4 py-3 text-left">Archivo</th>
                  <th className="px-4 py-3 text-left">Neto</th>
                  <th className="px-4 py-3 text-left">IVA</th>
                  <th className="px-4 py-3 text-left">Total</th>
                </tr>
              </thead>
              <tbody>
                {transactions.map((item) => {
                  const documentHref = getDocumentHref(item.file_name);

                  return (
                    <tr
                      key={item.id}
                      className="border-t border-[var(--line)] text-sm text-[var(--ink)]"
                    >
                      <td className="px-4 py-3">{item.transaction_date}</td>
                      <td className="px-4 py-3">
                        <span
                          className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                            item.type === "gasto"
                              ? "bg-rose-100 text-rose-700"
                              : "bg-emerald-100 text-emerald-700"
                          }`}
                        >
                          {item.type}
                        </span>
                      </td>
                      <td className="px-4 py-3">{item.category}</td>
                      <td className="px-4 py-3">{item.provider ?? "-"}</td>
                      <td className="px-4 py-3">{item.document_number ?? "-"}</td>
                      <td className="px-4 py-3">{item.description ?? "-"}</td>
                      <td className="px-4 py-3">
                        {documentHref ? (
                          <a
                            href={documentHref}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700"
                          >
                            Ver PDF
                          </a>
                        ) : (
                          "-"
                        )}
                      </td>
                      <td className="px-4 py-3">{formatClp(item.net_amount)}</td>
                      <td className="px-4 py-3">{formatClp(item.vat_amount)}</td>
                      <td className="px-4 py-3 font-semibold">
                        {item.type === "gasto" ? "-" : "+"}
                        {formatClp(item.total_amount)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </section>
    </div>
  );
}
