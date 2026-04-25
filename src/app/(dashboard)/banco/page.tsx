import { BancoClient } from "@/modules/banco/BancoClient";
import { getBankFallbackData, getBankPageData } from "@/modules/banco/db";

export default async function BancoPage() {
  const data = await getBankPageData().catch(() => getBankFallbackData());
  return <BancoClient initialData={data} />;
}
