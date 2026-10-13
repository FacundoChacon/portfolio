# Design

## Context

- **Insumos**: `LeadPayload` (KB 04 §LeadPayload), reglas RN-PD (KB 05 §RN-PD), Flujo 3 (KB 07), `priceLabels.js` / `pricing.js` (C-04/C-07), `HOSTING_DISCLAIMER` (C-03).
- **Verificación previa**: `@react-pdf/renderer` **4.9.0** renderiza en Node sin DOM (`renderToBuffer` devolvió `%PDF-`) → el test de "blob no vacío" del roadmap es implementable con `node:test`.
- **Restricciones**: `node --test` no transforma JSX → el módulo del documento debe ser importable por Node; el import de `@react-pdf/renderer` debe ser **dinámico** para no engordar el chunk inicial.
- **Payload**: `subtotal === total` en v1 (C-04); `hasQuotable` a nivel de payload (RN-CO-02); los extras llevan `recurring`.

## Goals / Non-Goals

**Goals**: un módulo puro de secciones (testeable), un documento renderizable y el generador con carga diferida y best-effort listos para que C-10 los consuma.

**Non-Goals**: armar el `LeadPayload` (C-10), el POST al webhook (C-10), el botón "Descargar PDF" en la pantalla de éxito (C-10), el bloqueo de envío.

## Decisions

- **D1 — `pdfDocument.js` sin JSX.** Se usa `createElement` (React + componentes de `@react-pdf/renderer`) para que el módulo sea un `.js` plano que `node:test` puede importar. El JSX no lo transforma Node, así que un `.jsx` no sería testeable.
- **D2 — Import dinámico en `pdfGenerator.js`.** `buildPdfBlob` hace `await import('@react-pdf/renderer')` y `await import('./pdfDocument.js')` **dentro de la función**. Vite separa esos imports en un chunk propio; el documento y la librería (pesados) nunca entran al bundle inicial del configurador. `pdfGenerator.js` queda ligero.
- **D3 — Modelo de secciones puro.** `buildPdfSections(payload)` deriva las filas `{label, value}` del documento (servicio, extras pago único, extras `/mes`, totales, contacto) reutilizando `extraPriceLabel` / `formatARS` / `QUOTABLE_LABEL`. Es lo que se testea; `buildPdfDocument` es fino.
- **D4 — Cuotizable a nivel de payload.** El rótulo "A cotizar" del servicio se deriva de `payload.hasQuotable` (RN-CO-02), no de un flag por servicio: el `LeadPayload` de KB 04 no lleva `quotable`.
- **D5 — Best-effort (RN-PD-03).** `tryBuildPdfBlob(payload)` envuelve todo en `try/catch` y devuelve `null` ante cualquier fallo (incluido un payload inválido). C-10 lo usará y marcará `pdf: false`.
- **D6 — Disclaimer de hosting desde el catálogo.** Si `payload.extras` incluye `id: 'hosting'`, el documento muestra `HOSTING_DISCLAIMER` importado de `data/configurador.js` (única fuente, RN-HD-02/03).
- **D7 — Subtotal solo si difiere del total.** En v1 son iguales (C-04); el documento muestra la fila de subtotal únicamente cuando difieren, evitando filas redundantes. El total de pago único y el `+ X/mes` siempre se muestran.
- **D8 — Creación del documento estricta pero capturada.** `buildPdfSections` accede a `payload.submittedAt` sin defensa: un payload inválido revienta ahí dentro; es intencional (lo captura `tryBuildPdfBlob` y permite testear el camino best-effort). Los campos opcionales sí son defensivos.

## Risks / Trade-offs

- **`createElement` verboso** (D1): el documento se arma con helpers locales (`P`, `V`, `row`) para mantenerlo legible; costo aceptado a cambio de testeabilidad en Node.
- **Nadie consume el generador aún**: el chunk separado recién se ve en el build cuando C-10 lo importe; se valida en C-09 con un cableado temporal (probe) que se revierte.
- **Test de integración depende del render en Node**: ya verificado con 4.9.0 (`%PDF-`); si una futura versión lo rompiera, el test lo detecta.
- **`@react-pdf/renderer` pesado en su propio chunk**: es el costo de generar en el cliente, mitigado por la carga diferida (D2).

## Migration Plan

No aplica: módulo nuevo sin wiring. El cableado (payload + POST + pantallas) lo hace C-10.

## Open Questions

Ninguna para implementar. P-01/P-02/P-03/P-07 siguen siendo bloqueantes de deploy, no de desarrollo.