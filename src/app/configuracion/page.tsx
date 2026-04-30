import Link from "next/link";

function getMissingEnv() {
  const missing: string[] = [];

  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
    missing.push("NEXT_PUBLIC_SUPABASE_URL");
  }

  if (!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    missing.push("NEXT_PUBLIC_SUPABASE_ANON_KEY");
  }

  return missing;
}

export default function ConfiguracionPage() {
  const missing = getMissingEnv();

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-5 px-6 py-16">
      <div>
        <span className="inline-flex rounded-full bg-[var(--accent-soft)] px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-[var(--accent-strong)]">
          Setup
        </span>
        <h1 className="mt-4 text-3xl font-semibold tracking-tight">
          Configuración
        </h1>
        <p className="mt-2 text-sm leading-6 text-[var(--muted)]">
          Esta base puede vivir sin Supabase mientras diseñamos la estructura.
          Cuando quieras conectar autenticación y datos reales, completa estas
          variables.
        </p>
      </div>

      {missing.length === 0 ? (
        <div className="app-card p-5">
          <div className="text-sm font-medium">Supabase listo</div>
          <p className="mt-2 text-sm leading-6 text-[var(--muted)]">
            Las variables de entorno ya están configuradas. Puedes entrar al
            dashboard y conectar cada módulo gradualmente.
          </p>
          <div className="mt-3">
            <Link className="text-sm font-medium underline" href="/salud">
              Ir a salud
            </Link>
          </div>
        </div>
      ) : (
        <div className="rounded-[1.75rem] border border-amber-200 bg-amber-50 p-5 text-amber-950">
          <div className="text-sm font-medium">Faltan variables de entorno</div>
          <p className="mt-2 text-sm leading-6 opacity-90">
            Crea un archivo{" "}
            <code className="rounded bg-black/10 px-1 py-0.5 text-[12px]">
              .env.local
            </code>{" "}
            en la raíz del proyecto y agrega:
          </p>
          <ul className="mt-2 list-disc pl-5 text-sm">
            {missing.map((item) => (
              <li key={item}>
                <code className="rounded bg-black/10 px-1 py-0.5 text-[12px]">
                  {item}
                </code>
              </li>
            ))}
          </ul>
          <p className="mt-3 text-sm opacity-90">
            Luego reinicia{" "}
            <code className="rounded bg-black/10 px-1 py-0.5 text-[12px]">
              npm run dev
            </code>
            .
          </p>
        </div>
      )}

      <div className="app-card p-5">
        <div className="text-sm font-medium">Endpoint de prueba</div>
        <p className="mt-2 text-sm leading-6 text-[var(--muted)]">
          Cuando esté configurado, prueba{" "}
          <code className="rounded bg-[var(--surface-strong)] px-1 py-0.5 text-[12px]">
            /api/health
          </code>
          .
        </p>
      </div>
    </div>
  );
}
