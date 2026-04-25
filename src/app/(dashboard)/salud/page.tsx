import { SaludClient } from "@/modules/salud/SaludClient";
import { getHealthPageData } from "@/modules/salud/db";

export default async function SaludPage() {
  const data = await getHealthPageData();
  return <SaludClient initialData={data} />;
}
