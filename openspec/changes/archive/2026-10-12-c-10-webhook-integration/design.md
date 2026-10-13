# Design

## Context

- **Insumos**: `LeadPayload` (KB 04 §LeadPayload), RN-NT-03/RN-AB-02/RN-AB-04 (KB 05), Flujo 1 pasos 6–9 (KB 07), `computeTotal` (C-04), `useConfigurador` (C-05), `ReviewStep` (C-08), `pdfGenerator` (C-09 disponible para integración).
- **Estado actual**: `useConfigurador.submit()` existe pero es placeholder (no envía); `submitting` no se actualiza; `ReviewStep` tiene botón "Enviar presupuesto" estático; no hay `SuccessStep`/`ErrorStep`.
- **Configuración**: `VITE_WEBHOOK_URL` en `.env` (no versionado). Si ausente, el envío debe fallar de forma controlada (mostrar error, no crashear).

## Goals / Non-Goals

**Goals**: cablear envío real con estados, prevenir doble submit, mostrar éxito/error, tests puros de `buildLeadPayload`. **Non-Goals**: agregar honeypot (C-11), adjuntar PDF (aunque el `sendLead` acepta `{ payload, pdf }` vacío por ahora; C-09 + C-10 se integrarán usando `tryBuildPdfBlob` + `bufferToBase64`), rate-limiting avanzado.

## Decisions

- **D1 — `webhook.js` puro**: `buildLeadPayload` es puro (mapea `state` + catálogo) testeable con `node:test`. `sendLead` usa `fetch` (navegador) y lanza en error para que el hook lo capture. `isWebhookConfigured` devuelve booleano.
- **D2 — `submittedAt` ISO 8601**: `new Date().toISOString()` (coincide con KB 04). `source: 'facucode.dev/configurador'`.
- **D3 — `meta` mínimo**: `userAgent: navigator.userAgent`, `referrer: document.referrer || ''`. En tests (Node) estos no existen → usar strings vacías o `typeof` guard. En `buildLeadPayload` usar `globalThis.navigator?.userAgent ?? 'node:test'` y `globalThis.document?.referrer ?? ''` para mantener pureza testeable.
- **D4 — Doble submit**: en `submit()` si `state.submitted` o `state.submitting` → retornar temprano (RN-AB-02). También deshabilitar botón en UI.
- **D5 — Estados**: `status: 'idle'|'sending'|'success'|'error'`, `submitting` booleano (derivado o explícito). Al iniciar envío → `submitting=true, status='sending'`. Éxito → `submitted=true, status='success'`. Error → `submitting=false, status='error'`.
- **D6 — Integración paso 4**: `Configurador.jsx` lee `status`/`submitting`/`submitted`. Si `status==='success'` renderiza `SuccessStep`; si `status==='error'` renderiza `ErrorStep`; else renderiza paso 4 con botón conectado a `submit()`.
- **D7 — Alternativas de error**: `ErrorStep` muestra mailto `mailto:facundochacon.dev@gmail.com?subject=Presupuesto web - [Nombre]&body=...` y WhatsApp `https://wa.me/?text=...` (placeholder de número se deja como texto genérico si no hay `VITE_WHATSAPP_NUMBER`; usar `import.meta.env.VITE_WHATSAPP_NUMBER || '...'`). RN-AB-04 pide alternativa visible.
- **D8 — `sendLead` no adjunta PDF aún**: pasa `{ payload, pdf: null }`. En C-10+podemos extender: tras obtener payload, intentar `tryBuildPdfBlob` (C-09) → si ok, `pdf = { mimeType: 'application/pdf', base64: bufferToBase64(blob) }`. Eso queda fuera del alcance mínimo de este change (no rompe tests).
- **D9 — No duplicar cálculo**: `buildLeadPayload` usa `computeTotal(service, quantity, extras)` (C-04) para obtener `subtotal/total/hasQuotable`; no recalcula a mano.

## Risks / Trade-offs

- **Tests Node vs navegador**: `meta` usa `globalThis` guards → tests puros funcionan. Build Vite OK.
- **Webhook ausente**: muestra error claro, cumple CA-4. No bloquea desarrollo.
- **Doble submit**: guard en hook + botón deshabilitado (defensa en profundidad).
- **Acoplamiento mínimo**: `webhook.js` no conoce React; hook/UI finos.

## Migration Plan

Sin migraciones. Cambios aditivos (nuevos archivos + campos en estado ya existentes conceptualmente).

## Open Questions

Ninguna. P-02 (URL webhook) es bloqueante de deploy, no de desarrollo. P-03 (WhatsApp respaldo) puede resolverse con env opcional.