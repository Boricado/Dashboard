export type AppSectionId =
  | "inicio"
  | "licitaciones"
  | "tareas"
  | "salud"
  | "proyectos"
  | "muebles"
  | "banco"
  | "contador";

export type AppSection = {
  id: AppSectionId;
  label: string;
  href: `/${AppSectionId}`;
  description: string;
  summary: string;
  status: "base lista" | "para modelar";
  contextFile: `src/modules/${string}/CONTEXT.md`;
  nextSlice: string[];
  dataModel: string[];
  boundaries: string[];
  checklist: string[];
};

export const APP_SECTIONS: AppSection[] = [
  {
    id: "inicio",
    label: "Inicio",
    href: "/inicio",
    description: "Vista general del dashboard y puerta de entrada a cada área.",
    summary:
      "Esta portada resume la arquitectura. Su trabajo no es concentrar toda la lógica, sino dejar claro dónde vive cada dominio y qué archivo da contexto a la IA.",
    status: "base lista",
    contextFile: "src/modules/inicio/CONTEXT.md",
    nextSlice: [
      "Definir prioridades reales para las primeras dos secciones.",
      "Mantener la portada como mapa, no como archivo de negocio.",
      "Usar esta vista para detectar módulos muertos o duplicados.",
    ],
    dataModel: [
      "No requiere tablas propias.",
      "Puede leer métricas resumidas de otros módulos más adelante.",
      "Debe seguir siendo una capa liviana.",
    ],
    boundaries: [
      "No mezclar formularios complejos en la portada.",
      "No replicar la lógica interna de cada sección aquí.",
      "Solo mostrar estado, accesos y prioridades.",
    ],
    checklist: [
      "Accesos a todas las secciones activas.",
      "Indicadores de qué módulo está operativo o pendiente.",
      "Resumen corto de arquitectura para futuras sesiones.",
    ],
  },
  {
    id: "licitaciones",
    label: "Licitaciones",
    href: "/licitaciones",
    description: "Seguimiento de oportunidades, estados y próximos movimientos.",
    summary:
      "Aquí conviene concentrar solamente el flujo comercial de licitaciones: listado, filtros, decisiones y recordatorios. Nada de mezclarlo con salud, muebles o utilidades sueltas.",
    status: "para modelar",
    contextFile: "src/modules/licitaciones/CONTEXT.md",
    nextSlice: [
      "Listado principal con filtros por estado y fecha de cierre.",
      "Acción del usuario: revisar, postular, descartar o ganado.",
      "Notas rápidas por oportunidad.",
    ],
    dataModel: ["licitaciones", "licitacion_notas", "licitacion_eventos"],
    boundaries: [
      "No mezclar documentos tributarios aquí.",
      "No meter tareas genéricas si no dependen de una licitación.",
      "Los scrapers o importadores van fuera del UI principal.",
    ],
    checklist: [
      "Modelo claro de estado.",
      "Fechas críticas visibles.",
      "Acciones rápidas sin abrir modales pesados.",
    ],
  },
  {
    id: "tareas",
    label: "Tareas",
    href: "/tareas",
    description: "Gestión operativa de pendientes por área, foco y prioridad.",
    summary:
      "Este módulo debe quedarse simple: capturar, ordenar y cerrar tareas. Si una tarea pertenece de verdad a otra sección, la referencia vive aquí, pero el detalle sigue en su módulo dueño.",
    status: "para modelar",
    contextFile: "src/modules/tareas/CONTEXT.md",
    nextSlice: [
      "Backlog simple por prioridad.",
      "Vista de hoy y esta semana.",
      "Vinculación opcional a proyecto o licitación.",
    ],
    dataModel: ["tasks", "task_labels", "task_links"],
    boundaries: [
      "No duplicar proyectos completos.",
      "No guardar notas largas tipo bitácora.",
      "Evitar automatizaciones antes de estabilizar el flujo manual.",
    ],
    checklist: [
      "Crear tarea en un paso.",
      "Cambiar estado sin fricción.",
      "Filtros por prioridad, área y fecha.",
    ],
  },
  {
    id: "salud",
    label: "Salud",
    href: "/salud",
    description: "Métricas físicas, rutina y seguimiento de hábitos clave.",
    summary:
      "Salud merece su propio contexto porque mezcla datos numéricos, progreso temporal y registros manuales. Separarlo evita que el dashboard entero cargue datasets o lógica innecesaria.",
    status: "para modelar",
    contextFile: "src/modules/salud/CONTEXT.md",
    nextSlice: [
      "Registro de métricas por fecha.",
      "Resumen semanal con tendencia.",
      "Rutina base sin OCR ni importadores todavía.",
    ],
    dataModel: ["health_metrics", "workout_sessions", "habit_logs"],
    boundaries: [
      "No volver a meter parsers OCR en el frontend.",
      "Los scripts de importación viven fuera de la app principal.",
      "No mostrar 20 gráficos antes de tener datos limpios.",
    ],
    checklist: [
      "Métricas mínimas útiles.",
      "Vista histórica comprensible.",
      "Separación entre registros manuales e importados.",
    ],
  },
  {
    id: "proyectos",
    label: "Proyectos",
    href: "/proyectos",
    description: "Seguimiento de proyectos, hitos, riesgos y próximos pasos.",
    summary:
      "Proyectos es el espacio para roadmap y avance. Sirve para agrupar iniciativas sin convertir la app en un cajón de sastre. Cada proyecto puede enlazar otras áreas sin absorberlas.",
    status: "para modelar",
    contextFile: "src/modules/proyectos/CONTEXT.md",
    nextSlice: [
      "Listado de proyectos activos.",
      "Hitos y estado general.",
      "Relación con tareas y notas cortas.",
    ],
    dataModel: ["projects", "project_milestones", "project_updates"],
    boundaries: [
      "No usar esta sección como archivo general de ideas.",
      "No duplicar estados de tareas uno a uno.",
      "La documentación extensa sigue fuera de la UI.",
    ],
    checklist: [
      "Estado visible por proyecto.",
      "Próximo paso claro.",
      "Fechas y responsables cuando hagan falta.",
    ],
  },
  {
    id: "muebles",
    label: "Muebles",
    href: "/muebles",
    description: "Diseños, compras, materiales y seguimiento de fabricación.",
    summary:
      "Antes estaba mezclado con datos sueltos y listas largas. Aquí lo vamos a tratar como un dominio concreto: modelos, materiales, costos y decisiones de compra, nada más.",
    status: "para modelar",
    contextFile: "src/modules/muebles/CONTEXT.md",
    nextSlice: [
      "Catálogo de ideas o modelos.",
      "Materiales y costos base.",
      "Checklist simple de compra y fabricación.",
    ],
    dataModel: [
      "furniture_projects",
      "furniture_materials",
      "furniture_purchases",
    ],
    boundaries: [
      "No meter archivos pesados de referencia dentro del repo UI.",
      "Los cálculos grandes o comparativas pueden ir a scripts separados.",
      "Evitar copiar tablas eternas del proyecto viejo.",
    ],
    checklist: [
      "Modelo o pieza.",
      "Material estimado.",
      "Costo y estado de avance.",
    ],
  },
  {
    id: "banco",
    label: "Banco",
    href: "/banco",
    description: "Cuentas, movimientos y una vista clara del flujo financiero.",
    summary:
      "Banco debe enfocarse en consolidación financiera y movimientos. Nada de mezclar esta sección con contador o tareas salvo por referencias puntuales.",
    status: "para modelar",
    contextFile: "src/modules/banco/CONTEXT.md",
    nextSlice: [
      "Resumen de cuentas.",
      "Movimientos recientes.",
      "Filtro por período y categoría.",
    ],
    dataModel: ["bank_accounts", "bank_transactions", "bank_categories"],
    boundaries: [
      "No guardar documentos tributarios aquí.",
      "No convertirlo en planilla infinita.",
      "La conciliación avanzada puede esperar a una segunda etapa.",
    ],
    checklist: [
      "Saldo por cuenta.",
      "Ingresos y egresos claros.",
      "Clasificación mínima consistente.",
    ],
  },
  {
    id: "contador",
    label: "Contador",
    href: "/contador",
    description: "Documentos, vencimientos y coordinación contable.",
    summary:
      "Este módulo existe para centralizar lo tributario y administrativo. Así evitamos contaminar otras vistas con cosas que tienen otra frecuencia, otro lenguaje y otras reglas.",
    status: "para modelar",
    contextFile: "src/modules/contador/CONTEXT.md",
    nextSlice: [
      "Documentos pendientes.",
      "Vencimientos relevantes.",
      "Checklist de cierre mensual.",
    ],
    dataModel: ["tax_documents", "tax_deadlines", "accounting_notes"],
    boundaries: [
      "No usarlo como chat o agente gigante desde el día uno.",
      "No mezclar movimientos bancarios detallados aquí.",
      "La automatización documental puede venir después.",
    ],
    checklist: [
      "Qué hay que entregar.",
      "Para cuándo.",
      "Qué falta resolver.",
    ],
  },
];

export function getSectionById(id: AppSectionId) {
  const section = APP_SECTIONS.find((item) => item.id === id);
  if (!section) {
    throw new Error(`Unknown section: ${id}`);
  }

  return section;
}
