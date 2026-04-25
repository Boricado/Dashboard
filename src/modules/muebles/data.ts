import rawMateriales from "@/modules/muebles/materiales.seed.json";

type RawData = typeof rawMateriales;

type SeedMaterial = {
  material_key: string;
  category: string;
  name: string;
  unit_label: string;
  unit_price: number;
  reference?: string | null;
  supplier?: string | null;
  note?: string | null;
  source_url?: string | null;
};

function slugify(value: string) {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function choosePrice(...values: Array<number | undefined>) {
  for (const value of values) {
    if (typeof value === "number" && Number.isFinite(value) && value > 0) {
      return Math.round(value);
    }
  }

  return 0;
}

const data = rawMateriales as RawData;

export const seedFurnitureMaterials: SeedMaterial[] = [
  ...data.pino_estructural.map((item) => ({
    material_key: `pino-${slugify(item.dimension)}-${String(item.largo_m).replace(".", "-")}`,
    category: "madera",
    name: `Pino ${item.dimension} · ${item.largo_m}m`,
    unit_label: "pieza",
    unit_price: choosePrice(item.precio_sodimac, item.precio_min, item.precio_max),
    reference: `${item.dimension} / ${item.largo_m}m`,
    supplier: "Sodimac / maderera local",
    note: [item.nota_sodimac, data.consejo_compra].filter(Boolean).join(" "),
    source_url: item.url_sodimac,
  })),
  ...data.tableros.map((item) => ({
    material_key: `tablero-${slugify(item.tipo)}-${slugify(item.dim)}`,
    category: "tableros",
    name: `${item.tipo} · ${item.dim}`,
    unit_label: "plancha",
    unit_price: choosePrice(item.precio_sodimac, item.precio_min, item.precio_max),
    reference: `${item.dim} · ${item.m2} m2`,
    supplier: "Sodimac / retail",
    note: [item.nota_sodimac, item.nota].filter(Boolean).join(" "),
    source_url: item.url_sodimac,
  })),
  ...data.herrajes_y_fijaciones.map((item) => ({
    material_key: `herraje-${slugify(item.tipo)}`,
    category: "herrajes",
    name: item.tipo,
    unit_label: "unidad",
    unit_price: choosePrice(item.precio_u_sodimac, item.precio_sodimac, item.precio_u_min),
    reference: null,
    supplier: "Sodimac / ferreteria",
    note: item.nota,
    source_url: item.url_sodimac ?? null,
  })),
  ...data.acabados.map((item) => ({
    material_key: `acabado-${slugify(item.tipo)}`,
    category: "acabados",
    name: item.tipo,
    unit_label: "unidad",
    unit_price: choosePrice(item.precio_min, item.precio_max),
    reference: item.recomendado ? "Recomendado" : "Opcional",
    supplier: "Retail / pintura",
    note: item.nota ?? null,
    source_url: null,
  })),
];

export const furnitureCatalogMeta = {
  currency: data.moneda,
  updatedAt: data.ultima_actualizacion,
  note: data.nota,
};
