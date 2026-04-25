import { createSupabaseServerClient } from "@/lib/supabase/server";
import { furnitureCatalogMeta, seedFurnitureMaterials } from "@/modules/muebles/data";
import type {
  FurnitureMaterial,
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

  if (missing.length === 0) {
    return;
  }

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
        "id, name, description, labor_cost, sale_price, notes, created_at, updated_at, items:furniture_project_materials(id, project_id, material_id, quantity, unit_price_snapshot, notes, material:furniture_materials(id, material_key, category, name, unit_label, unit_price, reference, supplier, note, source_url))",
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
  const projects: FurnitureProject[] = (projectsResult.data ?? []).map((project) => ({
    id: project.id,
    name: project.name,
    description: project.description,
    labor_cost: project.labor_cost,
    sale_price: project.sale_price,
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
