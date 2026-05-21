import empresasData from "@/modules/calibracion/data/empresas_nacionales.json";
import implementacionData from "@/modules/calibracion/data/implementacion.json";
import normativaData from "@/modules/calibracion/data/normativa_mercado.json";
import preciosData from "@/modules/calibracion/data/precios_mercado.json";
import resumenData from "@/modules/calibracion/data/resumen_ejecutivo.json";

function formatClp(value: number) {
  return new Intl.NumberFormat("es-CL", {
    style: "currency",
    currency: "CLP",
    maximumFractionDigits: 0,
  }).format(value);
}

function formatMillions(value: number) {
  return `$${(value / 1_000_000).toLocaleString("es-CL", {
    maximumFractionDigits: 1,
  })}M`;
}

function rangeMillions(min: number, max: number) {
  return `${formatMillions(min)}-${formatMillions(max)}`;
}

function StatusPill(props: { children: React.ReactNode; tone?: "green" | "amber" | "blue" | "neutral" }) {
  const tone = props.tone ?? "neutral";
  const classes = {
    green: "bg-emerald-100 text-emerald-800",
    amber: "bg-amber-100 text-amber-800",
    blue: "bg-sky-100 text-sky-800",
    neutral: "bg-[#eef1ea] text-[var(--muted)]",
  };

  return (
    <span className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${classes[tone]}`}>
      {props.children}
    </span>
  );
}

function SectionCard(props: {
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="app-card p-5 sm:p-6">
      <div className="mb-4">
        <h2 className="text-lg font-semibold text-[var(--ink)]">{props.title}</h2>
        {props.description ? (
          <p className="mt-1 text-sm text-[var(--muted)]">{props.description}</p>
        ) : null}
      </div>
      {props.children}
    </section>
  );
}

export function CalibracionClient() {
  const totalTipico = implementacionData.inversion_total.tipica;
  const fuentes = [...resumenData.fuentes, ...normativaData.fuentes];

  return (
    <div className="flex flex-col gap-5">
      <section className="app-card overflow-hidden p-5 sm:p-7">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-3xl">
            <div className="mb-3 flex flex-wrap items-center gap-2">
              <StatusPill tone="green">Proyecto 4</StatusPill>
              <StatusPill>Estudio base {resumenData.fecha_estudio}</StatusPill>
              <StatusPill tone="blue">Empresa creada</StatusPill>
            </div>
            <h1 className="text-3xl font-semibold text-[var(--ink)] sm:text-4xl">
              Laboratorio de Calibracion por Etapas
            </h1>
            <p className="mt-3 text-base leading-relaxed text-[var(--muted)]">
              Etapa 1 enfocada exclusivamente en instrumentos topograficos. Etapa 2
              para balanzas, masas patron, temperatura, presion y otras magnitudes
              cuando la operacion topografica ya este validada.
            </p>
          </div>
          <div className="min-w-[220px] rounded-xl border border-emerald-200 bg-emerald-50 p-4">
            <p className="text-xs font-semibold uppercase text-emerald-800">Veredicto</p>
            <p className="mt-1 text-2xl font-semibold text-emerald-900">{resumenData.veredicto}</p>
            <p className="mt-1 text-sm text-emerald-800">
              Score de viabilidad: {resumenData.score_viabilidad}/100
            </p>
          </div>
        </div>
      </section>

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {[
          {
            label: "Alcance inicial",
            value: "Topografia",
            detail: resumenData.estrategia.etapa_1,
          },
          {
            label: "Inversion Etapa 1 tipica",
            value: formatMillions(totalTipico),
            detail: implementacionData.nota,
          },
          {
            label: "Acreditacion INN",
            value: `${implementacionData.acreditacion_inn.tiempo_total_meses.min}-${implementacionData.acreditacion_inn.tiempo_total_meses.max}`,
            detail: "meses estimados para ISO/IEC 17025",
          },
          {
            label: "Ingreso potencial etapa 2",
            value: rangeMillions(
              resumenData.proyeccion_ingresos.at(-1)?.ingreso_mensual_min ?? 0,
              resumenData.proyeccion_ingresos.at(-1)?.ingreso_mensual_max ?? 0,
            ),
            detail: "CLP mensuales en escenario consolidado",
          },
        ].map((item) => (
          <article key={item.label} className="app-card p-4">
            <p className="text-xs font-semibold uppercase text-[var(--muted)]">{item.label}</p>
            <p className="mt-2 text-2xl font-semibold text-[var(--ink)]">{item.value}</p>
            <p className="mt-2 line-clamp-2 text-xs leading-relaxed text-[var(--muted)]">
              {item.detail}
            </p>
          </article>
        ))}
      </section>

      <SectionCard
        title="Estrategia en dos etapas"
        description={resumenData.estado_empresa}
      >
        <div className="grid gap-3 lg:grid-cols-2">
          {implementacionData.etapas_estrategicas.map((etapa) => (
            <article key={etapa.id} className="rounded-xl border border-[var(--line)] bg-white/70 p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h3 className="font-semibold text-[var(--ink)]">{etapa.nombre}</h3>
                  <p className="mt-1 text-sm leading-relaxed text-[var(--muted)]">
                    {etapa.objetivo}
                  </p>
                </div>
                <StatusPill tone={etapa.id === "etapa-1" ? "green" : "blue"}>
                  {etapa.plazo_meses} meses
                </StatusPill>
              </div>
              <div className="mt-3 flex flex-wrap gap-1.5">
                {etapa.alcance.map((item) => (
                  <span
                    key={item}
                    className="rounded-md border border-[var(--line)] bg-white px-2 py-1 text-[11px] text-[var(--muted)]"
                  >
                    {item}
                  </span>
                ))}
              </div>
              <div className="mt-4 grid gap-2 text-sm sm:grid-cols-2">
                <p>
                  <span className="text-[var(--muted)]">Inversion tipica: </span>
                  <span className="font-semibold text-[var(--accent-strong)]">
                    {formatMillions(etapa.inversion_tipica)}
                  </span>
                </p>
                <p>
                  <span className="text-[var(--muted)]">Resultado: </span>
                  <span className="font-semibold text-[var(--ink)]">{etapa.resultado}</span>
                </p>
              </div>
            </article>
          ))}
        </div>
      </SectionCard>

      <div className="grid gap-5 lg:grid-cols-2">
        <SectionCard title="Fortalezas">
          <ul className="space-y-2">
            {resumenData.fortalezas.map((item) => (
              <li key={item} className="flex gap-2 text-sm leading-relaxed text-[var(--ink)]">
                <span className="mt-2 size-1.5 shrink-0 rounded-full bg-[var(--accent)]" />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </SectionCard>

        <SectionCard title="Riesgos">
          <ul className="space-y-2">
            {resumenData.riesgos.map((item) => (
              <li key={item} className="flex gap-2 text-sm leading-relaxed text-[var(--ink)]">
                <span className="mt-2 size-1.5 shrink-0 rounded-full bg-amber-500" />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </SectionCard>
      </div>

      <SectionCard
        title="Plan de implementacion escalonada"
        description="Primero topografia; despues masas, balanzas y magnitudes industriales."
      >
        <div className="space-y-3">
          {implementacionData.fases.map((fase) => (
            <article
              key={fase.id}
              className="rounded-xl border border-[var(--line)] bg-white/70 p-4"
            >
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start">
                <div className="grid size-10 shrink-0 place-items-center rounded-lg bg-[var(--accent-soft)] text-lg font-semibold text-[var(--accent-strong)]">
                  {fase.id}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="font-semibold text-[var(--ink)]">{fase.nombre}</h3>
                    <StatusPill>{fase.duracion_meses} meses</StatusPill>
                  </div>
                  <p className="mt-1 text-sm leading-relaxed text-[var(--muted)]">
                    {fase.descripcion}
                  </p>
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {fase.acciones.map((accion) => (
                      <span
                        key={accion}
                        className="rounded-md border border-[var(--line)] bg-white px-2 py-1 text-[11px] text-[var(--muted)]"
                      >
                        {accion}
                      </span>
                    ))}
                  </div>
                  <div className="mt-3 grid gap-2 text-sm sm:grid-cols-2">
                    <p>
                      <span className="text-[var(--muted)]">Inversion: </span>
                      <span className="font-semibold text-[var(--ink)]">
                        {rangeMillions(fase.inversion_min, fase.inversion_max)}
                      </span>
                    </p>
                    <p>
                      <span className="text-[var(--muted)]">Ingresos estimados: </span>
                      <span className="font-semibold text-[var(--accent-strong)]">
                        {rangeMillions(fase.ingresos_estimados_mes.min, fase.ingresos_estimados_mes.max)}/mes
                      </span>
                    </p>
                  </div>
                </div>
              </div>
            </article>
          ))}
        </div>
      </SectionCard>

      <SectionCard
        title="Exigencias chilenas por etapa"
        description={normativaData.principio_operativo}
      >
        <div className="grid gap-3 lg:grid-cols-2">
          {normativaData.etapas.map((etapa) => (
            <article key={etapa.id} className="rounded-xl border border-[var(--line)] bg-white/70 p-4">
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="font-semibold text-[var(--ink)]">{etapa.nombre}</h3>
                <StatusPill tone={etapa.id === "etapa-1" ? "green" : "blue"}>
                  {etapa.resoluciones_clave.length} normas
                </StatusPill>
              </div>
              <ul className="mt-3 space-y-2">
                {etapa.exigencias.map((item) => (
                  <li key={item} className="flex gap-2 text-sm leading-relaxed text-[var(--ink)]">
                    <span className="mt-2 size-1.5 shrink-0 rounded-full bg-[var(--accent)]" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
              <div className="mt-4 flex flex-wrap gap-1.5">
                {etapa.resoluciones_clave.map((item) => (
                  <span
                    key={item}
                    className="rounded-md bg-[var(--accent-soft)] px-2 py-1 text-[11px] font-medium text-[var(--accent-strong)]"
                  >
                    {item}
                  </span>
                ))}
              </div>
            </article>
          ))}
        </div>
      </SectionCard>

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_minmax(320px,0.75fr)]">
        <SectionCard
          title="Desglose de inversion"
          description="Etapa 1: laboratorio topografico/geodimensional con ruta a acreditacion."
        >
          <div className="space-y-4">
            {implementacionData.inversion_total.desglose.map((item) => {
              const pct = Math.round((item.tipico / totalTipico) * 100);

              return (
                <div key={item.concepto}>
                  <div className="mb-1 flex flex-wrap items-center justify-between gap-2">
                    <span className="text-sm text-[var(--ink)]">{item.concepto}</span>
                    <span className="text-sm font-semibold text-[var(--accent-strong)]">
                      {formatMillions(item.tipico)}
                    </span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-[#e8ede6]">
                    <div className="h-full rounded-full bg-[var(--accent)]" style={{ width: `${pct}%` }} />
                  </div>
                  <p className="mt-1 text-xs text-[var(--muted)]">
                    Rango {rangeMillions(item.min, item.alto)}
                  </p>
                </div>
              );
            })}
            <div className="flex items-center justify-between border-t border-[var(--line)] pt-3">
              <span className="font-semibold text-[var(--ink)]">Total tipico</span>
              <span className="text-lg font-semibold text-[var(--accent-strong)]">
                {formatMillions(totalTipico)}
              </span>
            </div>
          </div>
        </SectionCard>

        <SectionCard
          title="Acreditacion INN / ISO 17025"
          description={`${implementacionData.acreditacion_inn.organismo} · ${implementacionData.acreditacion_inn.norma}`}
        >
          <div className="space-y-2">
            {implementacionData.acreditacion_inn.costos.map((item) => (
              <div
                key={item.concepto}
                className="flex items-center justify-between gap-3 rounded-lg border border-[var(--line)] bg-white/70 px-3 py-2"
              >
                <span className="text-sm text-[var(--ink)]">{item.concepto}</span>
                <span className="shrink-0 text-sm font-semibold text-[var(--accent-strong)]">
                  {rangeMillions(item.min, item.max)}
                </span>
              </div>
            ))}
          </div>
        </SectionCard>
      </div>

      <SectionCard
        title="Resoluciones y normas clave"
        description="Base normativa usada para ordenar el proyecto y separar topografia de la expansion metrologica general."
      >
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          {normativaData.resoluciones_y_normas.map((item) => (
            <article key={item.nombre} className="rounded-xl border border-[var(--line)] bg-white/70 p-4">
              <div className="flex flex-wrap items-center gap-2">
                <StatusPill tone={item.aplica.includes("Etapa 1") ? "green" : "blue"}>
                  {item.aplica}
                </StatusPill>
              </div>
              <h3 className="mt-3 font-semibold text-[var(--ink)]">{item.nombre}</h3>
              <p className="mt-1 text-xs font-semibold uppercase text-[var(--muted)]">{item.tipo}</p>
              <p className="mt-2 text-sm leading-relaxed text-[var(--muted)]">{item.uso}</p>
            </article>
          ))}
        </div>
      </SectionCard>

      <SectionCard
        title="Proyeccion de ingresos por fase"
        description="Estimacion conservadora con precio promedio por servicio."
      >
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {resumenData.proyeccion_ingresos.map((item) => (
            <article key={item.fase} className="rounded-xl border border-[var(--line)] bg-white/70 p-4">
              <p className="text-xs font-semibold uppercase text-[var(--muted)]">{item.fase}</p>
              <p className="mt-2 text-xl font-semibold text-[var(--accent-strong)]">
                {rangeMillions(item.ingreso_mensual_min, item.ingreso_mensual_max)}
              </p>
              <div className="mt-3 flex justify-between gap-3 border-t border-[var(--line)] pt-3 text-xs text-[var(--muted)]">
                <span>{item.servicios_mes} servicios/mes</span>
                <span>{formatClp(item.precio_promedio)} prom.</span>
              </div>
            </article>
          ))}
        </div>
      </SectionCard>

      <SectionCard
        title="Estudio de mercado por fases"
        description="Secuencia comercial para validar demanda, entrar con topografia y expandir despues a calibracion industrial."
      >
        <div className="grid gap-3 lg:grid-cols-5">
          {normativaData.estudio_mercado_fases.map((fase) => (
            <article key={fase.fase} className="rounded-xl border border-[var(--line)] bg-white/70 p-4">
              <h3 className="font-semibold text-[var(--ink)]">{fase.fase}</h3>
              <p className="mt-2 text-sm leading-relaxed text-[var(--muted)]">{fase.objetivo}</p>
              <div className="mt-3 flex flex-wrap gap-1.5">
                {fase.acciones.map((accion) => (
                  <span
                    key={accion}
                    className="rounded-md border border-[var(--line)] bg-white px-2 py-1 text-[11px] text-[var(--muted)]"
                  >
                    {accion}
                  </span>
                ))}
              </div>
            </article>
          ))}
        </div>
      </SectionCard>

      <SectionCard
        title="Precios de mercado"
        description={`${preciosData.nota} Ultima actualizacion: ${preciosData.ultima_actualizacion}.`}
      >
        <div className="space-y-6">
          {preciosData.categorias.map((categoria) => (
            <div key={categoria.id}>
              <div className="mb-3 flex items-center gap-2">
                <span className="size-3 rounded-full" style={{ backgroundColor: categoria.color }} />
                <h3 className="font-semibold text-[var(--ink)]">{categoria.nombre}</h3>
              </div>
              <div className="overflow-x-auto rounded-xl border border-[var(--line)]">
                <table className="w-full min-w-[620px] border-collapse bg-white/70 text-sm">
                  <thead>
                    <tr className="border-b border-[var(--line)] bg-[#f4f7f2]">
                      <th className="px-3 py-2 text-left text-xs font-semibold uppercase text-[var(--muted)]">
                        Instrumento
                      </th>
                      <th className="px-3 py-2 text-right text-xs font-semibold uppercase text-[var(--muted)]">
                        Minimo
                      </th>
                      <th className="px-3 py-2 text-right text-xs font-semibold uppercase text-[var(--muted)]">
                        Tipico
                      </th>
                      <th className="px-3 py-2 text-right text-xs font-semibold uppercase text-[var(--muted)]">
                        Maximo
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {categoria.items.map((item) => (
                      <tr key={`${categoria.id}-${item.instrumento}`} className="border-b border-[var(--line)] last:border-b-0">
                        <td className="px-3 py-2 text-[var(--ink)]">
                          {item.instrumento}
                          {item.nota ? (
                            <span className="ml-1 text-xs text-[var(--muted)]">({item.nota})</span>
                          ) : null}
                        </td>
                        <td className="px-3 py-2 text-right text-[var(--muted)]">{formatClp(item.min)}</td>
                        <td className="px-3 py-2 text-right font-semibold text-[var(--accent-strong)]">
                          {formatClp(item.tipico)}
                        </td>
                        <td className="px-3 py-2 text-right text-[var(--muted)]">{formatClp(item.max)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ))}
        </div>
      </SectionCard>

      <SectionCard title="Alertas comerciales">
        <div className="grid gap-2 md:grid-cols-2">
          {normativaData.alertas_comerciales.map((alerta) => (
            <div
              key={alerta}
              className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm leading-relaxed text-amber-900"
            >
              {alerta}
            </div>
          ))}
        </div>
      </SectionCard>

      <SectionCard
        title="Competencia nacional"
        description={`${empresasData.length} laboratorios identificados; ninguno con sede acreditada en Coquimbo.`}
      >
        <div className="grid gap-3 lg:grid-cols-2">
          {empresasData.map((empresa) => (
            <article key={empresa.id} className="rounded-xl border border-[var(--line)] bg-white/70 p-4">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <h3 className="font-semibold text-[var(--ink)]">{empresa.nombre}</h3>
                  <p className="mt-1 text-xs text-[var(--muted)]">{empresa.sede}</p>
                </div>
                <StatusPill tone={empresa.segmento.includes("Multinacional") ? "blue" : "neutral"}>
                  {empresa.segmento}
                </StatusPill>
              </div>
              <div className="mt-3 flex flex-wrap gap-1.5">
                {empresa.alcances.map((alcance) => (
                  <span
                    key={alcance}
                    className="rounded-md border border-[var(--line)] bg-white px-2 py-1 text-[11px] text-[var(--muted)]"
                  >
                    {alcance}
                  </span>
                ))}
              </div>
              <div className="mt-3 space-y-1 text-xs text-[var(--muted)]">
                <p>
                  <span className="font-semibold text-[var(--ink)]">Acreditacion: </span>
                  {empresa.acreditacion}
                </p>
                <p>
                  <span className="font-semibold text-[var(--ink)]">Coquimbo: </span>
                  {empresa.presencia_coquimbo}
                </p>
                {empresa.nota ? <p className="italic">{empresa.nota}</p> : null}
              </div>
            </article>
          ))}
        </div>
      </SectionCard>

      <SectionCard
        title="Sectores demandantes"
        description="Demanda regional por industria e instrumentos asociados."
      >
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {resumenData.sectores_demandantes.map((sector) => (
            <article key={sector.sector} className="rounded-xl border border-[var(--line)] bg-white/70 p-4">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <h3 className="font-semibold text-[var(--ink)]">{sector.sector}</h3>
                  <p className="mt-1 text-xs text-[var(--muted)]">{sector.localidad}</p>
                </div>
                <StatusPill tone={sector.demanda === "alta" ? "green" : "amber"}>
                  {sector.demanda}
                </StatusPill>
              </div>
              <div className="mt-3 flex flex-wrap gap-1.5">
                {sector.instrumentos.map((instrumento) => (
                  <span
                    key={instrumento}
                    className="rounded-md bg-[var(--accent-soft)] px-2 py-1 text-[11px] font-medium text-[var(--accent-strong)]"
                  >
                    {instrumento}
                  </span>
                ))}
              </div>
            </article>
          ))}
        </div>
      </SectionCard>

      <SectionCard title="Fuentes para verificar">
        <div className="flex flex-wrap gap-2">
          {fuentes.map((fuente) => (
            <span
              key={`${fuente.nombre}-${fuente.url}`}
              className="rounded-md border border-[var(--line)] bg-white px-3 py-2 text-xs text-[var(--muted)]"
            >
              <span className="font-semibold text-[var(--ink)]">{fuente.nombre}</span>: {fuente.url}
            </span>
          ))}
        </div>
      </SectionCard>
    </div>
  );
}
