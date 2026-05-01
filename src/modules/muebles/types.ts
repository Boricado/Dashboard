export type FurnitureMaterial = {
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

export type FurnitureProjectMaterial = {
  id: string;
  project_id: string;
  material_id: string;
  quantity: number;
  unit_price_snapshot: number;
  notes: string | null;
  material: FurnitureMaterial;
};

export type FurnitureProject = {
  id: string;
  name: string;
  description: string | null;
  labor_cost: number;
  sale_price: number;
  waste_percent: number;
  target_margin_percent: number;
  notes: string | null;
  created_at: string;
  updated_at: string;
  items: FurnitureProjectMaterial[];
};

export type FurnitureMaterialInput = {
  category: string;
  name: string;
  unit_label: string;
  unit_price: number;
  reference?: string;
  supplier?: string;
  note?: string;
  source_url?: string;
};

export type FurnitureProjectInput = {
  name: string;
  description?: string;
  labor_cost: number;
  sale_price: number;
  waste_percent: number;
  target_margin_percent: number;
  notes?: string;
  items: Array<{
    material_id: string;
    quantity: number;
    unit_price_snapshot: number;
    notes?: string;
  }>;
};

export type FurniturePageData = {
  materials: FurnitureMaterial[];
  projects: FurnitureProject[];
};
