# Contexto: Calibracion

## Proposito
Evaluar la viabilidad de un laboratorio de calibracion en la Region de Coquimbo, separando mercado, inversion, precios, normativa y competencia del resto del dashboard.

La estrategia vigente se divide en fases:
- Fase 0: certificados, registros y acreditaciones necesarios para avanzar por alcance.
- Fase 1: calibracion/verificacion de instrumentos topograficos y ruta a acreditacion INN geodimensional.
- Fase 2: balanzas, basculas y masas patron.
- Fase 3: todo lo demas de calibracion, como temperatura, humedad, presion, dimensional general, volumen y electrica basica.

## MVP actual
- Resumen ejecutivo del estudio de mercado.
- KPIs de oportunidad, inversion, plazo e ingresos potenciales por fase.
- Fases de implementacion con prioridad topografica.
- Exigencias chilenas, resoluciones y normas aplicables.
- Precios de referencia por categoria de instrumento.
- Competencia nacional y sectores demandantes.

## Fuente actual
- Datos curados desde `fidel-dashboard-calibracion-2026-05-21`.
- Archivos JSON locales en `src/modules/calibracion/data/`.
- Revision normativa y de mercado fechada el 2026-05-21.
- Fuentes verificadas: INN, LeyChile, ChileAtiende/SAG, Mercado Publico, ISO e IGM/SIRGAS-Chile.

## Datos futuros
- Cotizaciones reales actualizadas.
- Contactos y leads por sector.
- Simulador de escenarios financieros.
- Captura periodica de licitaciones topograficas y de calibracion de balanzas.
- Confirmacion de alcances vigentes en directorio INN antes de comparar competidores.

## Limites
- No mezclar esta vista con licitaciones operativas ni tareas generales.
- No tratar precios de referencia como cotizaciones vigentes sin verificacion.
- No agregar automatizaciones comerciales antes de validar el flujo manual.
- No declarar acreditacion INN ni certificado acreditado hasta que el alcance este concedido y publicado.
- No usar la ruta SAG/Ley 20.656 para topografia; aplica a Fase 2 cuando exista servicio para transacciones agropecuarias reguladas.
