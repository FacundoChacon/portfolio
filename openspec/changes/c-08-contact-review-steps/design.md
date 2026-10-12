# Design

## Context

- **Insumos**: estado de C-05 (`wizard.js`: `setForm`, `validateForm`, `submit`, `nextStep`), resumen de C-06 (`buildSummary`), etiquetas de C-07 (`priceLabels.js`), cards de C-07, layout de C-06 (`Configurador.jsx`, `SummarySidebar`).
- **Reglas**: RN-VL-01/02 (obligatorios y opcionales), RN-VL-04 (errores inline accesibles), RN-PR-07 (estimación no vinculante), RN-CO-02 (aviso de cotizable), RN-AB-01 (honeypot), RN-EX-01 (copia es-AR), RN-EX-03 (volver sin perder estado).
- **CA**: US-006 (datos de contacto), US-007 (revisión antes de enviar).
- **Restricciones**: JavaScript puro; sin testing-library ni jsdom → los `.jsx` no se testean; la lógica testeable vive en módulos puros.
- **Contrato previo que no se puede romper**: `scripts/wizard.test.mjs` hace `deepEqual` del formulario vacío (`{ name, email, phone, project }`).

## Goals / Non-Goals

**Goals**: pasos 3 y 4 operativos — capturar los datos de contacto con validación accesible y confirmar la configuración antes de enviar, con edición por bloque.

**Non-Goals**: el POST al webhook y las pantallas de éxito/error (C-10); el guard activo del honeypot y el bloqueo de doble submit (C-11); el PDF (C-09).

## Decisions

- **D1 — `buildReview` puro (`src/utils/review.js`).** Devuelve `{ blocks, summary }`: bloques con `editStep` y líneas `{ label, value }`, más el `buildSummary` ya existente. Evita que `ReviewStep` derive datos y hace testeable la revisión (US-007 CA-1/CA-2) sin jsdom. Reutiliza `extraPriceLabel` (C-07) y `buildSummary` (C-06).
- **D2 — `goToStep(state, target)` en `wizard.js`.** Única forma de saltar a un paso arbitrario, necesaria para los "Editar". Normaliza a entero y acota a `[FIRST_STEP, LAST_STEP]`; un valor no numérico es no-op. No reemplaza a `nextStep` (que además valida).
- **D3 — El honeypot NO entra en `createEmptyForm()`.** `wizard.test.mjs` (C-05) hace `deepEqual` del formulario vacío; agregar la clave lo rompería. El honeypot se lee como `form[HONEYPOT_FIELD]` (ausente → `undefined` → no dispara). `HONEYPOT_FIELD` se exporta desde `wizard.js` como única fuente de verdad, para que el render (C-08) y el guard (C-11) usen el mismo nombre. `setForm` ya hace merge, así que el campo trampa se persiste sin tocar el modelo.
- **D4 — `BudgetTotals.jsx` extraído.** El paso de revisión (US-007 CA-1 pide el total) y el panel lateral necesitan lo mismo: total + `/mes` + aviso de cotizable. Se extrae de `SummarySidebar` para que haya una sola fuente y C-11 pula un solo lugar. `SummarySidebar` no cambia de datos; el aviso pasa a quedar junto al total (cambio visual menor).
- **D5 — El botón de envío solo inicia el envío.** Llama a `submit` (C-05), que pasa a `submitting` con datos válidos o expone errores si no. Sin `disabled` (eso es RN-AB-02, de C-11) y sin llamada de red (C-10). Queda documentado el estado intermedio: hasta C-10 nada resuelve el `submitting`.
- **D6 — Accesibilidad del formulario.** Cada campo con `label` asociado por `htmlFor`/`id`; el error va en un `<p role="alert">` con `id` estable y el input lo referencia con `aria-describedby`, además de `aria-invalid`. El foco visible lo aporta el estilo global del proyecto (RN-EX-04).
- **D7 — Sin tests de componentes.** Igual que C-06/C-07 (D2): se testean `buildReview` y `goToStep`; el resto se valida con `npm run build` y revisión visual. El bloqueo de avance sin nombre/email **ya** está cubierto por `scripts/wizard.test.mjs`, así que no se duplica.

## Risks / Trade-offs

- **Estado `submitting` sin resolver hasta C-10** (D5): el botón queda deshabilitado por la lógica de C-11 y sin respuesta hasta que llegue el transporte. Es el seam previsto por C-05 y no llega a producción (C-12).
- **`BudgetTotals` toca un componente de C-06** (D4): cambio de composición sin tests (D7) → se verifica a ojo.
- **Honeypot fuera del modelo del formulario** (D3): el campo no aparece en `createEmptyForm`, así que un guard futuro debe leerlo con fallback a `undefined` (contemplado).
- **Sin tests de componentes** (D7): la interacción real (teclado, foco, responsive) no se verifica automáticamente.

## Migration Plan

No aplica: se completan pasos que eran placeholders. El wizard queda navegable de punta a punta.

## Open Questions

Ninguna para implementar. P-01 (precios), P-02 (webhook) y P-03 (WhatsApp) siguen siendo bloqueantes de deploy.
