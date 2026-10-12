# Tasks

## 1. Etiquetas de precio (`src/utils/priceLabels.js`)

- [x] 1.1 Extraer `servicePriceLabel(service)` y `extraPriceLabel(extra)` desde `summary.js` a `src/utils/priceLabels.js`, con JSDoc.
- [x] 1.2 Refactorizar `summary.js` para importarlas (sin cambio de comportamiento).

## 2. Iconos (`src/components/configurador/serviceIcons.js`)

- [x] 2.1 Mapear los iconos del catálogo a componentes de `lucide-react` importados explícitamente.
- [x] 2.2 Exportar `resolveServiceIcon(name)` con icono de reemplazo para nombres desconocidos.

## 3. Componentes

- [x] 3.1 Crear `ServiceCards.jsx`: 7 cards con icono, nombre, descripción y precio ("A cotizar" incluido); `<button>` con `aria-pressed`, estado seleccionado distinguible y grilla responsive.
- [x] 3.2 Crear `ExtrasCards.jsx`: 8 toggles con nombre, descripción y precio (`/mes` en recurrentes); disclaimer visible en "Hosting + Dominio".
- [x] 3.3 Crear `QuantityControl.jsx`: `+` / `−` con `aria-label`, `−` deshabilitado en 1 y valor anunciado.
- [x] 3.4 Estados visuales (seleccionado / hover / foco) coherentes con la estética del portfolio.

## 4. Página (`src/pages/Configurador.jsx`)

- [x] 4.1 Montar `ServiceCards` + `QuantityControl` en el paso 1 (servicio y cantidad).
- [x] 4.2 Montar `ExtrasCards` en el paso 2, dejando los pasos 3-4 como placeholder hasta C-08.
- [x] 4.3 Conectar `setService`, `toggleExtra` y `setQuantity` del hook.

## 5. Tests

- [x] 5.1 Crear `scripts/price-labels.test.mjs`: servicio cotizable → "A cotizar"; extra de precio 0 → "Sin costo"; extra recurrente → "<importe>/mes"; servicio normal → importe formateado.
- [x] 5.2 Crear `scripts/service-icons.test.mjs`: los 7 iconos del catálogo real resuelven; un nombre desconocido devuelve el reemplazo.

## 6. Verificación

- [x] 6.1 `npm run test` verde (incluidos los tests previos) y comprobar que un test puede fallar (rojo).
- [x] 6.2 `npm run ci` verde y revisar el chunk `Configurador-*.js`.
