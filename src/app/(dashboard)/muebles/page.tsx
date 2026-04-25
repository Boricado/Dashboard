import { MueblesClient } from "@/modules/muebles/MueblesClient";
import { getFurnitureFallbackData, getFurniturePageData } from "@/modules/muebles/db";

export default async function MueblesPage() {
  const data = await getFurniturePageData().catch(() => getFurnitureFallbackData());
  return <MueblesClient initialData={data} />;
}
