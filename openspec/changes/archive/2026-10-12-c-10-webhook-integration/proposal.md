# Proposal

## Why

El wizard ya acumula `state` (servicio, extras, cantidad, formulario) y el paso 4 muestra un resumen (C-06/C-08), pero **el envío al webhook nunca se cableó**. Además, C-08 dejó un estado `submitting` colgado y un placeholder de botón: hoy el visitante no puede enviar la solicitud ni ver confirmación/errores. C-10 resuelve US-008 y cubre las reglas de notificación/antispam relacionadas (RN-NT-03, RN-AB-02, RN-AB-04) dejando preparada la integración para la generación del PDF (C-09) y el guard del honeypot (C-11).

## What Changes

- Nuevo `src/utils/webhook.js`: `buildLeadPayload(state, services, extras)` arma el `LeadPayload` según KB 04 (incluye `submittedAt`, `source`, `service`, `quantity`, `extras[]`, `hasQuotable`, `subtotal`, `total`, `currency`, `contact`, `meta`), `sendLead(payload)` hace POST a `import.meta.env.VITE_WEBHOOK_URL` con `{ payload, pdf }` (cuando C-10 integre PDF usa `tryBuildPdfBlob` + `bufferToBase64` de C-09) y `isWebhookConfigured()`.
- Nuevo `scripts/webhook.test.mjs`: tests puros de `buildLeadPayload` (mapea servicio/elegidos, `hasQuotable`, `subtotal/total`, `source`, `submittedAt` tipo ISO, contacto).
- `src/hooks/useConfigurador.js`: expone `submitting`, `status` ('idle'|'sending'|'success'|'error'), `submit()` dispara el envío (usa `webhook.js`), deshabilita UI durante el envío (RN-AB-02), evita doble submit (idempotencia mínima: si ya `submitted` o `submitting` → no re-envía), maneja éxito/error (RN-NT-03). Los campos del wizard (formulario, servicio, extras, cantidad) ya existen (C-05); este cambio solo añade el lado "enviar".
- `src/pages/Configurador.jsx`: reemplaza el "Enviar" placeholder del paso 4 por el flujo real; en éxito muestra `SuccessStep` (nuevo), en error muestra `ErrorStep` (nuevo) con alternativa mailto/WhatsApp (RN-AB-04).
- Nuevos `src/components/configurador/SuccessStep.jsx` y `src/components/configurador/ErrorStep.jsx`: pantallas de confirmación y de error según US-008 CA-3/CA-4.

## Capabilities

### New Capabilities
- `integracion-webhook`: envío del `LeadPayload` al webhook externo, con estados de envío, pantalla de éxito y manejo de errores.

### Modified Capabilities
- `estado-del-configurador`: `useConfigurador` gana `submitting` y lógica de `submit()` (RN-AB-02) y actualización de `status` (RN-NT-03).

## Impact

- **Código**: nuevos `webhook.js`, `SuccessStep.jsx`, `ErrorStep.jsx`; cambios mínimos en `useConfigurador.js` (añade `submitting`/`status` y `submit` real) y en `Configurador.jsx` (muestra pasos de éxito/error).
- **Tests**: nuevo `scripts/webhook.test.mjs` (pure mapping). No se duplican reglas ya cubiertas por `wizard.test.mjs` (C-05).
- **Dependencias**: ninguna (usa `fetch`, `Intl.DateTimeFormat`).
- **Riesgo**: sin `VITE_WEBHOOK_URL` → envío falla (error legible) cumpliendo CA-4; no rompe build.
- **Alineación**: cumple US-008 (CA-1–CA-4), RN-NT-03, RN-AB-02, RN-AB-04. Prepara para que C-11 agregue honeypot + doble submit duro y para que el PDF viaje adjunto (usando C-09).