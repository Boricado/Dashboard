import type { FurnitureProjectInput } from "@/modules/muebles/types";

type ValidationResult =
  | { ok: true; data: FurnitureProjectInput }
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

export function validateFurnitureProjectInput(payload: unknown): ValidationResult {
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

  if (laborCost == null || laborCost < 0) {
    return { ok: false, error: "La mano de obra no es valida." };
  }

  if (salePrice == null || salePrice < 0) {
    return { ok: false, error: "El precio de venta no es valido." };
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
      description:
        typeof payload.description === "string" && payload.description.trim().length > 0
          ? payload.description.trim()
          : undefined,
      labor_cost: laborCost,
      sale_price: salePrice,
      notes:
        typeof payload.notes === "string" && payload.notes.trim().length > 0
          ? payload.notes.trim()
          : undefined,
      items,
    },
  };
}
