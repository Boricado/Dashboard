import { ContadorClient } from "@/modules/contador/ContadorClient";
import { getContadorFallbackData, getContadorPageData } from "@/modules/contador/db";

export default async function ContadorPage() {
  const data = await getContadorPageData().catch(() => getContadorFallbackData());
  return <ContadorClient initialData={data} />;
}
