# Proposal

## Why

El visitante confirma su configuración en el paso 4, pero todavía no hay nada que guardar o compartir: sin PDF el presupuesto muere en la pantalla. El PDF se genera **en el cliente** a partir del `LeadPayload` y viaja adjunto en el envío al webhook (Flujo 3 => C-10).

## What Changes

- Nuevo `src/utils/pdfDocument.js`: `buildPdfDocument(payload)` (documento `@react-pdf/renderer`) y `buildPdfSections(payload)` (modelo puro de secciones: servicio, extras pago único vs `/mes`, totales, contacto). Escrito **sin JSX** (`createElement`) para que sea importable por `node:test`.
- Nuevo `src/utils/pdfGenerator.js`: `buildPdfBlob(payload)` con **import dinámico** de `@react-pdf/renderer` y del documento (no engorda el bundle inicial), `bufferToBase64(buffer)` para adjuntar, y `tryBuildPdfBlob(payload)` **best-effort** que devuelve `null` si la generación falla (RN-PD-03).
- Tests (`scripts/pdf-generator.test.mjs`): secciones puras sobre un payload de ejemplo y contra el catálogo real, más una prueba de integración que renderiza un blob cuya cabecera empieza con `%PDF-`.

## Capabilities

### New Capabilities
- `pdf-del-presupuesto`: generación del PDF del presupuesto en el cliente, con carga diferida y tolerancia a fallos.

### Modified Capabilities
<!-- Ninguna. -->

## Impact

- **Código**: nuevos `src/utils/pdfDocument.js` y `src/utils/pdfGenerator.js`. Ningún componente se toca; nadie consume el generador todavía (el cableado al envío es de **C-10**).
- **Tests**: nuevo `scripts/pdf-generator.test.mjs` (secciones puras + integración del render en Node, ya verificado: `@react-pdf/renderer` 4.9.0 rinde `%PDF-` sin DOM).
- **Dependencias**: ninguna nueva (`@react-pdf/renderer` y `react` ya están instalados).
- **Riesgo mitigado**: el import dinámico garantiza que la librería (pesada) no entre en el chunk inicial del configurador.
- **Consumidor futuro**: C-10 (`webhook.js`) usa `tryBuildPdfBlob` y marca `pdf: false` si el PDF falla.