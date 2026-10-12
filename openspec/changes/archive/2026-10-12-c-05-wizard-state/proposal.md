# Proposal

## Why

El catálogo (C-03) y el cálculo (C-04) ya existen, pero nadie recorre el wizard: no hay estado de pasos, selección de extras, cantidad ni datos de contacto, y sin eso la UI (C-06..C-08), el PDF (C-09) y el payload (C-10) no tienen qué mostrar ni qué enviar. Además, la lógica de pasos y validación debe ser testeable sin navegador.

## What Changes

- Nuevo núcleo puro `src/utils/wizard.js` con la máquina de estados del wizard: `createInitialState`, `validateForm`, `setService`, `toggleExtra`, `setQuantity`, `setForm`, `nextStep`, `prevStep`, `submit`, `setStatus`, más los selectores `getService` / `getSelectedExtras`.
- Nuevo hook fino `src/hooks/useConfigurador.js` que envuelve el núcleo con `useState` e inyecta el catálogo real (`services`, `extras`).
- Estado inicial: primer tipo de sitio seleccionado, extras `recommended` preseleccionados, cantidad 1, paso 1, formulario vacío, `status: 'idle'`.
- Reglas: exactamente un servicio seleccionado; cambiar de servicio **no** limpia los extras (RN-PR-06); la cantidad es un entero ≥ 1 (RN-QT-01/02); no se avanza del paso de datos al resumen sin nombre y email válidos (RN-VL-01), con errores inline (RN-VL-04).
- Tests unitarios del núcleo con `node:test` (sin dependencias nuevas).
- Corrección de la KB: `07_flujos_principales.md` (Flujo 1, paso 2) decía `extras = []`; se alinea con la preselección de extras `recommended`.

## Capabilities

### New Capabilities
- `estado-del-configurador`: el estado del wizard de presupuesto — pasos, servicio y extras seleccionados, cantidad, datos de contacto, validación y ciclo de envío.

### Modified Capabilities
<!-- Ninguna: no hay capacidades existentes cuyos requisitos cambien. -->

## Impact

- **Código**: nuevos `src/utils/wizard.js` (pure, testeable en Node) y `src/hooks/useConfigurador.js` (wrapper React). `src/hooks/` ya existe (`useReveal.js`).
- **Tests**: nuevo `scripts/wizard.test.mjs`; el script `test` (`node --test "scripts/**/*.test.mjs"`) ya existe desde C-04, así que el archivo entra solo.
- **Documentación**: `knowledge-base/07_flujos_principales.md` (preselección de extras).
- **Consumidores futuros**: C-06/C-07/C-08 (UI del wizard), C-09 (PDF), C-10 (payload y envío).
- **Dependencias**: ninguna nueva.
