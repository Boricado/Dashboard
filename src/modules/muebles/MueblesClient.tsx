"use client";

import { useMemo, useState } from "react";
import { furnitureCatalogMeta } from "@/modules/muebles/data";
import type {
  FurnitureMaterial,
  FurniturePageData,
  FurnitureProject,
  FurnitureProjectInput,
} from "@/modules/muebles/types";

type DraftItem = {
  material_id: string;
  quantity: string;
  unit_price_snapshot: string;
  notes: string;
};

type DraftProject = {
  name: string;
  description: string;
  labor_cost: string;
  sale_price: string;
  notes: string;
  items: DraftItem[];
};

function formatClp(value: number) {
  return new Intl.NumberFormat("es-CL", {
    style: "currency",
    currency: "CLP",
    maximumFractionDigits: 0,
  }).format(value);
}

function makeDraft(project?: FurnitureProject): DraftProject {
  if (!project) {
    return {
      name: "",
      description: "",
      labor_cost: "0",
      sale_price: "0",
      notes: "",
      items: [],
    };
  }

  return {
    name: project.name,
    description: project.description ?? "",
    labor_cost: String(project.labor_cost),
    sale_price: String(project.sale_price),
    notes: project.notes ?? "",
    items: project.items.map((item) => ({
      material_id: item.material_id,
      quantity: String(item.quantity),
      unit_price_snapshot: String(item.unit_price_snapshot),
      notes: item.notes ?? "",
    })),
  };
}

function computeMaterialTotal(items: DraftItem[]) {
  return items.reduce((sum, item) => {
    const quantity = Number(item.quantity.replace(",", ".")) || 0;
    const unitPrice = Number(item.unit_price_snapshot.replace(/[^\d-]/g, "")) || 0;
    return sum + quantity * unitPrice;
  }, 0);
}

export function MueblesClient(props: { initialData: FurniturePageData }) {
  const [materials] = useState(props.initialData.materials);
  const [projects, setProjects] = useState(props.initialData.projects);
  const [draft, setDraft] = useState<DraftProject>(makeDraft());
  const [editingId, setEditingId] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("todas");
  const [saving, setSaving] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const filteredMaterials = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    return materials.filter((material) => {
      if (category !== "todas" && material.category !== category) {
        return false;
      }

      if (!normalizedQuery) {
        return true;
      }

      return [
        material.name,
        material.category,
        material.reference ?? "",
        material.note ?? "",
      ]
        .join(" ")
        .toLowerCase()
        .includes(normalizedQuery);
    });
  }, [category, materials, query]);

  const categories = useMemo(
    () => Array.from(new Set(materials.map((item) => item.category))).sort(),
    [materials],
  );

  const draftMaterialCost = computeMaterialTotal(draft.items);
  const draftLaborCost = Number(draft.labor_cost.replace(/[^\d-]/g, "")) || 0;
  const draftSalePrice = Number(draft.sale_price.replace(/[^\d-]/g, "")) || 0;
  const draftCost = draftMaterialCost + draftLaborCost;
  const draftProfit = draftSalePrice - draftCost;
  const draftMargin = draftSalePrice > 0 ? (draftProfit / draftSalePrice) * 100 : 0;

  function resetDraft() {
    setDraft(makeDraft());
    setEditingId(null);
  }

  function addMaterial(material: FurnitureMaterial) {
    setDraft((current) => ({
      ...current,
      items: [
        ...current.items,
        {
          material_id: material.id,
          quantity: "1",
          unit_price_snapshot: String(material.unit_price),
          notes: "",
        },
      ],
    }));
  }

  function updateDraftItem(index: number, key: keyof DraftItem, value: string) {
    setDraft((current) => ({
      ...current,
      items: current.items.map((item, itemIndex) =>
        itemIndex === index ? { ...item, [key]: value } : item,
      ),
    }));
  }

  function removeDraftItem(index: number) {
    setDraft((current) => ({
      ...current,
      items: current.items.filter((_, itemIndex) => itemIndex !== index),
    }));
  }

  function startEditing(project: FurnitureProject) {
    setEditingId(project.id);
    setDraft(makeDraft(project));
    setMessage(null);
    setError(null);
  }

  async function saveProject() {
    setSaving(true);
    setMessage(null);
    setError(null);

    const payload: FurnitureProjectInput = {
      name: draft.name,
      description: draft.description || undefined,
      labor_cost: Number(draft.labor_cost.replace(/[^\d-]/g, "")) || 0,
      sale_price: Number(draft.sale_price.replace(/[^\d-]/g, "")) || 0,
      notes: draft.notes || undefined,
      items: draft.items.map((item) => ({
        material_id: item.material_id,
        quantity: Number(item.quantity.replace(",", ".")) || 0,
        unit_price_snapshot: Number(item.unit_price_snapshot.replace(/[^\d-]/g, "")) || 0,
        notes: item.notes || undefined,
      })),
    };

    const response = await fetch(
      editingId ? `/api/muebles/projects/${editingId}` : "/api/muebles/projects",
      {
        method: editingId ? "PATCH" : "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      },
    );

    const result = await response.json();
    setSaving(false);

    if (!response.ok) {
      setError(result.error ?? "No se pudo guardar el proyecto.");
      return;
    }

    if (editingId) {
      setProjects((current) =>
        current.map((item) => (item.id === editingId ? result.project : item)),
      );
      setMessage("Proyecto actualizado.");
    } else {
      setProjects((current) => [result.project, ...current]);
      setMessage("Proyecto creado.");
    }

    resetDraft();
  }

  async function deleteProject(project: FurnitureProject) {
    const confirmed = window.confirm(`Eliminar ${project.name}?`);
    if (!confirmed) {
      return;
    }

    setBusyId(project.id);
    setMessage(null);
    setError(null);

    const response = await fetch(`/api/muebles/projects/${project.id}`, {
      method: "DELETE",
    });

    const result = await response.json();
    setBusyId(null);

    if (!response.ok) {
      setError(result.error ?? "No se pudo eliminar el proyecto.");
      return;
    }

    setProjects((current) => current.filter((item) => item.id !== project.id));
    if (editingId === project.id) {
      resetDraft();
    }
    setMessage("Proyecto eliminado.");
  }

  return (
    <div className="flex flex-col gap-6">
      <section className="app-card p-8">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-amber-700">
              Modulo activo
            </div>
            <h1 className="mt-4 text-4xl font-semibold tracking-tight text-[var(--ink)]">
              Muebles
            </h1>
            <p className="mt-2 max-w-3xl text-lg text-[var(--muted)]">
              Presupuesta proyectos reales con materiales rescatados del catalogo viejo,
              mano de obra, precio de venta y utilidad.
            </p>
          </div>
          <div className="rounded-[1.5rem] border border-[var(--line)] bg-white px-5 py-4 text-sm text-[var(--muted)]">
            <div>Catalogo: {materials.length} materiales</div>
            <div>Actualizacion base: {furnitureCatalogMeta.updatedAt}</div>
          </div>
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <article className="app-card p-6">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="text-2xl font-semibold text-[var(--ink)]">
                {editingId ? "Editar proyecto" : "Nuevo proyecto"}
              </h2>
              <p className="mt-1 text-sm text-[var(--muted)]">
                Arma un presupuesto claro de materia prima y mano de obra.
              </p>
            </div>
            {editingId ? (
              <button
                type="button"
                onClick={resetDraft}
                className="rounded-full border border-[var(--line)] px-4 py-2 text-sm font-semibold text-[var(--ink)]"
              >
                Nuevo
              </button>
            ) : null}
          </div>

          <div className="mt-6 grid gap-4 xl:grid-cols-2">
            <label className="grid gap-2 text-sm">
              <span className="font-medium text-[var(--muted)]">Nombre del proyecto</span>
              <input
                type="text"
                value={draft.name}
                onChange={(event) => setDraft((current) => ({ ...current, name: event.target.value }))}
                placeholder="Ej: Vanitorio de pino"
                className="h-12 rounded-[1rem] border border-[var(--line)] bg-white px-4 outline-none focus:border-amber-500"
              />
            </label>

            <label className="grid gap-2 text-sm">
              <span className="font-medium text-[var(--muted)]">Descripcion</span>
              <input
                type="text"
                value={draft.description}
                onChange={(event) =>
                  setDraft((current) => ({ ...current, description: event.target.value }))
                }
                placeholder="Medidas, estilo o uso"
                className="h-12 rounded-[1rem] border border-[var(--line)] bg-white px-4 outline-none focus:border-amber-500"
              />
            </label>
          </div>

          <div className="mt-4 grid gap-4 xl:grid-cols-3">
            <label className="grid gap-2 text-sm">
              <span className="font-medium text-[var(--muted)]">Mano de obra</span>
              <input
                type="text"
                value={draft.labor_cost}
                onChange={(event) =>
                  setDraft((current) => ({ ...current, labor_cost: event.target.value }))
                }
                className="h-12 rounded-[1rem] border border-[var(--line)] bg-white px-4 outline-none focus:border-amber-500"
              />
            </label>

            <label className="grid gap-2 text-sm">
              <span className="font-medium text-[var(--muted)]">Precio de venta</span>
              <input
                type="text"
                value={draft.sale_price}
                onChange={(event) =>
                  setDraft((current) => ({ ...current, sale_price: event.target.value }))
                }
                className="h-12 rounded-[1rem] border border-[var(--line)] bg-white px-4 outline-none focus:border-amber-500"
              />
            </label>

            <label className="grid gap-2 text-sm">
              <span className="font-medium text-[var(--muted)]">Notas</span>
              <input
                type="text"
                value={draft.notes}
                onChange={(event) => setDraft((current) => ({ ...current, notes: event.target.value }))}
                placeholder="Acabado, plazo, condicion especial"
                className="h-12 rounded-[1rem] border border-[var(--line)] bg-white px-4 outline-none focus:border-amber-500"
              />
            </label>
          </div>

          <div className="mt-6 rounded-[1.5rem] border border-[var(--line)] bg-[#fff9ef] p-4">
            <div className="flex flex-wrap gap-4 text-sm">
              <div>
                <div className="text-[var(--muted)]">Materia prima</div>
                <div className="mt-1 text-xl font-semibold text-[var(--ink)]">
                  {formatClp(draftMaterialCost)}
                </div>
              </div>
              <div>
                <div className="text-[var(--muted)]">Costo total</div>
                <div className="mt-1 text-xl font-semibold text-[var(--ink)]">
                  {formatClp(draftCost)}
                </div>
              </div>
              <div>
                <div className="text-[var(--muted)]">Utilidad</div>
                <div className={`mt-1 text-xl font-semibold ${draftProfit >= 0 ? "text-emerald-700" : "text-rose-600"}`}>
                  {formatClp(draftProfit)}
                </div>
              </div>
              <div>
                <div className="text-[var(--muted)]">Margen</div>
                <div className="mt-1 text-xl font-semibold text-[var(--ink)]">
                  {draftMargin.toFixed(1)}%
                </div>
              </div>
            </div>
          </div>

          <div className="mt-6">
            <h3 className="text-lg font-semibold text-[var(--ink)]">Materiales seleccionados</h3>
            {draft.items.length === 0 ? (
              <div className="mt-3 rounded-[1.25rem] border border-dashed border-[var(--line)] px-4 py-5 text-sm text-[var(--muted)]">
                Agrega materiales desde el catalogo de la derecha.
              </div>
            ) : (
              <div className="mt-3 space-y-3">
                {draft.items.map((item, index) => {
                  const material = materials.find((candidate) => candidate.id === item.material_id);

                  return (
                    <div
                      key={`${item.material_id}-${index}`}
                      className="rounded-[1.25rem] border border-[var(--line)] bg-white p-4"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <div className="text-base font-semibold text-[var(--ink)]">
                            {material?.name ?? "Material"}
                          </div>
                          <div className="mt-1 text-sm text-[var(--muted)]">
                            {material?.category} · {material?.unit_label}
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => removeDraftItem(index)}
                          className="rounded-full border border-rose-200 bg-rose-50 px-3 py-1 text-xs font-semibold text-rose-700"
                        >
                          Quitar
                        </button>
                      </div>

                      <div className="mt-4 grid gap-3 xl:grid-cols-3">
                        <label className="grid gap-2 text-sm">
                          <span className="font-medium text-[var(--muted)]">Cantidad</span>
                          <input
                            type="text"
                            value={item.quantity}
                            onChange={(event) =>
                              updateDraftItem(index, "quantity", event.target.value)
                            }
                            className="h-11 rounded-[1rem] border border-[var(--line)] bg-white px-4 outline-none focus:border-amber-500"
                          />
                        </label>
                        <label className="grid gap-2 text-sm">
                          <span className="font-medium text-[var(--muted)]">Precio unitario</span>
                          <input
                            type="text"
                            value={item.unit_price_snapshot}
                            onChange={(event) =>
                              updateDraftItem(index, "unit_price_snapshot", event.target.value)
                            }
                            className="h-11 rounded-[1rem] border border-[var(--line)] bg-white px-4 outline-none focus:border-amber-500"
                          />
                        </label>
                        <label className="grid gap-2 text-sm">
                          <span className="font-medium text-[var(--muted)]">Notas</span>
                          <input
                            type="text"
                            value={item.notes}
                            onChange={(event) =>
                              updateDraftItem(index, "notes", event.target.value)
                            }
                            placeholder="Corte, color, desperdicio"
                            className="h-11 rounded-[1rem] border border-[var(--line)] bg-white px-4 outline-none focus:border-amber-500"
                          />
                        </label>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div className="mt-6 flex justify-end gap-3">
            <button
              type="button"
              onClick={resetDraft}
              className="rounded-full border border-[var(--line)] px-4 py-2 text-sm font-semibold text-[var(--ink)]"
            >
              Limpiar
            </button>
            <button
              type="button"
              onClick={saveProject}
              disabled={saving}
              className="rounded-full bg-amber-600 px-5 py-2 text-sm font-semibold text-white disabled:opacity-60"
            >
              {saving ? "Guardando..." : editingId ? "Guardar cambios" : "Crear proyecto"}
            </button>
          </div>
        </article>

        <article className="app-card p-6">
          <h2 className="text-2xl font-semibold text-[var(--ink)]">Catalogo rescatado</h2>
          <p className="mt-1 text-sm text-[var(--muted)]">{furnitureCatalogMeta.note}</p>

          <div className="mt-5 grid gap-3">
            <input
              type="text"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Buscar material"
              className="h-11 rounded-[1rem] border border-[var(--line)] bg-white px-4 outline-none focus:border-amber-500"
            />
            <select
              value={category}
              onChange={(event) => setCategory(event.target.value)}
              className="h-11 rounded-[1rem] border border-[var(--line)] bg-white px-4 outline-none focus:border-amber-500"
            >
              <option value="todas">Todas las categorias</option>
              {categories.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
          </div>

          <div className="mt-5 max-h-[42rem] space-y-3 overflow-y-auto pr-1">
            {filteredMaterials.map((material) => (
              <div
                key={material.id}
                className="rounded-[1.25rem] border border-[var(--line)] bg-white p-4"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="text-base font-semibold text-[var(--ink)]">{material.name}</div>
                    <div className="mt-1 text-xs font-semibold uppercase tracking-[0.16em] text-[var(--muted)]">
                      {material.category}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => addMaterial(material)}
                    className="rounded-full bg-[var(--accent)] px-3 py-1 text-xs font-semibold text-white"
                  >
                    Agregar
                  </button>
                </div>
                <div className="mt-3 text-sm text-[var(--ink)]">
                  {formatClp(material.unit_price)} / {material.unit_label}
                </div>
                {material.reference ? (
                  <div className="mt-1 text-sm text-[var(--muted)]">{material.reference}</div>
                ) : null}
                {material.note ? (
                  <div className="mt-2 text-xs leading-6 text-[var(--muted)]">{material.note}</div>
                ) : null}
              </div>
            ))}
          </div>
        </article>
      </section>

      {message ? <section className="app-card p-4 text-center text-emerald-700">{message}</section> : null}
      {error ? <section className="app-card p-4 text-center text-rose-700">{error}</section> : null}

      <section className="app-card p-6">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h2 className="text-2xl font-semibold text-[var(--ink)]">Proyectos presupuestados</h2>
            <p className="mt-1 text-sm text-[var(--muted)]">
              Cada proyecto resume materia prima, mano de obra y utilidad.
            </p>
          </div>
          <div className="rounded-full bg-[#fff9ef] px-4 py-2 text-sm font-semibold text-[var(--ink)]">
            {projects.length} proyectos
          </div>
        </div>

        <div className="mt-5 grid gap-4">
          {projects.map((project) => {
            const materialCost = project.items.reduce(
              (sum, item) => sum + item.quantity * item.unit_price_snapshot,
              0,
            );
            const totalCost = materialCost + project.labor_cost;
            const profit = project.sale_price - totalCost;
            const margin = project.sale_price > 0 ? (profit / project.sale_price) * 100 : 0;

            return (
              <article
                key={project.id}
                className="rounded-[1.5rem] border border-[var(--line)] bg-white p-5"
              >
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <h3 className="text-xl font-semibold text-[var(--ink)]">{project.name}</h3>
                    <p className="mt-1 text-sm text-[var(--muted)]">
                      {project.description || "Sin descripcion adicional."}
                    </p>
                  </div>

                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => startEditing(project)}
                      className="rounded-full border border-[var(--line)] px-4 py-2 text-sm font-semibold text-[var(--ink)]"
                    >
                      Editar
                    </button>
                    <button
                      type="button"
                      onClick={() => deleteProject(project)}
                      disabled={busyId === project.id}
                      className="rounded-full border border-rose-200 bg-rose-50 px-4 py-2 text-sm font-semibold text-rose-700 disabled:opacity-60"
                    >
                      {busyId === project.id ? "Eliminando..." : "Eliminar"}
                    </button>
                  </div>
                </div>

                <div className="mt-5 grid gap-3 md:grid-cols-4">
                  <div className="rounded-[1.25rem] border border-[var(--line)] bg-[#fff9ef] p-4">
                    <div className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--muted)]">
                      Materia prima
                    </div>
                    <div className="mt-2 text-xl font-semibold text-[var(--ink)]">
                      {formatClp(materialCost)}
                    </div>
                  </div>
                  <div className="rounded-[1.25rem] border border-[var(--line)] bg-[#fff9ef] p-4">
                    <div className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--muted)]">
                      Mano de obra
                    </div>
                    <div className="mt-2 text-xl font-semibold text-[var(--ink)]">
                      {formatClp(project.labor_cost)}
                    </div>
                  </div>
                  <div className="rounded-[1.25rem] border border-[var(--line)] bg-[#fff9ef] p-4">
                    <div className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--muted)]">
                      Venta
                    </div>
                    <div className="mt-2 text-xl font-semibold text-[var(--ink)]">
                      {formatClp(project.sale_price)}
                    </div>
                  </div>
                  <div className="rounded-[1.25rem] border border-[var(--line)] bg-[#fff9ef] p-4">
                    <div className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--muted)]">
                      Utilidad
                    </div>
                    <div className={`mt-2 text-xl font-semibold ${profit >= 0 ? "text-emerald-700" : "text-rose-700"}`}>
                      {formatClp(profit)}
                    </div>
                    <div className="mt-1 text-xs text-[var(--muted)]">{margin.toFixed(1)}% margen</div>
                  </div>
                </div>

                <div className="mt-5 overflow-hidden rounded-[1.25rem] border border-[var(--line)]">
                  <table className="min-w-full border-collapse bg-white text-sm">
                    <thead className="bg-[#f7f3e9] text-left text-xs font-semibold uppercase tracking-[0.14em] text-[var(--muted)]">
                      <tr>
                        <th className="px-4 py-3">Material</th>
                        <th className="px-4 py-3">Cantidad</th>
                        <th className="px-4 py-3">Precio</th>
                        <th className="px-4 py-3">Subtotal</th>
                        <th className="px-4 py-3">Notas</th>
                      </tr>
                    </thead>
                    <tbody>
                      {project.items.map((item) => (
                        <tr key={item.id} className="border-t border-[var(--line)]">
                          <td className="px-4 py-3">
                            <div className="font-medium text-[var(--ink)]">{item.material.name}</div>
                            <div className="text-xs text-[var(--muted)]">{item.material.category}</div>
                          </td>
                          <td className="px-4 py-3">
                            {item.quantity} {item.material.unit_label}
                          </td>
                          <td className="px-4 py-3">{formatClp(item.unit_price_snapshot)}</td>
                          <td className="px-4 py-3 font-semibold">
                            {formatClp(item.quantity * item.unit_price_snapshot)}
                          </td>
                          <td className="px-4 py-3 text-[var(--muted)]">{item.notes || "-"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </article>
            );
          })}
        </div>
      </section>
    </div>
  );
}
