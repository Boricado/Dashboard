# Contexto: Banco

## Proposito
Control de caja y banco de la empresa, con foco en saldo disponible, gastos e ingresos reales.

## Alcance MVP
- Saldo inicial visible
- Resumen de gastos e ingresos
- Saldo disponible actualizado
- Formulario simple para registrar movimientos
- Tabla de movimientos reales con documento, proveedor y montos

## Datos iniciales
- `bank_accounts`
- `bank_transactions`

## Seed actual
- Cuenta: `Caja · Banco`
- Empresa: `Aguirre Ingenieria SpA`
- Capital inicial: `$1.000.000`
- Dos facturas iniciales de `Easy Retail S.A.` importadas desde CSV

## Limites
- No mezclar conciliacion bancaria avanzada todavia
- No convertir la vista en contabilidad completa
- Impuestos y documentos tributarios avanzados pueden crecer despues
