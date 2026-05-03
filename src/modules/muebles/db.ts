import { createSupabaseServerClient } from "@/lib/supabase/server";
import { furnitureCatalogMeta, seedFurnitureMaterials } from "@/modules/muebles/data";
import type {
  FurnitureMaterial,
  FurnitureMaterialInput,
  FurniturePageData,
  FurnitureProject,
  FurnitureProjectInput,
} from "@/modules/muebles/types";

type MaterialRow = {
  id: string;
  material_key: string;
  category: string;
  name: string;
  unit_label: string;
  unit_price: number;
  reference: string | null;
  supplier: string | null;
  note: string | null;
  source_url: string | null;
};

type ProjectRow = {
  id: string;
  name: string;
  description: string | null;
  labor_cost: number;
  sale_price: number;
  waste_percent: number | null;
  target_margin_percent: number | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
  items: ProjectItemRow[] | null;
};

type ProjectItemRow = {
  id: string;
  project_id: string;
  material_id: string;
  quantity: number;
  unit_price_snapshot: number;
  notes: string | null;
  material: MaterialRow[] | MaterialRow | null;
};

async function getFurnitureContext() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("No hay una sesion activa.");
  }

  return { supabase, userId: user.id };
}

function mapMaterial(row: MaterialRow): FurnitureMaterial {
  return {
    id: row.id,
    material_key: row.material_key,
    category: row.category,
    name: row.name,
    unit_label: row.unit_label,
    unit_price: row.unit_price,
    reference: row.reference,
    supplier: row.supplier,
    note: row.note,
    source_url: row.source_url,
  };
}

function slugify(value: string) {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function makeMaterialKey(input: FurnitureMaterialInput) {
  const base = slugify(`${input.category}-${input.name}`);
  return `custom-${base || "material"}-${Date.now()}`;
}

function buildFallbackData(): FurniturePageData {
  const now = new Date().toISOString();
  const materials: FurnitureMaterial[] = seedFurnitureMaterials.map((item, index) => ({
    id: `local-material-${index + 1}`,
    material_key: item.material_key,
    category: item.category,
    name: item.name,
    unit_label: item.unit_label,
    unit_price: item.unit_price,
    reference: item.reference ?? null,
    supplier: item.supplier ?? null,
    note: item.note ?? null,
    source_url: item.source_url ?? null,
  }));

  return {
    materials,
    projects: [
      {
        id: "local-project-1",
        name: "Mesa de trabajo base",
        description: "Proyecto ejemplo para revisar el modulo.",
        labor_cost: 65000,
        sale_price: 220000,
        waste_percent: 10,
        target_margin_percent: 35,
        notes: furnitureCatalogMeta.note,
        created_at: now,
        updated_at: now,
        items: materials.slice(0, 3).map((material, index) => ({
          id: `local-item-${index + 1}`,
          project_id: "local-project-1",
          material_id: material.id,
          quantity: index === 0 ? 4 : 1,
          unit_price_snapshot: material.unit_price,
          notes: null,
          material,
        })),
      },
    ],
  };
}

function readRelatedMaterial(value: ProjectItemRow["material"]) {
  if (Array.isArray(value)) {
    return value[0] ?? null;
  }

  return value ?? null;
}

async function ensureFurnitureSeedData() {
  const { supabase, userId } = await getFurnitureContext();

  const { data: materials, error } = await supabase
    .from("furniture_materials")
    .select("material_key")
    .eq("user_id", userId);

  if (error) {
    throw new Error(error.message);
  }

  const existingKeys = new Set((materials ?? []).map((item) => item.material_key));
  const missing = seedFurnitureMaterials.filter((item) => !existingKeys.has(item.material_key));

  if (missing.length > 0) {
    const { error: insertError } = await supabase.from("furniture_materials").insert(
      missing.map((item) => ({
        user_id: userId,
        ...item,
      })),
    );

    if (insertError) {
      throw new Error(insertError.message);
    }
  }

  await ensureCortaVistaProject(supabase, userId);
  await ensureMesaTrabajoProject(supabase, userId);
}

async function ensureCortaVistaProject(
  supabase: Awaited<ReturnType<typeof createSupabaseServerClient>>,
  userId: string,
) {
  const projectName = "Corta vista con macetero";
  const { data: existing, error: existingError } = await supabase
    .from("furniture_projects")
    .select("id")
    .eq("user_id", userId)
    .eq("name", projectName)
    .maybeSingle();

  if (existingError) {
    throw new Error(existingError.message);
  }

  if (existing) {
    return;
  }

  const { data: materials, error: materialsError } = await supabase
    .from("furniture_materials")
    .select("id, name, unit_price")
    .eq("user_id", userId)
    .eq("category", "madera");

  if (materialsError) {
    throw new Error(materialsError.message);
  }

  const pino1x2 = materials?.find((material) => material.name.includes('1"x2"'));
  const pino1x4 = materials?.find((material) => material.name.includes('1"x4"'));

  if (!pino1x2 || !pino1x4) {
    return;
  }

  const materialCost = 24 * Number(pino1x2.unit_price) + 19 * Number(pino1x4.unit_price);
  const salePrice = Math.ceil(materialCost / 0.65);

  const { data: project, error: projectError } = await supabase
    .from("furniture_projects")
    .insert({
      user_id: userId,
      name: projectName,
      description: "Listones de pino seco cepillado segun OpenCutList.",
      labor_cost: 0,
      sale_price: salePrice,
      waste_percent: 0,
      target_margin_percent: 35,
      notes: "OpenCutList: 1x2 = 68,30 m y 1x4 = 54,56 m. Cantidades ya incluyen 10% de merma sobre barras de 3,2 m.",
    })
    .select("id")
    .single();

  if (projectError) {
    throw new Error(projectError.message);
  }

  const { error: itemsError } = await supabase.from("furniture_project_materials").insert([
    {
      project_id: project.id,
      material_id: pino1x2.id,
      quantity: 24,
      unit_price_snapshot: Number(pino1x2.unit_price),
      notes: "Compra estimada: 24 piezas de 3,2 m.",
    },
    {
      project_id: project.id,
      material_id: pino1x4.id,
      quantity: 19,
      unit_price_snapshot: Number(pino1x4.unit_price),
      notes: "Compra estimada: 19 piezas de 3,2 m.",
    },
  ]);

  if (itemsError) {
    throw new Error(itemsError.message);
  }
}

async function ensureMesaTrabajoProject(
  supabase: Awaited<ReturnType<typeof createSupabaseServerClient>>,
  userId: string,
) {
  const projectName = "Mesa de trabajo";
  const { data: materials, error: materialsError } = await supabase
    .from("furniture_materials")
    .select("id, category, name, unit_price")
    .eq("user_id", userId);

  if (materialsError) {
    throw new Error(materialsError.message);
  }

  const osb15 = materials?.find(
    (material) => material.category === "tableros" && material.name.includes("OSB 15mm"),
  );
  const terciado18 = materials?.find(
    (material) =>
      material.category === "tableros" &&
      (material.name.includes("Plywood 18mm") || material.name.includes("Terciado")),
  );
  const pino1x2 = materials?.find(
    (material) => material.category === "madera" && material.name.includes('1"x2"'),
  );
  const pino1x3 = materials?.find(
    (material) => material.category === "madera" && material.name.includes('1"x3"'),
  );

  if (!osb15 || !terciado18 || !pino1x2 || !pino1x3) {
    return;
  }

  const materialCost =
    Number(osb15.unit_price) +
    Number(terciado18.unit_price) +
    2 * Number(pino1x2.unit_price) +
    11 * Number(pino1x3.unit_price);
  const salePrice = Math.ceil(materialCost / 0.65);
  const projectPayload = {
    user_id: userId,
    name: projectName,
    description: "Mesa de carpinteria segun OpenCutList del modelo dibujado.",
    labor_cost: 0,
    sale_price: salePrice,
    waste_percent: 0,
    target_margin_percent: 35,
    notes:
      "OpenCutList: OSB 15mm x1, terciado estructural 18mm x1, pino 1x2 = 4 cortes / 4,73 m / compra 2 piezas; pino 1x3 = 34 cortes / 32,29 m / compra 11 piezas.",
  };
  const projectItems = [
    {
      material_id: osb15.id,
      quantity: 1,
      unit_price_snapshot: Number(osb15.unit_price),
      notes: "OpenCutList: 1 plancha inferior OSB 15mm 1220x2440.",
    },
    {
      material_id: terciado18.id,
      quantity: 1,
      unit_price_snapshot: Number(terciado18.unit_price),
      notes: "OpenCutList: 1 plancha superior terciado estructural 18mm 1220x2440.",
    },
    {
      material_id: pino1x2.id,
      quantity: 2,
      unit_price_snapshot: Number(pino1x2.unit_price),
      notes: "OpenCutList: 4 cortes, 4,73 m totales. Compra estimada: 2 piezas de 3,2 m.",
    },
    {
      material_id: pino1x3.id,
      quantity: 11,
      unit_price_snapshot: Number(pino1x3.unit_price),
      notes: "OpenCutList: 34 cortes, 32,29 m totales. Compra estimada: 11 piezas de 3,2 m.",
    },
  ];

  const { data: existing, error: existingError } = await supabase
    .from("furniture_projects")
    .select("id")
    .eq("user_id", userId)
    .eq("name", projectName)
    .maybeSingle();

  if (existingError) {
    throw new Error(existingError.message);
  }

  if (existing) {
    const { error: updateError } = await supabase
      .from("furniture_projects")
      .update(projectPayload)
      .eq("user_id", userId)
      .eq("id", existing.id);

    if (updateError) {
      throw new Error(updateError.message);
    }

    const { error: deleteItemsError } = await supabase
      .from("furniture_project_materials")
      .delete()
      .eq("project_id", existing.id);

    if (deleteItemsError) {
      throw new Error(deleteItemsError.message);
    }

    const { error: insertItemsError } = await supabase.from("furniture_project_materials").insert(
      projectItems.map((item) => ({
        project_id: existing.id,
        ...item,
      })),
    );

    if (insertItemsError) {
      throw new Error(insertItemsError.message);
    }

    return;
  }

  const { data: project, error: projectError } = await supabase
    .from("furniture_projects")
    .insert(projectPayload)
    .select("id")
    .single();

  if (projectError) {
    throw new Error(projectError.message);
  }

  const { error: itemsError } = await supabase.from("furniture_project_materials").insert(
    projectItems.map((item) => ({
      project_id: project.id,
      ...item,
    })),
  );

  if (itemsError) {
    throw new Error(itemsError.message);
  }
}

export async function getFurniturePageData(): Promise<FurniturePageData> {
  await ensureFurnitureSeedData();
  const { supabase, userId } = await getFurnitureContext();

  const [materialsResult, projectsResult] = await Promise.all([
    supabase
      .from("furniture_materials")
      .select(
        "id, material_key, category, name, unit_label, unit_price, reference, supplier, note, source_url",
      )
      .eq("user_id", userId)
      .order("category", { ascending: true })
      .order("name", { ascending: true }),
    supabase
      .from("furniture_projects")
      .select(
        "id, name, description, labor_cost, sale_price, waste_percent, target_margin_percent, notes, created_at, updated_at, items:furniture_project_materials(id, project_id, material_id, quantity, unit_price_snapshot, notes, material:furniture_materials(id, material_key, category, name, unit_label, unit_price, reference, supplier, note, source_url))",
      )
      .eq("user_id", userId)
      .order("created_at", { ascending: false }),
  ]);

  if (materialsResult.error) {
    throw new Error(materialsResult.error.message);
  }

  if (projectsResult.error) {
    throw new Error(projectsResult.error.message);
  }

  const materials = (materialsResult.data ?? []).map((row) => mapMaterial(row as MaterialRow));
  const projects: FurnitureProject[] = ((projectsResult.data ?? []) as ProjectRow[]).map((project) => ({
    id: project.id,
    name: project.name,
    description: project.description,
    labor_cost: project.labor_cost,
    sale_price: project.sale_price,
    waste_percent: project.waste_percent ?? 10,
    target_margin_percent: project.target_margin_percent ?? 35,
    notes: project.notes,
    created_at: project.created_at,
    updated_at: project.updated_at,
    items: ((project.items as ProjectItemRow[] | null) ?? []).map((item) => ({
      id: item.id,
      project_id: item.project_id,
      material_id: item.material_id,
      quantity: Number(item.quantity),
      unit_price_snapshot: item.unit_price_snapshot,
      notes: item.notes,
      material: mapMaterial(readRelatedMaterial(item.material) as MaterialRow),
    })),
  }));

  return { materials, projects };
}

export function getFurnitureFallbackData() {
  return buildFallbackData();
}

export async function createFurnitureMaterial(input: FurnitureMaterialInput) {
  const { supabase, userId } = await getFurnitureContext();

  const { data, error } = await supabase
    .from("furniture_materials")
    .insert({
      user_id: userId,
      material_key: makeMaterialKey(input),
      category: input.category,
      name: input.name,
      unit_label: input.unit_label,
      unit_price: input.unit_price,
      reference: input.reference ?? null,
      supplier: input.supplier ?? null,
      note: input.note ?? null,
      source_url: input.source_url ?? null,
    })
    .select("id, material_key, category, name, unit_label, unit_price, reference, supplier, note, source_url")
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return mapMaterial(data as MaterialRow);
}

export async function updateFurnitureMaterial(id: string, input: FurnitureMaterialInput) {
  const { supabase, userId } = await getFurnitureContext();

  const { data, error } = await supabase
    .from("furniture_materials")
    .update({
      category: input.category,
      name: input.name,
      unit_label: input.unit_label,
      unit_price: input.unit_price,
      reference: input.reference ?? null,
      supplier: input.supplier ?? null,
      note: input.note ?? null,
      source_url: input.source_url ?? null,
    })
    .eq("user_id", userId)
    .eq("id", id)
    .select("id, material_key, category, name, unit_label, unit_price, reference, supplier, note, source_url")
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return mapMaterial(data as MaterialRow);
}

export async function createFurnitureProject(input: FurnitureProjectInput) {
  const { supabase, userId } = await getFurnitureContext();

  const { data: project, error: projectError } = await supabase
    .from("furniture_projects")
    .insert({
      user_id: userId,
      name: input.name,
      description: input.description ?? null,
      labor_cost: input.labor_cost,
      sale_price: input.sale_price,
      waste_percent: input.waste_percent,
      target_margin_percent: input.target_margin_percent,
      notes: input.notes ?? null,
    })
    .select("id")
    .single();

  if (projectError) {
    throw new Error(projectError.message);
  }

  if (input.items.length > 0) {
    const { error: itemsError } = await supabase.from("furniture_project_materials").insert(
      input.items.map((item) => ({
        project_id: project.id,
        material_id: item.material_id,
        quantity: item.quantity,
        unit_price_snapshot: item.unit_price_snapshot,
        notes: item.notes ?? null,
      })),
    );

    if (itemsError) {
      throw new Error(itemsError.message);
    }
  }

  const pageData = await getFurniturePageData();
  const created = pageData.projects.find((item) => item.id === project.id);

  if (!created) {
    throw new Error("No se pudo leer el proyecto creado.");
  }

  return created;
}

export async function updateFurnitureProject(id: string, input: FurnitureProjectInput) {
  const { supabase, userId } = await getFurnitureContext();

  const { error: updateError } = await supabase
    .from("furniture_projects")
    .update({
      name: input.name,
      description: input.description ?? null,
      labor_cost: input.labor_cost,
      sale_price: input.sale_price,
      waste_percent: input.waste_percent,
      target_margin_percent: input.target_margin_percent,
      notes: input.notes ?? null,
    })
    .eq("user_id", userId)
    .eq("id", id);

  if (updateError) {
    throw new Error(updateError.message);
  }

  const { error: deleteItemsError } = await supabase
    .from("furniture_project_materials")
    .delete()
    .eq("project_id", id);

  if (deleteItemsError) {
    throw new Error(deleteItemsError.message);
  }

  if (input.items.length > 0) {
    const { error: insertItemsError } = await supabase.from("furniture_project_materials").insert(
      input.items.map((item) => ({
        project_id: id,
        material_id: item.material_id,
        quantity: item.quantity,
        unit_price_snapshot: item.unit_price_snapshot,
        notes: item.notes ?? null,
      })),
    );

    if (insertItemsError) {
      throw new Error(insertItemsError.message);
    }
  }

  const pageData = await getFurniturePageData();
  const updated = pageData.projects.find((item) => item.id === id);

  if (!updated) {
    throw new Error("No se pudo leer el proyecto actualizado.");
  }

  return updated;
}

export async function deleteFurnitureProject(id: string) {
  const { supabase, userId } = await getFurnitureContext();

  const { error } = await supabase
    .from("furniture_projects")
    .delete()
    .eq("user_id", userId)
    .eq("id", id);

  if (error) {
    throw new Error(error.message);
  }
}
