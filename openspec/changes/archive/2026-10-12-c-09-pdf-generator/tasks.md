# Tasks

## 1. Modelo de secciones (`src/utils/pdfDocument.js`)

- [ ] 1.1 `buildPdfSections(payload)` → secciones con filas `{ label, value }`: encabezado (emisor, fecha es-AR, fuente), servicio (nombre, `× cantidad` si > 1, importe), extras pago único, extras recurrentes con `/mes`, totales (`total`, subtotal si difiere, `+ X/mes`, `hasQuotable`) y contacto.
- [ ] 1.2 Reutilizar `extraPriceLabel` / `formatARS` / `QUOTABLE_LABEL`; el importe del servicio es `priceARS × quantity`, y "A cotizar" deriva de `payload.hasQuotable` (D4).
- [ ] 1.3 Marcar `hasHosting` (para el disclaimer) y No romper con campos opcionales ausentes (contacto vacío, etc.).

## 2. Documento (`buildPdfDocument`)

- [ ] 2.1 Construir el documento con `createElement` (sin JSX) y estilos propios (fondos claros, acentos del portfolio).
- [ ] 2.2 Renderizar: encabezado, bloques de servicio/extras/totales/contacto, aviso de cotizable, disclaimer de hosting (`HOSTING_DISCLAIMER` si `hasHosting`) y nota "estimación no vinculante".

## 3. Generador (`src/utils/pdfGenerator.js`)

- [ ] 3.1 `buildPdfBlob(payload)`: import dinámico de `@react-pdf/renderer` y `./pdfDocument.js`; devuelve el buffer de `renderToBuffer`.
- [ ] 3.2 `bufferToBase64(buffer)`: conversión a base64 por chunks.
- [ ] 3.3 `tryBuildPdfBlob(payload)`: best-effort, `null` ante cualquier fallo (RN-PD-03).

## 4. Tests (`scripts/pdf-generator.test.mjs`)

- [ ] 4.1 Secciones con payload de ejemplo (catálogo real): cantidad solo si > 1, extras `/mes` separados, `Sin costo` en hosting, disclaimer presente solo con hosting, contacto recortado/omitido.
- [ ] 4.2 `hasQuotable` → rótulo "A cotizar" en el servicio y aviso en totales.
- [ ] 4.3 `subtotal !== total` → aparece la fila de subtotal; iguales → no.
- [ ] 4.4 Integración: `buildPdfBlob` devuelve un buffer no vacío con cabecera `%PDF-`.
- [ ] 4.5 `bufferToBase64` decodifica al mismo contenido; `tryBuildPdfBlob` devuelve `null` con payload inválido.

## 5. Verificación

- [ ] 5.1 `npm run test` verde y comprobar que un test puede fallar (rojo).
- [ ] 5.2 `npm run ci` verde.
- [ ] 5.3 Probe del chunk: wiring temporal de `pdfGenerator` → `vite build` → confirmar chunk separado de react-pdf → revertir el wiring y verificar que dist no incluya código de la librería.