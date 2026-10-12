# Proposal

## Why

El configurador ya tiene el catálogo (C-03) pero todavía no sabe calcular cuánto cuesta la combinación elegida. Sin un motor de cálculo aislado y testeable, el total en vivo del resumen, el payload del webhook y el PDF reimplementarían la misma aritmética —y sus casos borde (cotizable, sin costo, mensual)— en cada lugar.

## What Changes

- Nuevo módulo `src/utils/pricing.js` con las funciones puras del cálculo:
  - `computeTotal(service, quantity, extras)` → desglose del presupuesto.
  - `splitRecurring(extras)` → separa extras de pago único de los mensuales.
  - `hasQuotable(service, extras)` → indica si hay un ítem "a cotizar".
  - `formatARS(value)` → formatea un importe en ARS (`es-AR`).
- Reglas codificadas: `priceARS: null` no suma y marca cotizable; `priceARS: 0` no altera el total; la cantidad multiplica **solo** al servicio; los extras `recurring` se exponen como importe "/mes" y no inflan el total de pago único.
- Tests unitarios con el runner integrado de Node (`node --test`), sin agregar dependencias.

## Capabilities

### New Capabilities
- `calculo-de-presupuesto`: la aritmética del presupuesto del configurador — total de pago único, desglose de extras, separación de la recurrencia mensual, marca de cotizable y formateo de importes en ARS.

### Modified Capabilities
<!-- Ninguna: no hay capacidades existentes cuyos requisitos cambien. -->

## Impact

- **Código**: nuevo `src/utils/pricing.js` (la carpeta `src/utils/` ya existe desde C-01) + `scripts/pricing.test.mjs`.
- **`package.json`**: nuevo script `test` (`node --test`), incorporado a `ci`.
- **Consumidores futuros**: C-05 (`wizard-state`), C-06/C-07 (UI del resumen y tarjetas), C-09 (PDF), C-10 (payload del webhook).
- **Dependencias**: ninguna nueva (runner de tests nativo de Node).
