import type {
  FurnitureMaterialInput,
  FurnitureProjectInput,
} from "@/modules/muebles/types";

type ProjectValidationResult =
  | { ok: true; data: FurnitureProjectInput }
  | { ok: false; error: string };

type MaterialValidationResult =
  | { ok: true; data: FurnitureMaterialInput }
  | { ok: false; error: string };

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
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
    return 0;
  }

  const parsed = Number(cleaned);
  return Number.isFinite(parsed) ? Math.round(parsed) : null;
}

function parseQuantity(value: unknown) {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }

  if (typeof value !== "string") {
    return null;
  }

  const normalized = value.replace(",", ".");
  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : null;
}

function parsePercent(value: unknown, fallback: number) {
  if (typeof value === "number" && Number.isFinite(value)) {
    return Math.round(value * 10) / 10;
  }

  if (typeof value !== "string" || value.trim().length === 0) {
    return fallback;
  }

  const parsed = Number(value.replace(",", "."));
  return Number.isFinite(parsed) ? Math.round(parsed * 10) / 10 : null;
}

function readOptionalText(value: unknown) {
  return typeof value === "string" && value.trim().length > 0
    ? value.trim()
    : undefined;
}

export function validateFurnitureProjectInput(payload: unknown): ProjectValidationResult {
  if (!isPlainObject(payload)) {
    return { ok: false, error: "El cuerpo es invalido." };
  }

  const name =
    typeof payload.name === "string" && payload.name.trim().length > 0
      ? payload.name.trim()
      : null;

  if (!name) {
    return { ok: false, error: "El nombre del proyecto es obligatorio." };
  }

  const laborCost = parseMoney(payload.labor_cost);
  const salePrice = parseMoney(payload.sale_price);
  const wastePercent = parsePercent(payload.waste_percent, 10);
  const targetMarginPercent = parsePercent(payload.target_margin_percent, 35);

  if (laborCost == null || laborCost < 0) {
    return { ok: false, error: "La mano de obra no es valida." };
  }

  if (salePrice == null || salePrice < 0) {
    return { ok: false, error: "El precio de venta no es valido." };
  }

  if (wastePercent == null || wastePercent < 0 || wastePercent > 100) {
    return { ok: false, error: "La merma debe estar entre 0% y 100%." };
  }

  if (targetMarginPercent == null || targetMarginPercent < 0 || targetMarginPercent >= 95) {
    return { ok: false, error: "El margen objetivo debe estar entre 0% y 95%." };
  }

  const rawItems = Array.isArray(payload.items) ? payload.items : [];
  const items: FurnitureProjectInput["items"] = [];

  for (const rawItem of rawItems) {
    if (!isPlainObject(rawItem)) {
      return { ok: false, error: "Hay materiales invalidos en el proyecto." };
    }

    const materialId =
      typeof rawItem.material_id === "string" && rawItem.material_id.trim().length > 0
        ? rawItem.material_id.trim()
        : null;

    const quantity = parseQuantity(rawItem.quantity);
    const unitPrice = parseMoney(rawItem.unit_price_snapshot);

    if (!materialId) {
      return { ok: false, error: "Cada material debe tener un id valido." };
    }

    if (quantity == null || quantity <= 0) {
      return { ok: false, error: "Cada material debe tener una cantidad mayor que cero." };
    }

    if (unitPrice == null || unitPrice < 0) {
      return { ok: false, error: "Cada material debe tener un precio valido." };
    }

    items.push({
      material_id: materialId,
      quantity,
      unit_price_snapshot: unitPrice,
      notes:
        typeof rawItem.notes === "string" && rawItem.notes.trim().length > 0
          ? rawItem.notes.trim()
          : undefined,
    });
  }

  return {
    ok: true,
    data: {
      name,
      description: readOptionalText(payload.description),
      labor_cost: laborCost,
      sale_price: salePrice,
      waste_percent: wastePercent,
      target_margin_percent: targetMarginPercent,
      notes: readOptionalText(payload.notes),
      items,
    },
  };
}

export function validateFurnitureMaterialInput(payload: unknown): MaterialValidationResult {
  if (!isPlainObject(payload)) {
    return { ok: false, error: "El cuerpo es invalido." };
  }

  const category = readOptionalText(payload.category);
  const name = readOptionalText(payload.name);
  const unitLabel = readOptionalText(payload.unit_label);
  const unitPrice = parseMoney(payload.unit_price);

  if (!category) {
    return { ok: false, error: "La categoria del material es obligatoria." };
  }

  if (!name) {
    return { ok: false, error: "El nombre del material es obligatorio." };
  }

  if (!unitLabel) {
    return { ok: false, error: "La unidad del material es obligatoria." };
  }

  if (unitPrice == null || unitPrice < 0) {
    return { ok: false, error: "El precio del material no es valido." };
  }

  return {
    ok: true,
    data: {
      category,
      name,
      unit_label: unitLabel,
      unit_price: unitPrice,
      reference: readOptionalText(payload.reference),
      supplier: readOptionalText(payload.supplier),
      note: readOptionalText(payload.note),
      source_url: readOptionalText(payload.source_url),
    },
  };
}
