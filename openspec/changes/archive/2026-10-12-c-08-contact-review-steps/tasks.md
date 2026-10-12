# Tasks

## 1. Núcleo de estado (`src/utils/wizard.js`)

- [x] 1.1 Exportar `HONEYPOT_FIELD` (nombre del campo trampa, única fuente de verdad).
- [x] 1.2 Agregar `goToStep(state, target)`: normaliza a entero, acota a `[FIRST_STEP, LAST_STEP]`, no-op con valores no numéricos.
- [x] 1.3 Tests en `scripts/wizard.test.mjs`: salta al paso pedido, acota fuera de rango y no muta el estado.

## 2. Modelo de revisión (`src/utils/review.js`)

- [x] 2.1 `buildReview(state, services, extras)` → `{ blocks, summary }`.
- [x] 2.2 Bloques `service` / `extras` / `contact` con `editStep` (0/1/2) y líneas `{ label, value }`.
- [x] 2.3 Servicio: nombre + `× cantidad` solo si `quantity > 1` + importe; extras: `Sin extras` si no hay; datos: `—` en obligatorios vacíos y omite opcionales vacíos.
- [x] 2.4 Crear `scripts/review.test.mjs` con los casos anteriores (incluye el catálogo real inyectado).

## 3. Totales compartidos (`BudgetTotals.jsx`)

- [x] 3.1 Extraer de `SummarySidebar.jsx` el aviso de cotizable, la fila de total y el importe mensual.
- [x] 3.2 Refactorizar `SummarySidebar.jsx` para usarlo (sin cambio de datos).

## 4. Componentes de paso

- [x] 4.1 `FormStep.jsx`: nombre/email obligatorios, teléfono/descripción opcionales; `label` asociado, `aria-invalid` + `aria-describedby` + `role="alert"` en los errores.
- [x] 4.2 `FormStep.jsx`: campo trampa oculto (`HONEYPOT_FIELD`), no enfocable (`tabIndex={-1}`), `aria-hidden` y `autocomplete="off"`.
- [x] 4.3 `ReviewStep.jsx`: bloques con "Editar" (onClick → `goToStep`), `BudgetTotals`, nota de "estimación no vinculante" y botón de inicio de envío.

## 5. Página (`src/pages/Configurador.jsx`)

- [x] 5.1 Montar `FormStep` en el paso 3 (con `form`, `errors`, `setForm`) y `ReviewStep` en el paso 4 (con `review`, `onEdit`, `onSubmit`).
- [x] 5.2 Quitar el `StepPlaceholder` (los cuatro pasos quedan implementados).
- [x] 5.3 Pasar el handler de envío (`submit`) y mostrar el error de contacto si el envío se bloquea por validación.

## 6. Verificación

- [x] 6.1 `npm run test` verde y comprobar que un test nuevo puede fallar (rojo).
- [x] 6.2 `npm run ci` verde y revisar el chunk `Configurador-*.js`.
