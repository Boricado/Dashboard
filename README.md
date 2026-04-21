# Fidel Dashboard

Dashboard personal reconstruido desde cero en Next.js + TypeScript.

## Objetivo

- Separar cada area en un modulo chico y entendible.
- Evitar archivos gigantes que consuman mucho contexto al trabajar con IA.
- Mantener una base limpia para conectar Supabase despues, modulo por modulo.

## Estructura

```text
src/
  app/
  components/
  lib/
  modules/
    salud/
      CONTEXT.md
```

## Desarrollo

```bash
npm install
npm run dev
```

## Variables de entorno

Revisa `.env.example` y crea `.env.local`.
