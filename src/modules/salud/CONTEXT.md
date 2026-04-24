# Contexto: Salud

## Proposito
Registrar metricas de salud, rutinas semanales y sesiones de entrenamiento sin volver a mezclar OCR, scripts y UI en un solo archivo.

## MVP actual
- Tarjetas de estadisticas generales
- Resumen de composicion corporal
- Rutinas por semana con detalle por dia
- Historial de sesiones reales recuperadas del proyecto viejo

## Fuente actual
- Datos curados desde `fidel-dashboard`
- Sin dependencia de Supabase en esta primera pasada
- Historial parcial: sirve para operar y luego completar

## Datos futuros
- `health_metrics`
- `workout_sessions`
- `workout_exercises`

## Limites
- No reinsertar OCR ni parsers dentro del frontend
- No inflar esta vista con graficos complejos antes de limpiar datos
- Separar siempre metricas, rutinas y sesiones como piezas distintas
