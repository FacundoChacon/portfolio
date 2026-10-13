# Tasks

## 1. webhook.js (`src/utils/webhook.js`)
- [ ] 1.1 `buildLeadPayload(state, services, extras)` → mapea a `LeadPayload` (KB 04). Usa `computeTotal`, ISO 8601, `source: 'facucode.dev/configurador'`, `meta` con guards (`globalThis`).
- [ ] 1.2 `isWebhookConfigured()`: booleano según `import.meta.env.VITE_WEBHOOK_URL`.
- [ ] 1.3 `sendLead(payload, { pdf } = { pdf: null })`: POST JSON a webhook con `{ payload, pdf }`. Lanza Error con mensaje claro si falta URL o respuesta no 2xx.

## 2. Tests webhook (`scripts/webhook.test.mjs`)
- [ ] 2.1 Mapeo básico: servicio, cantidad, extras, contacto, `source`, `submittedAt` es ISO string.
- [ ] 2.2 `hasQuotable` y totales coherentes con `computeTotal` (quotable → true, subtotal/total).
- [ ] 2.3 Extras vacíos y servicio custom (priceARS null) no rompen mapeo.
- [ ] 2.4 `meta` con defaults en Node (sin navigator/document).

## 3. useConfigurador (`src/hooks/useConfigurador.js`)
- [ ] 3.1 Añadir `submitting` y `status` ('idle'|'sending'|'success'|'error') al estado inicial.
- [ ] 3.2 Reescribir `submit()` para envío real: early return si `submitted` o `submitting`; set `submitting=true, status='sending'`; llamar `buildLeadPayload` + `sendLead`; éxito → `submitted=true, submitting=false, status='success'`; error → `submitting=false, status='error'` (captura excepción).
- [ ] 3.3 Exponer `submitting`, `status` en retorno (no romper API existente).

## 4. Componentes de estado (`src/components/configurador/SuccessStep.jsx`, `ErrorStep.jsx`)
- [ ] 4.1 `SuccessStep({ name })`: muestra confirmación con nombre (US-008 CA-3), botón "Volver al inicio" (Link a `/`).
- [ ] 4.2 `ErrorStep({ onRetry, contactEmail, whatsappUrl })`: mensaje de error, alternativas mailto/WhatsApp (RN-AB-04), botón "Reintentar".

## 5. Integración UI (`src/pages/Configurador.jsx`)
- [ ] 5.1 Importar `SuccessStep`, `ErrorStep`. Si `status==='success'` → renderiza `SuccessStep` con `state.form.name`. Si `status==='error'` → renderiza `ErrorStep` con `onRetry={wizard.submit}`, mailto y WhatsApp (usar env opcionales).
- [ ] 5.2 Paso 4 (Review): botón "Enviar presupuesto" conectado a `wizard.submit()`, deshabilitado cuando `submitting` o `submitted`, texto cambia a "Enviando..." cuando `submitting` (RN-AB-02).
- [ ] 5.3 No romper navegación entre pasos cuando no está en éxito/error.

## 6. Verificación
- [ ] 6.1 `npm run test` verde (webhook + existentes).
- [ ] 6.2 `npm run ci` verde.
- [ ] 6.3 Verificación manual conceptual: sin `VITE_WEBHOOK_URL` → error con alternativa visible (CA-4).
- [ ] 6.4 Doble click en enviar → solo un envío (guard en hook).