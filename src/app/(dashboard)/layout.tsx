import { redirect } from "next/navigation";
import { AppShell } from "@/components/AppShell";
import { hasSupabaseEnv } from "@/lib/env";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export default async function DashboardLayout(props: {
  children: React.ReactNode;
}) {
  if (!hasSupabaseEnv()) {
    redirect("/configuracion");
  }

  const supabase = await createSupabaseServerClient();
  const { data } = await supabase.auth.getUser();

  if (!data.user) {
    redirect("/login?next=/salud");
  }

  return <AppShell>{props.children}</AppShell>;
}
