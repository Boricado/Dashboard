"use client";

import { useEffect, useMemo, useState } from "react";
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
  waste_percent: string;
  target_margin_percent: string;
  notes: string;
  items: DraftItem[];
};

type MaterialDraft = {
  category: string;
  name: string;
  unit_label: string;
  unit_price: string;
  reference: string;
  supplier: string;
  note: string;
  source_url: string;
};

type PurchaseRow = {
  project_id: string;
  quantity: string;
};

type PurchaseExtraRow = {
  material_id: string;
  quantity: string;
};

type PurchaseSortKey = "material" | "category" | "quantity" | "unitPrice" | "subtotal" | "projects";

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
      waste_percent: "10",
      target_margin_percent: "35",
      notes: "",
      items: [],
    };
  }

  return {
    name: project.name,
    description: project.description ?? "",
    labor_cost: String(project.labor_cost),
    sale_price: String(project.sale_price),
    waste_percent: String(project.waste_percent),
    target_margin_percent: String(project.target_margin_percent),
    notes: project.notes ?? "",
    items: project.items.map((item) => ({
      material_id: item.material_id,
      quantity: String(item.quantity),
      unit_price_snapshot: String(item.unit_price_snapshot),
      notes: item.notes ?? "",
    })),
  };
}

function makeMaterialDraft(material?: FurnitureMaterial): MaterialDraft {
  return {
    category: material?.category ?? "madera",
    name: material?.name ?? "",
    unit_label: material?.unit_label ?? "unidad",
    unit_price: material ? String(material.unit_price) : "0",
    reference: material?.reference ?? "",
    supplier: material?.supplier ?? "",
    note: material?.note ?? "",
    source_url: material?.source_url ?? "",
  };
}

function parseMoneyInput(value: string) {
  return Number(value.replace(/[^\d-]/g, "")) || 0;
}

function parsePercentInput(value: string, fallback: number) {
  const parsed = Number(value.replace(",", "."));
  return Number.isFinite(parsed) ? parsed : fallback;
}

function parseQuantityInput(value: string) {
  const parsed = Number(value.replace(",", "."));
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 0;
}

function computeMaterialTotal(items: DraftItem[]) {
  return items.reduce((sum, item) => {
    const quantity = Number(item.quantity.replace(",", ".")) || 0;
    const unitPrice = Number(item.unit_price_snapshot.replace(/[^\d-]/g, "")) || 0;
    return sum + quantity * unitPrice;
  }, 0);
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

export function MueblesClient(props: { initialData: FurniturePageData }) {
  const [materials, setMaterials] = useState(props.initialData.materials);
  const [projects, setProjects] = useState(props.initialData.projects);
  const [draft, setDraft] = useState<DraftProject>(makeDraft());
  const [materialDraft, setMaterialDraft] = useState<MaterialDraft>(makeMaterialDraft());
  const [materialModalOpen, setMaterialModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingMaterialId, setEditingMaterialId] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("todas");
  const [saving, setSaving] = useState(false);
  const [savingMaterial, setSavingMaterial] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [purchaseSort, setPurchaseSort] = useState<{
    key: PurchaseSortKey;
    direction: "asc" | "desc";
  }>({ key: "subtotal", direction: "desc" });
  const [purchaseRows, setPurchaseRows] = useState<PurchaseRow[]>(
    props.initialData.projects[0]
      ? [{ project_id: props.initialData.projects[0].id, quantity: "1" }]
      : [],
  );
  const [purchaseExtraRows, setPurchaseExtraRows] = useState<PurchaseExtraRow[]>([]);

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
  const accessoryMaterials = useMemo(
    () => materials.filter((material) => material.category === "accesorios"),
    [materials],
  );

  const draftMaterialCost = computeMaterialTotal(draft.items);
  const draftLaborCost = parseMoneyInput(draft.labor_cost);
  const draftSalePrice = parseMoneyInput(draft.sale_price);
  const draftWastePercent = parsePercentInput(draft.waste_percent, 10);
  const draftTargetMarginPercent = parsePercentInput(draft.target_margin_percent, 35);
  const draftWasteCost = Math.round(draftMaterialCost * (draftWastePercent / 100));
  const draftCost = draftMaterialCost + draftWasteCost + draftLaborCost;
  const draftSuggestedSalePrice =
    draftTargetMarginPercent < 95
      ? Math.ceil(draftCost / Math.max(0.05, 1 - draftTargetMarginPercent / 100))
      : draftCost;
  const draftProfit = draftSalePrice - draftCost;
  const draftMargin = draftSalePrice > 0 ? (draftProfit / draftSalePrice) * 100 : 0;
  const purchaseSummaryBase = useMemo(() => {
    const grouped = new Map<
      string,
      {
        material: FurnitureMaterial;
        quantity: number;
        subtotal: number;
        unitPrice: number;
        projects: Set<string>;
      }
    >();

    for (const row of purchaseRows) {
      const project = projects.find((item) => item.id === row.project_id);
      const projectQuantity = parseQuantityInput(row.quantity);

      if (!project || projectQuantity <= 0) {
        continue;
      }

      for (const item of project.items) {
        const current = grouped.get(item.material_id) ?? {
          material: item.material,
          quantity: 0,
          subtotal: 0,
          unitPrice: item.unit_price_snapshot,
          projects: new Set<string>(),
        };

        current.quantity += item.quantity * projectQuantity;
        current.subtotal += item.quantity * projectQuantity * item.unit_price_snapshot;
        current.unitPrice = item.unit_price_snapshot;
        current.projects.add(project.name);
        grouped.set(item.material_id, current);
      }
    }

    for (const row of purchaseExtraRows) {
      const material = materials.find((item) => item.id === row.material_id);
      const quantity = parseQuantityInput(row.quantity);

      if (!material || quantity <= 0) {
        continue;
      }

      const current = grouped.get(row.material_id) ?? {
        material,
        quantity: 0,
        subtotal: 0,
        unitPrice: material.unit_price,
        projects: new Set<string>(),
      };

      current.quantity += quantity;
      current.subtotal += quantity * material.unit_price;
      current.unitPrice = material.unit_price;
      current.projects.add("Adicional");
      grouped.set(row.material_id, current);
    }

    return Array.from(grouped.values()).sort((a, b) =>
      `${a.material.category}-${a.material.name}`.localeCompare(
        `${b.material.category}-${b.material.name}`,
      ),
    );
  }, [materials, projects, purchaseExtraRows, purchaseRows]);
  const purchaseSummary = useMemo(() => {
    const direction = purchaseSort.direction === "asc" ? 1 : -1;

    return [...purchaseSummaryBase].sort((a, b) => {
      const aProjects = Array.from(a.projects).join(", ");
      const bProjects = Array.from(b.projects).join(", ");
      const values: Record<PurchaseSortKey, [string | number, string | number]> = {
        material: [a.material.name, b.material.name],
        category: [a.material.category, b.material.category],
        quantity: [a.quantity, b.quantity],
        unitPrice: [a.unitPrice, b.unitPrice],
        subtotal: [a.subtotal, b.subtotal],
        projects: [aProjects, bProjects],
      };
      const [left, right] = values[purchaseSort.key];

      if (typeof left === "number" && typeof right === "number") {
        return (left - right) * direction;
      }

      return String(left).localeCompare(String(right), "es-CL") * direction;
    });
  }, [purchaseSort, purchaseSummaryBase]);
  const purchaseTotal = purchaseSummary.reduce((sum, item) => sum + item.subtotal, 0);
  const purchaseNet = Math.round(purchaseTotal / 1.19);
  const purchaseVat = purchaseTotal - purchaseNet;

  useEffect(() => {
    if (!materialModalOpen) {
      return;
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape" && !savingMaterial) {
        setMaterialModalOpen(false);
        setMaterialDraft(makeMaterialDraft());
        setEditingMaterialId(null);
      }
    }

    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [materialModalOpen, savingMaterial]);

  function resetDraft() {
    setDraft(makeDraft());
    setEditingId(null);
  }

  function resetMaterialDraft() {
    setMaterialDraft(makeMaterialDraft());
    setEditingMaterialId(null);
  }

  function openMaterialModal() {
    resetMaterialDraft();
    setMaterialModalOpen(true);
    setMessage(null);
    setError(null);
  }

  function closeMaterialModal() {
    if (savingMaterial) {
      return;
    }

    setMaterialModalOpen(false);
    resetMaterialDraft();
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

  function addPurchaseRow() {
    const firstProject = projects[0];

    if (!firstProject) {
      return;
    }

    setPurchaseRows((current) => [
      ...current,
      {
        project_id: firstProject.id,
        quantity: "1",
      },
    ]);
  }

  function updatePurchaseRow(index: number, key: keyof PurchaseRow, value: string) {
    setPurchaseRows((current) =>
      current.map((row, rowIndex) => (rowIndex === index ? { ...row, [key]: value } : row)),
    );
  }

  function removePurchaseRow(index: number) {
    setPurchaseRows((current) => current.filter((_, rowIndex) => rowIndex !== index));
  }

  function addPurchaseExtraRow(material?: FurnitureMaterial) {
    const firstMaterial = material ?? materials[0];

    if (!firstMaterial) {
      return;
    }

    setPurchaseExtraRows((current) => [
      ...current,
      {
        material_id: firstMaterial.id,
        quantity: "1",
      },
    ]);
  }

  function updatePurchaseExtraRow(index: number, key: keyof PurchaseExtraRow, value: string) {
    setPurchaseExtraRows((current) =>
      current.map((row, rowIndex) => (rowIndex === index ? { ...row, [key]: value } : row)),
    );
  }

  function removePurchaseExtraRow(index: number) {
    setPurchaseExtraRows((current) => current.filter((_, rowIndex) => rowIndex !== index));
  }

  function updatePurchaseSort(key: PurchaseSortKey) {
    setPurchaseSort((current) => ({
      key,
      direction: current.key === key && current.direction === "desc" ? "asc" : "desc",
    }));
  }

  function sortLabel(key: PurchaseSortKey) {
    if (purchaseSort.key !== key) {
      return "";
    }

    return purchaseSort.direction === "desc" ? " ↓" : " ↑";
  }

  function openPurchasePrintWindow() {
    const today = new Date().toLocaleDateString("es-CL");
    const rows = purchaseSummary
      .map((item) => {
        const projectsText = Array.from(item.projects).join(", ");
        const quantity = item.quantity.toLocaleString("es-CL", { maximumFractionDigits: 2 });
        return `
          <tr>
            <td>
              <strong>${escapeHtml(item.material.name)}</strong>
              <span>${escapeHtml(item.material.reference ?? "")}</span>
            </td>
            <td>${escapeHtml(item.material.category)}</td>
            <td class="right">${quantity} ${escapeHtml(item.material.unit_label)}</td>
            <td class="right">${formatClp(item.unitPrice)}</td>
            <td class="right">${formatClp(item.subtotal)}</td>
            <td>${escapeHtml(projectsText)}</td>
          </tr>
        `;
      })
      .join("");
    const printWindow = window.open("", "presupuesto-muebles", "width=960,height=720");

    if (!printWindow) {
      setError("No pude abrir la ventana de impresion. Revisa si el navegador bloqueo ventanas emergentes.");
      return;
    }

    printWindow.document.write(`
      <!doctype html>
      <html>
        <head>
          <title>Presupuesto muebles</title>
          <style>
            body { color: #1f2a24; font-family: Arial, sans-serif; margin: 32px; }
            header { border-bottom: 2px solid #d8c4a3; margin-bottom: 24px; padding-bottom: 18px; }
            h1 { font-size: 28px; margin: 0 0 8px; }
            p { color: #6f675e; margin: 0; }
            table { border-collapse: collapse; font-size: 13px; width: 100%; }
            th { background: #f7f3e9; color: #6f675e; font-size: 11px; letter-spacing: .12em; text-align: left; text-transform: uppercase; }
            th, td { border-bottom: 1px solid #d8c4a3; padding: 10px; vertical-align: top; }
            td span { color: #6f675e; display: block; font-size: 11px; margin-top: 3px; }
            .right { text-align: right; white-space: nowrap; }
            .totals { margin-left: auto; margin-top: 24px; width: 320px; }
            .totals div { display: flex; justify-content: space-between; padding: 8px 0; }
            .totals .final { border-top: 2px solid #1f2a24; font-size: 20px; font-weight: 700; margin-top: 8px; padding-top: 12px; }
            @media print { body { margin: 20mm; } }
          </style>
        </head>
        <body>
          <header>
            <h1>Presupuesto de materiales</h1>
            <p>Resumen de compras muebles · ${escapeHtml(today)}</p>
          </header>
          <table>
            <thead>
              <tr>
                <th>Material</th>
                <th>Categoria</th>
                <th class="right">Cantidad</th>
                <th class="right">Precio unidad</th>
                <th class="right">Total elemento</th>
                <th>Origen</th>
              </tr>
            </thead>
            <tbody>${rows}</tbody>
          </table>
          <section class="totals">
            <div><span>Total neto</span><strong>${formatClp(purchaseNet)}</strong></div>
            <div><span>IVA 19%</span><strong>${formatClp(purchaseVat)}</strong></div>
            <div class="final"><span>Total</span><strong>${formatClp(purchaseTotal)}</strong></div>
          </section>
          <script>window.onload = () => window.print();</script>
        </body>
      </html>
    `);
    printWindow.document.close();
  }

  function loadCortaVistaDraft() {
    const pino1x2 = materials.find((material) =>
      material.category === "madera" &&
      (material.name.includes('1"x2"') || material.reference?.includes('1"x2"')),
    );
    const pino1x4 = materials.find((material) =>
      material.category === "madera" &&
      (material.name.includes('1"x4"') || material.reference?.includes('1"x4"')),
    );

    const items: DraftItem[] = [];
    if (pino1x2) {
      items.push({
        material_id: pino1x2.id,
        quantity: "24",
        unit_price_snapshot: String(pino1x2.unit_price),
        notes: "OpenCutList: 68,30 m totales. Compra estimada con 10% merma: 24 piezas de 3,2 m.",
      });
    }
    if (pino1x4) {
      items.push({
        material_id: pino1x4.id,
        quantity: "19",
        unit_price_snapshot: String(pino1x4.unit_price),
        notes: "OpenCutList: 54,56 m totales. Compra estimada con 10% merma: 19 piezas de 3,2 m.",
      });
    }

    const materialCost = items.reduce(
      (sum, item) => sum + Number(item.quantity) * parseMoneyInput(item.unit_price_snapshot),
      0,
    );
    const suggestedSale = Math.ceil(materialCost / 0.65);

    setEditingId(null);
    setDraft({
      name: "Corta vista con macetero",
      description: "Listones de pino seco cepillado segun OpenCutList.",
      labor_cost: "0",
      sale_price: String(suggestedSale),
      waste_percent: "0",
      target_margin_percent: "35",
      notes: "Precios Sodimac actuales al 02-05-2026. Cantidades ya incluyen 10% de merma sobre largo total.",
      items,
    });
    setMessage("Corta vista cargado como proyecto nuevo. Revisa y presiona Crear proyecto.");
    setError(null);
  }

  function loadMesaTrabajoDraft() {
    const osb15 = materials.find(
      (material) => material.category === "tableros" && material.name.includes("OSB 15mm"),
    );
    const terciado18 = materials.find(
      (material) =>
        material.category === "tableros" &&
        (material.name.includes("Plywood 18mm") || material.name.includes("Terciado")),
    );
    const pino1x2 = materials.find(
      (material) =>
        material.category === "madera" &&
        (material.name.includes('1"x2"') || material.reference?.includes('1"x2"')),
    );
    const pino1x3 = materials.find(
      (material) =>
        material.category === "madera" &&
        (material.name.includes('1"x3"') || material.reference?.includes('1"x3"')),
    );

    const items: DraftItem[] = [];
    if (osb15) {
      items.push({
        material_id: osb15.id,
        quantity: "1",
        unit_price_snapshot: String(osb15.unit_price),
        notes: "OpenCutList: 1 plancha inferior OSB 15mm 1220x2440.",
      });
    }
    if (terciado18) {
      items.push({
        material_id: terciado18.id,
        quantity: "1",
        unit_price_snapshot: String(terciado18.unit_price),
        notes: "OpenCutList: 1 plancha superior terciado estructural 18mm 1220x2440.",
      });
    }
    if (pino1x2) {
      items.push({
        material_id: pino1x2.id,
        quantity: "2",
        unit_price_snapshot: String(pino1x2.unit_price),
        notes: "OpenCutList: 4 cortes, 4,73 m totales. Compra estimada: 2 piezas de 3,2 m.",
      });
    }
    if (pino1x3) {
      items.push({
        material_id: pino1x3.id,
        quantity: "11",
        unit_price_snapshot: String(pino1x3.unit_price),
        notes: "OpenCutList: 34 cortes, 32,29 m totales. Compra estimada: 11 piezas de 3,2 m.",
      });
    }

    const materialCost = items.reduce(
      (sum, item) => sum + Number(item.quantity) * parseMoneyInput(item.unit_price_snapshot),
      0,
    );
    const suggestedSale = Math.ceil(materialCost / 0.65);

    setEditingId(null);
    setDraft({
      name: "Mesa de trabajo",
      description: "Mesa de carpinteria segun OpenCutList del modelo dibujado.",
      labor_cost: "0",
      sale_price: String(suggestedSale),
      waste_percent: "0",
      target_margin_percent: "35",
      notes: "OpenCutList: OSB 15mm x1, terciado estructural 18mm x1, pino 1x2 = 4,73 m y pino 1x3 = 32,29 m.",
      items,
    });
    setMessage("Mesa de trabajo cargada como proyecto nuevo. Revisa y presiona Crear proyecto.");
    setError(null);
  }

  function startEditing(project: FurnitureProject) {
    setEditingId(project.id);
    setDraft(makeDraft(project));
    setMessage(null);
    setError(null);
  }

  function startEditingMaterial(material: FurnitureMaterial) {
    setEditingMaterialId(material.id);
    setMaterialDraft(makeMaterialDraft(material));
    setMaterialModalOpen(true);
    setMessage(null);
    setError(null);
  }

  function updateMaterialDraft(key: keyof MaterialDraft, value: string) {
    setMaterialDraft((current) => ({ ...current, [key]: value }));
  }

  async function saveMaterial() {
    setSavingMaterial(true);
    setMessage(null);
    setError(null);

    const payload = {
      ...materialDraft,
      unit_price: parseMoneyInput(materialDraft.unit_price),
    };
    const response = await fetch(
      editingMaterialId
        ? `/api/muebles/materials/${editingMaterialId}`
        : "/api/muebles/materials",
      {
        method: editingMaterialId ? "PATCH" : "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      },
    );

    const result = await response.json();
    setSavingMaterial(false);

    if (!response.ok) {
      setError(result.error ?? "No se pudo guardar el material.");
      return;
    }

    const savedMaterial = result.material as FurnitureMaterial;
    setMaterials((current) =>
      editingMaterialId
        ? current.map((item) => (item.id === savedMaterial.id ? savedMaterial : item))
        : [...current, savedMaterial].sort((a, b) =>
            `${a.category}-${a.name}`.localeCompare(`${b.category}-${b.name}`),
          ),
    );
    setDraft((current) => ({
      ...current,
      items: current.items.map((item) =>
        item.material_id === savedMaterial.id
          ? { ...item, unit_price_snapshot: String(savedMaterial.unit_price) }
          : item,
      ),
    }));
    setCategory("todas");
    setMessage(editingMaterialId ? "Material actualizado." : "Material agregado al catalogo.");
    setMaterialModalOpen(false);
    resetMaterialDraft();
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
      waste_percent: draftWastePercent,
      target_margin_percent: draftTargetMarginPercent,
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

          <div className="mt-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
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
              <span className="font-medium text-[var(--muted)]">Merma %</span>
              <input
                type="text"
                value={draft.waste_percent}
                onChange={(event) =>
                  setDraft((current) => ({ ...current, waste_percent: event.target.value }))
                }
                className="h-12 rounded-[1rem] border border-[var(--line)] bg-white px-4 outline-none focus:border-amber-500"
              />
            </label>

            <label className="grid gap-2 text-sm">
              <span className="font-medium text-[var(--muted)]">Margen objetivo %</span>
              <input
                type="text"
                value={draft.target_margin_percent}
                onChange={(event) =>
                  setDraft((current) => ({
                    ...current,
                    target_margin_percent: event.target.value,
                  }))
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
                className="h-12 min-w-0 rounded-[1rem] border border-[var(--line)] bg-white px-4 outline-none focus:border-amber-500"
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
                <div className="text-[var(--muted)]">Merma</div>
                <div className="mt-1 text-xl font-semibold text-[var(--ink)]">
                  {formatClp(draftWasteCost)}
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
              <div>
                <div className="text-[var(--muted)]">Venta sugerida</div>
                <div className="mt-1 flex flex-wrap items-center gap-2">
                  <span className="text-xl font-semibold text-amber-800">
                    {formatClp(draftSuggestedSalePrice)}
                  </span>
                  <button
                    type="button"
                    onClick={() =>
                      setDraft((current) => ({
                        ...current,
                        sale_price: String(draftSuggestedSalePrice),
                      }))
                    }
                    className="rounded-full bg-amber-600 px-3 py-1 text-xs font-semibold text-white"
                  >
                    Usar
                  </button>
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
              onClick={loadCortaVistaDraft}
              className="rounded-full border border-amber-200 bg-[#fff9ef] px-4 py-2 text-sm font-semibold text-amber-800"
            >
              Cargar corta vista
            </button>
            <button
              type="button"
              onClick={loadMesaTrabajoDraft}
              className="rounded-full border border-amber-200 bg-[#fff9ef] px-4 py-2 text-sm font-semibold text-amber-800"
            >
              Cargar mesa
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
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <h2 className="text-2xl font-semibold text-[var(--ink)]">Materiales y accesorios</h2>
              <p className="mt-1 text-sm text-[var(--muted)]">{furnitureCatalogMeta.note}</p>
            </div>
            <button
              type="button"
              onClick={openMaterialModal}
              className="rounded-full bg-amber-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm shadow-amber-900/10 transition hover:bg-amber-700"
            >
              Agregar material
            </button>
          </div>

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

          {accessoryMaterials.length > 0 ? (
            <div className="mt-5 rounded-[1.5rem] border border-amber-200 bg-[#fff9ef] p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h3 className="text-lg font-semibold text-[var(--ink)]">
                    Accesorios globales
                  </h3>
                  <p className="mt-1 text-xs leading-5 text-[var(--muted)]">
                    Consumibles y herramientas que puedes sumar a cualquier presupuesto.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setCategory("accesorios")}
                  className="rounded-full border border-amber-200 bg-white px-3 py-1 text-xs font-semibold text-amber-800"
                >
                  Ver todos
                </button>
              </div>

              <div className="mt-4 grid gap-2">
                {accessoryMaterials.slice(0, 6).map((material) => (
                  <div
                    key={material.id}
                    className="flex items-center justify-between gap-3 rounded-[1rem] border border-amber-100 bg-white px-3 py-2"
                  >
                    <div className="min-w-0">
                      <div className="truncate text-sm font-semibold text-[var(--ink)]">
                        {material.name}
                      </div>
                      <div className="text-xs text-[var(--muted)]">
                        {formatClp(material.unit_price)} / {material.unit_label}
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => addMaterial(material)}
                      className="shrink-0 rounded-full bg-[var(--accent)] px-3 py-1 text-xs font-semibold text-white"
                    >
                      Agregar
                    </button>
                  </div>
                ))}
              </div>
            </div>
          ) : null}

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
                <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-sm text-[var(--ink)]">
                  <span>
                    {formatClp(material.unit_price)} / {material.unit_label}
                  </span>
                  <button
                    type="button"
                    onClick={() => startEditingMaterial(material)}
                    className="rounded-full border border-[var(--line)] bg-[#fff9ef] px-3 py-1 text-xs font-semibold text-[var(--ink)]"
                  >
                    Editar precio
                  </button>
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
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h2 className="text-2xl font-semibold text-[var(--ink)]">Resumen de compras</h2>
            <p className="mt-1 text-sm text-[var(--muted)]">
              Agrupa proyectos, accesorios y materiales adicionales en una compra imprimible.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={openPurchasePrintWindow}
              disabled={purchaseSummary.length === 0}
              className="rounded-full bg-amber-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
            >
              Imprimir presupuesto
            </button>
            <div className="rounded-full bg-[#fff9ef] px-4 py-2 text-sm font-semibold text-[var(--ink)]">
              Total {formatClp(purchaseTotal)}
            </div>
          </div>
        </div>

        <div className="mt-5 overflow-hidden rounded-[1.25rem] border border-[var(--line)]">
          <table className="min-w-full border-collapse bg-white text-sm">
            <thead className="bg-[#f7f3e9] text-left text-xs font-semibold uppercase tracking-[0.14em] text-[var(--muted)]">
              <tr>
                <th className="px-4 py-3">Proyecto</th>
                <th className="px-4 py-3">Cantidad</th>
                <th className="px-4 py-3 text-right">Accion</th>
              </tr>
            </thead>
            <tbody>
              {purchaseRows.map((row, index) => (
                <tr key={`${row.project_id}-${index}`} className="border-t border-[var(--line)]">
                  <td className="px-4 py-3">
                    <select
                      value={row.project_id}
                      onChange={(event) => updatePurchaseRow(index, "project_id", event.target.value)}
                      className="h-11 w-full rounded-[1rem] border border-[var(--line)] bg-white px-4 outline-none focus:border-amber-500"
                    >
                      {projects.map((project) => (
                        <option key={project.id} value={project.id}>
                          {project.name}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="px-4 py-3">
                    <input
                      type="text"
                      value={row.quantity}
                      onChange={(event) => updatePurchaseRow(index, "quantity", event.target.value)}
                      className="h-11 w-28 rounded-[1rem] border border-[var(--line)] bg-white px-4 outline-none focus:border-amber-500"
                    />
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button
                      type="button"
                      onClick={() => removePurchaseRow(index)}
                      className="rounded-full border border-rose-200 bg-rose-50 px-4 py-2 text-sm font-semibold text-rose-700"
                    >
                      Quitar
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {purchaseRows.length === 0 ? (
            <div className="border-t border-[var(--line)] px-4 py-5 text-sm text-[var(--muted)]">
              Crea un proyecto para armar una lista de compra.
            </div>
          ) : null}
        </div>

        <div className="mt-4 flex justify-end gap-2">
          <button
            type="button"
            onClick={addPurchaseRow}
            disabled={projects.length === 0}
            className="rounded-full border border-amber-200 bg-[#fff9ef] px-4 py-2 text-sm font-semibold text-amber-800 disabled:opacity-60"
          >
            Agregar proyecto
          </button>
        </div>

        <div className="mt-6 overflow-hidden rounded-[1.25rem] border border-[var(--line)]">
          <table className="min-w-full border-collapse bg-white text-sm">
            <thead className="bg-[#f7f3e9] text-left text-xs font-semibold uppercase tracking-[0.14em] text-[var(--muted)]">
              <tr>
                <th className="px-4 py-3">Material adicional</th>
                <th className="px-4 py-3">Cantidad</th>
                <th className="px-4 py-3 text-right">Accion</th>
              </tr>
            </thead>
            <tbody>
              {purchaseExtraRows.map((row, index) => (
                <tr key={`${row.material_id}-${index}`} className="border-t border-[var(--line)]">
                  <td className="px-4 py-3">
                    <select
                      value={row.material_id}
                      onChange={(event) =>
                        updatePurchaseExtraRow(index, "material_id", event.target.value)
                      }
                      className="h-11 w-full rounded-[1rem] border border-[var(--line)] bg-white px-4 outline-none focus:border-amber-500"
                    >
                      {materials.map((material) => (
                        <option key={material.id} value={material.id}>
                          {material.name}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="px-4 py-3">
                    <input
                      type="text"
                      value={row.quantity}
                      onChange={(event) =>
                        updatePurchaseExtraRow(index, "quantity", event.target.value)
                      }
                      className="h-11 w-28 rounded-[1rem] border border-[var(--line)] bg-white px-4 outline-none focus:border-amber-500"
                    />
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button
                      type="button"
                      onClick={() => removePurchaseExtraRow(index)}
                      className="rounded-full border border-rose-200 bg-rose-50 px-4 py-2 text-sm font-semibold text-rose-700"
                    >
                      Quitar
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {purchaseExtraRows.length === 0 ? (
            <div className="border-t border-[var(--line)] px-4 py-5 text-sm text-[var(--muted)]">
              Agrega accesorios, herramientas o materiales extra sin crear otro proyecto.
            </div>
          ) : null}
        </div>

        <div className="mt-4 flex justify-end">
          <button
            type="button"
            onClick={() => addPurchaseExtraRow()}
            disabled={materials.length === 0}
            className="rounded-full border border-amber-200 bg-[#fff9ef] px-4 py-2 text-sm font-semibold text-amber-800 disabled:opacity-60"
          >
            Agregar material adicional
          </button>
        </div>

        {purchaseSummary.length > 0 ? (
          <div className="mt-5 overflow-hidden rounded-[1.25rem] border border-[var(--line)]">
            <table className="min-w-full border-collapse bg-white text-sm">
              <thead className="bg-[#f7f3e9] text-left text-xs font-semibold uppercase tracking-[0.14em] text-[var(--muted)]">
                <tr>
                  <th className="px-4 py-3">
                    <button type="button" onClick={() => updatePurchaseSort("material")}>
                      Material{sortLabel("material")}
                    </button>
                  </th>
                  <th className="px-4 py-3">
                    <button type="button" onClick={() => updatePurchaseSort("category")}>
                      Categoria{sortLabel("category")}
                    </button>
                  </th>
                  <th className="px-4 py-3">
                    <button type="button" onClick={() => updatePurchaseSort("quantity")}>
                      Cantidad compra{sortLabel("quantity")}
                    </button>
                  </th>
                  <th className="px-4 py-3">
                    <button type="button" onClick={() => updatePurchaseSort("unitPrice")}>
                      Precio unidad{sortLabel("unitPrice")}
                    </button>
                  </th>
                  <th className="px-4 py-3">
                    <button type="button" onClick={() => updatePurchaseSort("subtotal")}>
                      Total elemento{sortLabel("subtotal")}
                    </button>
                  </th>
                  <th className="px-4 py-3">
                    <button type="button" onClick={() => updatePurchaseSort("projects")}>
                      Origen{sortLabel("projects")}
                    </button>
                  </th>
                </tr>
              </thead>
              <tbody>
                {purchaseSummary.map((item) => (
                  <tr key={item.material.id} className="border-t border-[var(--line)]">
                    <td className="px-4 py-3">
                      <div className="font-medium text-[var(--ink)]">{item.material.name}</div>
                      <div className="text-xs text-[var(--muted)]">{item.material.reference}</div>
                    </td>
                    <td className="px-4 py-3">{item.material.category}</td>
                    <td className="px-4 py-3 font-semibold">
                      {item.quantity.toLocaleString("es-CL", { maximumFractionDigits: 2 })}{" "}
                      {item.material.unit_label}
                    </td>
                    <td className="px-4 py-3 font-semibold">{formatClp(item.unitPrice)}</td>
                    <td className="px-4 py-3 font-semibold">{formatClp(item.subtotal)}</td>
                    <td className="px-4 py-3 text-[var(--muted)]">
                      {Array.from(item.projects).join(", ")}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : null}

        <div className="mt-5 grid gap-3 rounded-[1.25rem] border border-[var(--line)] bg-[#fff9ef] p-4 text-sm sm:ml-auto sm:max-w-md">
          <div className="flex items-center justify-between">
            <span className="text-[var(--muted)]">Total neto</span>
            <strong className="text-[var(--ink)]">{formatClp(purchaseNet)}</strong>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-[var(--muted)]">IVA 19%</span>
            <strong className="text-[var(--ink)]">{formatClp(purchaseVat)}</strong>
          </div>
          <div className="flex items-center justify-between border-t border-[var(--line)] pt-3 text-lg">
            <span className="font-semibold text-[var(--ink)]">Total</span>
            <strong className="text-amber-800">{formatClp(purchaseTotal)}</strong>
          </div>
        </div>
      </section>

      {materialModalOpen ? (
        <section
          aria-labelledby="material-modal-title"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 px-3 pt-10 backdrop-blur-sm sm:items-center sm:p-6"
          role="dialog"
        >
          <button
            aria-label="Cerrar modal"
            className="absolute inset-0 h-full w-full cursor-default"
            disabled={savingMaterial}
            onClick={closeMaterialModal}
            type="button"
          />
          <form
            className="relative z-10 max-h-[90dvh] w-full max-w-2xl overflow-y-auto rounded-t-[2rem] bg-white p-5 shadow-2xl shadow-black/20 sm:rounded-[2rem] sm:p-6"
            onSubmit={(event) => {
              event.preventDefault();
              void saveMaterial();
            }}
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-amber-700">
                  Catalogo de insumos
                </p>
                <h2 id="material-modal-title" className="mt-1 text-2xl font-semibold text-[var(--ink)]">
                  {editingMaterialId ? "Editar material" : "Agregar material"}
                </h2>
                <p className="mt-1 text-sm text-[var(--muted)]">
                  Guarda precio, proveedor y notas para presupuestar mas rapido.
                </p>
              </div>
              <button
                className="grid size-10 shrink-0 place-items-center rounded-full border border-[var(--line)] text-lg font-semibold text-[var(--ink)] disabled:opacity-50"
                disabled={savingMaterial}
                onClick={closeMaterialModal}
                type="button"
              >
                x
              </button>
            </div>

            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              <label className="grid gap-1.5 text-sm">
                <span className="font-medium text-[var(--muted)]">Material</span>
                <input
                  className="h-11 rounded-[1rem] border border-[var(--line)] bg-white px-4 outline-none focus:border-amber-500"
                  onChange={(event) => updateMaterialDraft("name", event.target.value)}
                  placeholder="Ej: Bisagra cierre suave"
                  type="text"
                  value={materialDraft.name}
                />
              </label>

              <label className="grid gap-1.5 text-sm">
                <span className="font-medium text-[var(--muted)]">Categoria</span>
                <input
                  className="h-11 rounded-[1rem] border border-[var(--line)] bg-white px-4 outline-none focus:border-amber-500"
                  list="furniture-material-categories"
                  onChange={(event) => updateMaterialDraft("category", event.target.value)}
                  type="text"
                  value={materialDraft.category}
                />
                <datalist id="furniture-material-categories">
                  {categories.map((item) => (
                    <option key={item} value={item} />
                  ))}
                </datalist>
              </label>

              <label className="grid gap-1.5 text-sm">
                <span className="font-medium text-[var(--muted)]">Unidad</span>
                <input
                  className="h-11 rounded-[1rem] border border-[var(--line)] bg-white px-4 outline-none focus:border-amber-500"
                  onChange={(event) => updateMaterialDraft("unit_label", event.target.value)}
                  placeholder="unidad, pieza, plancha, metro"
                  type="text"
                  value={materialDraft.unit_label}
                />
              </label>

              <label className="grid gap-1.5 text-sm">
                <span className="font-medium text-[var(--muted)]">Precio base</span>
                <input
                  className="h-11 rounded-[1rem] border border-[var(--line)] bg-white px-4 outline-none focus:border-amber-500"
                  onChange={(event) => updateMaterialDraft("unit_price", event.target.value)}
                  placeholder="Ej: 12990"
                  type="text"
                  value={materialDraft.unit_price}
                />
              </label>

              <label className="grid gap-1.5 text-sm">
                <span className="font-medium text-[var(--muted)]">Proveedor</span>
                <input
                  className="h-11 rounded-[1rem] border border-[var(--line)] bg-white px-4 outline-none focus:border-amber-500"
                  onChange={(event) => updateMaterialDraft("supplier", event.target.value)}
                  placeholder="Sodimac, maderera, ferreteria"
                  type="text"
                  value={materialDraft.supplier}
                />
              </label>

              <label className="grid gap-1.5 text-sm">
                <span className="font-medium text-[var(--muted)]">Referencia</span>
                <input
                  className="h-11 rounded-[1rem] border border-[var(--line)] bg-white px-4 outline-none focus:border-amber-500"
                  onChange={(event) => updateMaterialDraft("reference", event.target.value)}
                  placeholder="Medida, marca, formato"
                  type="text"
                  value={materialDraft.reference}
                />
              </label>
            </div>

            <label className="mt-3 grid gap-1.5 text-sm">
              <span className="font-medium text-[var(--muted)]">URL fuente</span>
              <input
                className="h-11 rounded-[1rem] border border-[var(--line)] bg-white px-4 outline-none focus:border-amber-500"
                onChange={(event) => updateMaterialDraft("source_url", event.target.value)}
                placeholder="Link de referencia o compra"
                type="url"
                value={materialDraft.source_url}
              />
            </label>

            <label className="mt-3 grid gap-1.5 text-sm">
              <span className="font-medium text-[var(--muted)]">Nota</span>
              <input
                className="h-11 rounded-[1rem] border border-[var(--line)] bg-white px-4 outline-none focus:border-amber-500"
                onChange={(event) => updateMaterialDraft("note", event.target.value)}
                placeholder="Dato de compra, calidad, rendimiento"
                type="text"
                value={materialDraft.note}
              />
            </label>

            <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <button
                className="rounded-full border border-[var(--line)] bg-white px-5 py-2.5 text-sm font-semibold text-[var(--ink)] disabled:opacity-50"
                disabled={savingMaterial}
                onClick={closeMaterialModal}
                type="button"
              >
                Cancelar
              </button>
              <button
                className="rounded-full bg-amber-600 px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-60"
                disabled={savingMaterial}
                type="submit"
              >
                {savingMaterial ? "Guardando..." : editingMaterialId ? "Guardar material" : "Agregar material"}
              </button>
            </div>
          </form>
        </section>
      ) : null}

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
            const wasteCost = Math.round(materialCost * (project.waste_percent / 100));
            const totalCost = materialCost + wasteCost + project.labor_cost;
            const profit = project.sale_price - totalCost;
            const margin = project.sale_price > 0 ? (profit / project.sale_price) * 100 : 0;
            const suggestedSalePrice =
              project.target_margin_percent < 95
                ? Math.ceil(totalCost / Math.max(0.05, 1 - project.target_margin_percent / 100))
                : totalCost;

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

                <div className="mt-5 grid gap-3 md:grid-cols-5">
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
                      Merma
                    </div>
                    <div className="mt-2 text-xl font-semibold text-[var(--ink)]">
                      {formatClp(wasteCost)}
                    </div>
                    <div className="mt-1 text-xs text-[var(--muted)]">
                      {project.waste_percent.toFixed(1)}%
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
                    <div className="mt-1 text-xs text-[var(--muted)]">
                      Sugerido {formatClp(suggestedSalePrice)}
                    </div>
                  </div>
                  <div className="rounded-[1.25rem] border border-[var(--line)] bg-[#fff9ef] p-4">
                    <div className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--muted)]">
                      Utilidad
                    </div>
                    <div className={`mt-2 text-xl font-semibold ${profit >= 0 ? "text-emerald-700" : "text-rose-700"}`}>
                      {formatClp(profit)}
                    </div>
                    <div className="mt-1 text-xs text-[var(--muted)]">
                      {margin.toFixed(1)}% / objetivo {project.target_margin_percent.toFixed(1)}%
                    </div>
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
