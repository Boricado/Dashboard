import { createSupabaseServerClient } from "@/lib/supabase/server";

export default async function PerfilPage() {
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase.auth.getUser();

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Perfil</h1>
        <p className="mt-1 text-sm text-[var(--muted)]">
          Confirmación de sesión sin exponer secretos.
        </p>
      </div>

      <div className="app-card p-4">
        <div className="text-sm font-medium">Usuario</div>
        <div className="mt-2 grid gap-2 text-sm">
          <div className="flex items-center justify-between gap-3">
            <span className="text-[var(--muted)]">Email</span>
            <span className="font-medium">{data.user?.email ?? "—"}</span>
          </div>
          <div className="flex items-center justify-between gap-3">
            <span className="text-[var(--muted)]">User ID</span>
            <span className="font-mono text-xs">{data.user?.id ?? "—"}</span>
          </div>
          <div className="flex items-center justify-between gap-3">
            <span className="text-[var(--muted)]">Proveedor</span>
            <span className="font-medium">
              {data.user?.app_metadata?.provider ?? "—"}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
