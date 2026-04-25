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
  notes: string;
};

type Filters = {
  search: string;
  type: "todas" | BankTransactionType;
  category: string;
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
    notes: "",
  };
}

function createDraftFromTransaction(transaction: BankTransactionRecord): Draft {
  return {
    transaction_date: transaction.transaction_date,
    type: transaction.type,
    category: transaction.category,
    provider: transaction.provider ?? "",
    description: transaction.description ?? "",
    document_number: transaction.document_number ?? "",
    net_amount: String(transaction.net_amount),
    vat_amount: String(transaction.vat_amount),
    total_amount: String(transaction.total_amount),
    notes: transaction.notes ?? "",
  };
}

function getDocumentHref(transaction: BankTransactionRecord) {
  if (!transaction.file_name) {
    return null;
  }

  return `/api/bank/transactions/${transaction.id}/file`;
}

export function BancoClient(props: { initialData: BankPageData }) {
  const [transactions, setTransactions] = useState(props.initialData.transactions);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draft, setDraft] = useState<Draft>(createDraft);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [removeCurrentFile, setRemoveCurrentFile] = useState(false);
  const [previewTransaction, setPreviewTransaction] = useState<BankTransactionRecord | null>(null);
  const [filters, setFilters] = useState<Filters>({
    search: "",
    type: "todas",
    category: "todas",
  });
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);

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

  const filteredTransactions = useMemo(() => {
    const query = filters.search.trim().toLowerCase();

    return transactions.filter((item) => {
      if (filters.type !== "todas" && item.type !== filters.type) {
        return false;
      }

      if (filters.category !== "todas" && item.category !== filters.category) {
        return false;
      }

      if (!query) {
        return true;
      }

      const haystack = [
        item.provider,
        item.description,
        item.document_number,
        item.category,
        item.file_name,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return haystack.includes(query);
    });
  }, [filters, transactions]);

  const categoryOptions = useMemo(() => {
    return Array.from(new Set(transactions.map((item) => item.category))).sort();
  }, [transactions]);

  function resetComposer() {
    setDraft(createDraft());
    setSelectedFile(null);
    setRemoveCurrentFile(false);
    setEditingId(null);
  }

  function openCreateForm() {
    resetComposer();
    setShowForm(true);
    setMessage(null);
    setError(null);
  }

  function openEditForm(transaction: BankTransactionRecord) {
    setDraft(createDraftFromTransaction(transaction));
    setSelectedFile(null);
    setRemoveCurrentFile(false);
    setEditingId(transaction.id);
    setShowForm(true);
    setMessage(null);
    setError(null);
  }

  function closeForm() {
    setShowForm(false);
    resetComposer();
  }

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

    const formData = new FormData();
    formData.set("transaction_date", draft.transaction_date);
    formData.set("type", draft.type);
    formData.set("category", draft.category);
    formData.set("provider", draft.provider);
    formData.set("description", draft.description);
    formData.set("document_number", draft.document_number);
    formData.set("net_amount", draft.net_amount);
    formData.set("vat_amount", draft.vat_amount);
    formData.set("total_amount", draft.total_amount);
    formData.set("notes", draft.notes);
    formData.set("remove_file", removeCurrentFile ? "true" : "false");

    if (selectedFile) {
      formData.set("file", selectedFile);
    }

    const endpoint = editingId
      ? `/api/bank/transactions/${editingId}`
      : "/api/bank/transactions";
    const method = editingId ? "PATCH" : "POST";

    const response = await fetch(endpoint, {
      method,
      body: formData,
    });

    const payload = await response.json();
    setIsSaving(false);

    if (!response.ok) {
      setError(payload.error ?? "No se pudo guardar la transaccion.");
      return;
    }

    if (editingId) {
      setTransactions((current) =>
        current.map((item) =>
          item.id === editingId ? (payload.transaction as BankTransactionRecord) : item,
        ),
      );
      setMessage("Transaccion actualizada.");
    } else {
      setTransactions((current) => [payload.transaction as BankTransactionRecord, ...current]);
      setMessage("Transaccion guardada en Supabase.");
    }

    closeForm();
  }

  async function handleDelete(transaction: BankTransactionRecord) {
    const confirmed = window.confirm(
      `Eliminar ${transaction.document_number ?? "esta transaccion"}?`,
    );

    if (!confirmed) {
      return;
    }

    setBusyId(transaction.id);
    setError(null);
    setMessage(null);

    const response = await fetch(`/api/bank/transactions/${transaction.id}`, {
      method: "DELETE",
    });

    const payload = await response.json();
    setBusyId(null);

    if (!response.ok) {
      setError(payload.error ?? "No se pudo eliminar la transaccion.");
      return;
    }

    setTransactions((current) => current.filter((item) => item.id !== transaction.id));
    setMessage("Transaccion eliminada.");
  }

  const editingTransaction = editingId
    ? transactions.find((item) => item.id === editingId) ?? null
    : null;

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
            onClick={() => (showForm ? closeForm() : openCreateForm())}
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
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-2xl font-semibold text-[var(--ink)]">
              {editingId ? "Editar transaccion" : "Nueva transaccion"}
            </h2>
            {editingId ? (
              <span className="rounded-full bg-[#f2f0fb] px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-[var(--muted)]">
                {editingTransaction?.document_number ?? "Sin documento"}
              </span>
            ) : null}
          </div>

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

          <div className="mt-4 grid gap-4 xl:grid-cols-2">
            <label className="grid gap-2 text-sm">
              <span className="font-medium text-[var(--muted)]">Adjuntar archivo</span>
              <input
                type="file"
                accept=".pdf,image/*"
                onChange={(event) => setSelectedFile(event.target.files?.[0] ?? null)}
                className="rounded-[1rem] border border-[var(--line)] bg-white px-4 py-3 outline-none file:mr-4 file:rounded-full file:border-0 file:bg-emerald-700 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-white"
              />
              <span className="text-xs text-[var(--muted)]">
                {selectedFile
                  ? `${selectedFile.name} · ${Math.round(selectedFile.size / 1024)} KB`
                  : editingTransaction?.file_name
                    ? `Actual: ${editingTransaction.file_name}`
                    : "Se subira a Supabase Storage."}
              </span>
            </label>

            <div className="grid gap-2 text-sm">
              <span className="font-medium text-[var(--muted)]">Notas</span>
              <input
                type="text"
                value={draft.notes}
                onChange={(event) => updateDraft("notes", event.target.value)}
                placeholder="Opcional"
                className="h-12 rounded-[1rem] border border-[var(--line)] bg-white px-4 outline-none focus:border-emerald-600"
              />
              {editingTransaction?.file_name ? (
                <label className="flex items-center gap-2 text-xs text-[var(--muted)]">
                  <input
                    type="checkbox"
                    checked={removeCurrentFile}
                    onChange={(event) => setRemoveCurrentFile(event.target.checked)}
                  />
                  Quitar archivo actual
                </label>
              ) : null}
            </div>
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
                onClick={closeForm}
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
                {isSaving ? "Guardando..." : editingId ? "Guardar cambios" : "Guardar"}
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
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h2 className="text-2xl font-semibold text-[var(--ink)]">Movimientos</h2>
            <p className="mt-1 text-sm text-[var(--muted)]">
              Facturas y registros reales de caja.
            </p>
          </div>

          <div className="grid gap-3 md:grid-cols-3">
            <label className="grid gap-2 text-sm">
              <span className="font-medium text-[var(--muted)]">Buscar</span>
              <input
                type="text"
                value={filters.search}
                onChange={(event) =>
                  setFilters((current) => ({ ...current, search: event.target.value }))
                }
                placeholder="Documento, proveedor o descripcion"
                className="h-11 rounded-[1rem] border border-[var(--line)] bg-white px-4 outline-none focus:border-emerald-600"
              />
            </label>

            <label className="grid gap-2 text-sm">
              <span className="font-medium text-[var(--muted)]">Tipo</span>
              <select
                value={filters.type}
                onChange={(event) =>
                  setFilters((current) => ({
                    ...current,
                    type: event.target.value as Filters["type"],
                  }))
                }
                className="h-11 rounded-[1rem] border border-[var(--line)] bg-white px-4 outline-none focus:border-emerald-600"
              >
                <option value="todas">Todas</option>
                <option value="gasto">Gastos</option>
                <option value="ingreso">Ingresos</option>
              </select>
            </label>

            <label className="grid gap-2 text-sm">
              <span className="font-medium text-[var(--muted)]">Categoria</span>
              <select
                value={filters.category}
                onChange={(event) =>
                  setFilters((current) => ({ ...current, category: event.target.value }))
                }
                className="h-11 rounded-[1rem] border border-[var(--line)] bg-white px-4 outline-none focus:border-emerald-600"
              >
                <option value="todas">Todas</option>
                {categoryOptions.map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </select>
            </label>
          </div>
        </div>

        <div className="mt-4 flex items-center justify-between gap-3 text-sm text-[var(--muted)]">
          <span>{filteredTransactions.length} movimientos visibles</span>
          {(filters.search || filters.type !== "todas" || filters.category !== "todas") ? (
            <button
              type="button"
              onClick={() =>
                setFilters({
                  search: "",
                  type: "todas",
                  category: "todas",
                })
              }
              className="rounded-full border border-[var(--line)] px-3 py-1 font-medium text-[var(--ink)]"
            >
              Limpiar filtros
            </button>
          ) : null}
        </div>

        <div className="mt-5 overflow-hidden rounded-[1.5rem] border border-[var(--line)] bg-white">
          <div className="overflow-x-auto">
            <table className="min-w-[1320px] table-fixed border-collapse">
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
                  <th className="px-4 py-3 text-left">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {filteredTransactions.map((item) => {
                  const documentHref = getDocumentHref(item);

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
                          <div className="flex gap-2">
                            <button
                              type="button"
                              onClick={() => setPreviewTransaction(item)}
                              className="inline-flex rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700"
                            >
                              Vista previa
                            </button>
                            <a
                              href={documentHref}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex rounded-full border border-[var(--line)] bg-white px-3 py-1 text-xs font-semibold text-[var(--ink)]"
                            >
                              Abrir
                            </a>
                          </div>
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
                      <td className="px-4 py-3">
                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={() => openEditForm(item)}
                            className="rounded-full border border-[var(--line)] px-3 py-1 text-xs font-semibold text-[var(--ink)]"
                          >
                            Editar
                          </button>
                          <button
                            type="button"
                            disabled={busyId === item.id}
                            onClick={() => handleDelete(item)}
                            className="rounded-full border border-rose-200 bg-rose-50 px-3 py-1 text-xs font-semibold text-rose-700 disabled:opacity-60"
                          >
                            {busyId === item.id ? "Eliminando..." : "Eliminar"}
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {previewTransaction ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[rgba(19,16,36,0.42)] p-6">
          <div className="app-card max-h-[90vh] w-full max-w-6xl overflow-hidden">
            <div className="flex items-center justify-between border-b border-[var(--line)] px-6 py-4">
              <div>
                <h3 className="text-xl font-semibold text-[var(--ink)]">
                  {previewTransaction.document_number ?? "Documento adjunto"}
                </h3>
                <p className="mt-1 text-sm text-[var(--muted)]">
                  {previewTransaction.file_name ?? "Archivo"}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setPreviewTransaction(null)}
                className="rounded-full border border-[var(--line)] px-4 py-2 text-sm font-semibold text-[var(--ink)]"
              >
                Cerrar
              </button>
            </div>
            <div className="h-[75vh] bg-[#f5f4fc] p-4">
              <iframe
                title={previewTransaction.file_name ?? "Vista previa"}
                src={getDocumentHref(previewTransaction) ?? ""}
                className="h-full w-full rounded-[1.25rem] border border-[var(--line)] bg-white"
              />
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
