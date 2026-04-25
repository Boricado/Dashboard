export type ContadorDoc = {
  id: string;
  title: string;
  description: string;
  href: string;
  kind: "societario" | "tributario";
};

export type ContadorTask = {
  id: string;
  title: string;
  note: string;
  status: "done" | "pending" | "attention";
  label: string;
};

export type ContadorAnnual = {
  id: string;
  title: string;
  note: string;
  monthLabel: string;
  kind: "fiscal" | "municipal" | "conditional";
};

export type ContadorCalendarItem = {
  id: string;
  periodLabel: string;
  dueLabel: string;
  dueDate: string;
  status: "done" | "upcoming" | "attention" | "future";
  summary: string;
};

export const contadorProfile = {
  companyName: "Aguirre Ingenieria SpA",
  logoHref: "/empresa/contador/branding/logo-empresa.png",
  startedAt: "2026-03-30",
  capital: 1_000_000,
  taxStatus: "Inicio de actividades vigente",
  vatMode: "Afecto IVA (19%)",
  ppm: "PPM segun ventas netas declaradas",
};

const monthNames = [
  "Enero",
  "Febrero",
  "Marzo",
  "Abril",
  "Mayo",
  "Junio",
  "Julio",
  "Agosto",
  "Septiembre",
  "Octubre",
  "Noviembre",
  "Diciembre",
] as const;

function formatDate(date: Date) {
  return date.toISOString().slice(0, 10);
}

function formatLabel(date: Date) {
  return `${date.getDate()} ${monthNames[date.getMonth()].slice(0, 3)} ${date.getFullYear()}`;
}

function createDueStatus(dueDate: Date, done = false): ContadorCalendarItem["status"] {
  if (done) {
    return "done";
  }

  const now = new Date();
  const diffDays = (dueDate.getTime() - now.getTime()) / 86_400_000;

  if (diffDays < 0) {
    return "attention";
  }

  if (diffDays <= 15) {
    return "upcoming";
  }

  return "future";
}

export function buildMonthlyTaxCalendar() {
  const startPeriod = new Date("2026-03-01T12:00:00");
  const items: ContadorCalendarItem[] = [];

  for (let index = 0; index < 12; index += 1) {
    const periodDate = new Date(startPeriod.getFullYear(), startPeriod.getMonth() + index, 1);
    const dueGeneral = new Date(periodDate.getFullYear(), periodDate.getMonth() + 1, 20, 12);
    const dueNoMovement = new Date(periodDate.getFullYear(), periodDate.getMonth() + 1, 28, 12);
    const done = index === 0;

    items.push({
      id: `f29-${periodDate.getFullYear()}-${periodDate.getMonth() + 1}`,
      periodLabel: `${monthNames[periodDate.getMonth()]} ${periodDate.getFullYear()}`,
      dueLabel: `20 ${monthNames[dueGeneral.getMonth()].slice(0, 3)} ${dueGeneral.getFullYear()}`,
      dueDate: formatDate(dueGeneral),
      status: createDueStatus(dueGeneral, done),
      summary: done
        ? "Periodo inicial ya marcado como presentado."
        : `F29 general: ${formatLabel(dueGeneral)}. Sin movimiento y sin pago: ${formatLabel(dueNoMovement)}.`,
    });
  }

  return items;
}

export const contadorStartupTasks: ContadorTask[] = [
  {
    id: "startup-1",
    title: "Inicio de actividades en SII",
    note: "Figura como ya realizado al 30 Mar 2026.",
    status: "done",
    label: "Completado",
  },
  {
    id: "startup-2",
    title: "Autorizar DTE o revisar habilitacion de emision",
    note: "Necesario si vas a emitir facturas o boletas electronicas desde la empresa.",
    status: "pending",
    label: "Pendiente",
  },
  {
    id: "startup-3",
    title: "Patente municipal y permisos de operacion",
    note: "Depende de comuna, direccion comercial y actividad efectiva.",
    status: "attention",
    label: "Revisar",
  },
  {
    id: "startup-4",
    title: "Verificar libro o registro de compras y ventas",
    note: "El SII indica que el RCV respalda operaciones afectas, exentas y no afectas a IVA.",
    status: "pending",
    label: "Mensual",
  },
];

export const contadorAnnualObligations: ContadorAnnual[] = [
  {
    id: "annual-1",
    title: "F22 Declaracion de Renta del anio comercial 2026",
    note: "El SII indica que se presenta entre el 1 y el 30 de abril de cada anio.",
    monthLabel: "Abril 2027",
    kind: "fiscal",
  },
  {
    id: "annual-2",
    title: "DJ de honorarios, si corresponde",
    note: "Aplica solo si la empresa paga honorarios o cae en ese regimen informativo.",
    monthLabel: "Marzo 2027",
    kind: "conditional",
  },
  {
    id: "annual-3",
    title: "Renovacion o pago de patente municipal",
    note: "Municipalidad y giro pueden cambiar monto, frecuencia y requisitos.",
    monthLabel: "Segun comuna",
    kind: "municipal",
  },
  {
    id: "annual-4",
    title: "Cierre contable del primer ejercicio",
    note: "Ordenar respaldo documental y preparar la renta anual con el contador.",
    monthLabel: "Dic 2026 / Ene 2027",
    kind: "fiscal",
  },
];

export const contadorDocuments: ContadorDoc[] = [
  {
    id: "doc-estatutos",
    title: "Estatutos",
    description: "Documento de constitucion y reglas base de la sociedad.",
    href: "/empresa/contador/documentos/Estatutos.pdf",
    kind: "societario",
  },
  {
    id: "doc-giro",
    title: "Giro Empresa",
    description: "Respaldo del giro declarado para la empresa.",
    href: "/empresa/contador/documentos/Giro%20Empresa.pdf",
    kind: "tributario",
  },
  {
    id: "doc-vigencia",
    title: "Vigencia",
    description: "Certificado de vigencia societaria.",
    href: "/empresa/contador/documentos/Vigencia.pdf",
    kind: "societario",
  },
  {
    id: "doc-anotaciones",
    title: "Anotaciones",
    description: "Anotaciones societarias y respaldo registral.",
    href: "/empresa/contador/documentos/Anotaciones.pdf",
    kind: "societario",
  },
  {
    id: "doc-erut",
    title: "e-RUT",
    description: "Documento tributario base para tramites operativos.",
    href: "/empresa/contador/documentos/e-rut.pdf",
    kind: "tributario",
  },
  {
    id: "doc-escrito",
    title: "Escrito",
    description: "Documento adicional de formacion y respaldo.",
    href: "/empresa/contador/documentos/escrito.pdf",
    kind: "societario",
  },
];

export const contadorOfficialLinks = [
  {
    label: "SII: Declaracion F29 y plazos",
    href: "https://www.sii.cl/ayudas/nuevos_contribuyentes/boleta-vys-facturador.html",
  },
  {
    label: "SII: Registro de Compras y Ventas",
    href: "https://www.sii.cl/destacados/f29/registrocompraventas.htm",
  },
  {
    label: "SII Educa: Formalizacion y patente municipal",
    href: "https://www.sii.cl/siieduca/aprende-con-nosotros/inicio-de-actividades-y-formalizacion-de-un-negocio.html",
  },
  {
    label: "SII: Inicio de actividades en RES",
    href: "https://www.sii.cl/registro_contribuyentes/inicio_actividades_res.htm",
  },
];
