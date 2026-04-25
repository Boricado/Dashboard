import { LicitacionesClient } from "@/modules/licitaciones/LicitacionesClient";
import {
  getLicitacionesFallbackData,
  getLicitacionesPageData,
} from "@/modules/licitaciones/db";

export default async function LicitacionesPage() {
  const data = await getLicitacionesPageData().catch(() => getLicitacionesFallbackData());
  return <LicitacionesClient initialData={data} />;
}
