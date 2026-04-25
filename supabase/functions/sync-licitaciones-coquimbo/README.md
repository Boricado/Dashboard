# sync-licitaciones-coquimbo

Edge Function para sincronizar licitaciones de Mercado Publico hacia `public.licitaciones`.

## Enfoque
- Lee licitaciones publicadas por fecha usando la API oficial de Mercado Publico.
- Filtra localmente:
  - Region Coquimbo
  - Moneda CLP
  - Monto estimado menor o igual a `10.000.000`
  - Fecha de cierre aun vigente
- Hace `upsert` por `codigo_licitacion`.
- Marca como `cerrada` las filas cuyo cierre ya paso.

## Secrets esperados
- `MERCADO_PUBLICO_TICKET`
- `MP_BASE_URL` (opcional)
- `CODIGO_ORGANISMO` (opcional)
- `SYNC_MAX_AMOUNT_CLP` (opcional)
- `SYNC_WINDOW_DAYS` (opcional)

Supabase inyecta:
- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`

## Deploy sugerido
```bash
supabase functions deploy sync-licitaciones-coquimbo --no-verify-jwt
```

## Nota importante
La API oficial de Mercado Publico permite:
- consultar licitaciones activas sin fecha
- consultar por fecha y por `CodigoOrganismo`

Por eso la funcion usa dos modos:
- si solo hay ticket, consulta `estado=activas`
- si tambien existe `CODIGO_ORGANISMO`, recorre una ventana de dias y agrega ese parametro

El filtro por region y monto se aplica en la Edge Function despues del fetch, no en el query original.
