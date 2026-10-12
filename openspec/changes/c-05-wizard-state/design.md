# Design

## Context

- **Insumo**: catálogo de C-03 (`src/data/configurador.js`: 7 `services` + 8 `extras`, con `recommended` y `recurring`).
- **Contrato de estado**: `QuoteConfig` de `knowledge-base/04_modelo_de_datos.md` (`step`, `serviceId`, `extras[]`, `quantity`, `form`, `submitted`, `status`).
- **Flujo**: `knowledge-base/07_flujos_principales.md` (Flujo 1) fija el orden de los 4 pasos y la inicialización.
- **Reglas**: `RN-PR-06` (cambiar servicio no limpia extras), `RN-QT-01/02` (cantidad entera ≥ 1, solo multiplica al servicio), `RN-VL-01/02/04` (nombre y email obligatorios, resto opcional, errores inline), `RN-EX-03` (retroceder sin perder estado).
- **Restricciones**: JavaScript puro (sin TS); el proyecto **no** tiene testing-library ni jsdom, así que el estado debe poder testearse sin React ni DOM.
- **C-04** existe pero **no** se usa acá: el total lo calcula el consumidor con `computeTotal` (C-06).

## Goals / Non-Goals

**Goals**: una máquina de estados pura, completa y testeable del wizard (pasos, selección, cantidad, formulario, validación, inicio de envío) + un hook React fino que la conecte al catálogo.

**Non-Goals**: cálculo de totales (C-04); UI, cards, layout y resumen (C-06..C-08); generación de PDF (C-09); armado del payload y POST al webhook (C-10).

## Decisions

- **D1 — Núcleo puro + hook fino.** La lógica vive en `src/utils/wizard.js` (funciones puras, sin React) y `src/hooks/useConfigurador.js` es un wrapper con `useState`. Permite testear las reglas con `node:test` sin testing-library ni jsdom (no están instalados) y sin sumar dependencias. El hook queda trivial.
- **D2 — Forma del estado.** `{ step, serviceId, extras, quantity, form, errors, submitted, status }` según `QuoteConfig`, más `errors` (`{ name?, email? }`) para cumplir RN-VL-04.
- **D3 — Inicialización inyectable.** `createInitialState(services, extras)` no importa el catálogo: recibe listas y devuelve el estado inicial, de modo que los tests usan fixtures. El hook inyecta el catálogo real (`catalogServices`, `catalogExtras`).
- **D4 — Preselección.** Primer servicio (`services[0].id`) y extras con `recommended: true` (hoy solo `hosting`) preseleccionados; cantidad 1. **Conflicto resuelto**: `07_flujos_principales.md` (Flujo 1, paso 2) dice `extras = []`, pero el roadmap C-05 pide extras `recommended` y el dueño definió `recommended` = marcados al abrir. Gana el roadmap; se corrige la KB.
- **D5 — Pasos `0..3`.** `0` servicio, `1` extras y cantidad, `2` datos de contacto, `3` resumen. `nextStep` valida **solo** al salir del paso `2` (paso 3 → 4, RN-VL-01); en `0` y `1` avanza sin validar; en `3` es no-op.
- **D6 — Cantidad.** `setQuantity` normaliza a entero ≥ 1 (`Math.floor`; no numérico o < 1 → 1). RN-QT-01.
- **D7 — Validación.** Nombre: no vacío (con `trim`). Email: `/^[^\s@]+@[^\s@]+\.[^\s@]+$/`. Mensajes en es-AR. Teléfono y descripción opcionales (RN-VL-02).
- **D8 — Cambiar de servicio no toca los extras** (RN-PR-06): `setService` solo cambia `serviceId`.
- **D9 — Envío sin red.** `submit` valida y, si es válido, marca `submitted: true` y `status: 'submitting'`; si no, deja `submitted: false` y expone `errors`. `setStatus(status)` deja que la capa de transporte (C-10) resuelva `success`/`error`.
- **D10 — Tests.** `scripts/wizard.test.mjs` con `node:test`; el glob del script `test` (C-04) ya lo levanta sin cambios en `package.json`.

## Risks / Trade-offs

- **KB desactualizada**: si no se corrige `07_flujos_principales.md`, queda contradictoria con el comportamiento → se corrige en esta tarea.
- **Validación de email por regex**: no es exhaustiva, pero alcanza el "formato válido" de RN-VL-01.
- **Hook sin test directo**: el wrapper React queda fuera de los tests; la lógica testeada es el núcleo puro (D1).

## Migration Plan

No aplica: no hay datos ni consumidores previos que migrar.

## Open Questions

Ninguna para implementar. Los bloqueantes de precios y webhook (P-01/P-02/P-03) siguen fuera de este change.
