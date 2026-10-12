# Tasks

## 1. Módulo de cálculo

- [x] 1.1 Crear `src/utils/pricing.js` con `computeTotal`, `splitRecurring`, `hasQuotable` y `formatARS`, documentadas con JSDoc.
- [x] 1.2 Implementar el desglose de `computeTotal` (`currency`, `serviceTotal`, `extrasOneTimeTotal`, `subtotal`, `total`, `recurringMonthly`, `hasQuotable`).
- [x] 1.3 Resolver los casos borde: `priceARS: null` (aporta 0 y marca cotizable), `priceARS: 0` (no altera) y cantidad ausente/inválida (se trata como 1).
- [x] 1.4 Implementar `splitRecurring` (partición por `recurring`) y reutilizarlo dentro de `computeTotal`.
- [x] 1.5 Importar `CURRENCY` desde `src/data/configurador.js` en lugar de repetir el literal `'ARS'`.

## 2. Formateo

- [x] 2.1 Implementar `formatARS` con `Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' })` y devolver cadena vacía para valores no finitos.

## 3. Tests

- [x] 3.1 Crear `scripts/pricing.test.mjs` con `node:test` + `node:assert/strict`, cubriendo: total con cantidad > 1, total con extras, total sin extras, servicio ausente, cotizable (`null`) con y sin extras, extra de precio 0, separación de recurrentes, importe mensual, `hasQuotable` en ambos casos, `formatARS` (0 y 720000) y valor no numérico.
- [x] 3.2 Agregar el script `test` (`node --test`) a `package.json` e incorporarlo a `ci` (`lint && verify:catalog && test && build`).

## 4. Verificación

- [x] 4.1 `npm run test` verde (todos los casos pasan).
- [x] 4.2 Comprobar que un caso roto a propósito hace fallar el test (el test puede ponerse en rojo).
- [x] 4.3 `npm run ci` verde (lint + verify:catalog + test + build).
