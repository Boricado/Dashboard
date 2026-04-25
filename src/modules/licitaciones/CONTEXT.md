# Contexto: Licitaciones

## Proposito
Seguimiento de oportunidades de Mercado Publico para la IV Region, con una capa separada entre datos sincronizados por cron y seguimiento manual del usuario.

## Alcance MVP
- Tabla `licitaciones` sincronizada por Edge Function
- Tabla `licitacion_tracking` para notas, prioridad y proximo paso por usuario
- Vista operativa para filtrar, revisar y decidir rapido
- Base de cron y sync documentada dentro de `supabase/functions/`

## Datos iniciales
- `licitaciones`
- `licitacion_tracking`

## Limites
- No mezclar tareas generales que no dependan de una licitacion
- El cron y la sincronizacion viven fuera del UI
- No meter banco, salud o contador dentro del modelo
- La API de Mercado Publico puede cambiar; conservar el payload crudo en `source_payload`
