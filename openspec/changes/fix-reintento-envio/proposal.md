# Proposal

## Why

Cuando el envío del presupuesto al webhook falla, el botón "Reintentar" de la pantalla de error no hace nada: `submit` marca `submitted: true` al *iniciar* el envío y, tras el error, `submitted` queda en `true`, de modo que el guard de doble envío del hook (`useConfigurador.js:38`) bloquea cualquier reintento. Además, el hook decide si enviar leyendo una variable (`pending`) asignada dentro del updater de `setState`, lo que solo funciona si React computa el estado de forma *eager* (no garantizado en React 18): si la actualización se difiere, el envío no se dispara y el visitante no ve ningún error. Es un fallo silencioso en el único punto de conversión del configurador, por eso se corrige antes de C-11/C-12.

## What Changes

- El inicio del envío (`submit`) ya NO marca el presupuesto como enviado: deja `submitting: true` / `status: 'submitting'` con `submitted: false`; solo un envío **exitoso** marca `submitted: true`.
- La prevención de doble envío (RN-AB-02) pasa al núcleo puro: `submit` es no-op si ya hay un envío en curso o si el presupuesto ya fue enviado con éxito.
- Nueva función pura `resolveSubmit(state, outcome)` para cerrar el ciclo de envío: `'success'` marca enviado; `'error'` libera el envío (`submitted: false`, `submitting: false`) dejándolo reintentable.
- Nueva función pura `clearSubmitError(state)` que, desde el estado `error`, vuelve a `idle` en el paso de revisión conservando todos los datos, para que el visitante pueda **volver a revisar/editar** antes de reenviar.
- El hook `useConfigurador` decide el envío **fuera** del updater de `setState`, a partir del estado vigente (ref espejo) y con un bloqueo síncrono "en vuelo" (ref) contra doble clic; el payload se arma con el estado validado, no con el `state` capturado en el render.
- `ErrorStep` suma un botón secundario "Revisar mis datos" que invoca `clearSubmitError`; "Reintentar" vuelve a disparar el envío.
- Tests unitarios en `scripts/wizard.test.mjs` (`node --test`), sin dependencias nuevas.

### Fuera de alcance

Queda para **C-11 antiabuse-and-polish** / **C-12 ci-and-deploy**: honeypot, rate limit, timeout con `AbortController`, `userAgent` hardcodeado, link de WhatsApp, accesibilidad (foco/anuncios del paso de error), rewrites SPA, headers de seguridad, workflow de CI, PDF y alineación de la knowledge-base.

## Capabilities

### New Capabilities

_Ninguna._

### Modified Capabilities

- `estado-del-configurador`: cambia "Inicio del envío" (no marca enviado al iniciar; no-op si hay envío en curso o ya exitoso) y se agregan "Resolución del envío" (éxito marca enviado, error deja reintentable) y "Volver a revisar tras un error".
- `webhook-integration`: "UI durante el envío" suma el reintento tras error y el uso del estado vigente para el payload; "Pantallas de éxito y error" suma la acción de volver a revisar los datos desde la pantalla de error.

## Impact

- **Código**: `src/utils/wizard.js` (`submit` modificado; nuevas `resolveSubmit`, `clearSubmitError`), `src/hooks/useConfigurador.js` (reescritura de `submitReal`, expone `clearSubmitError`), `src/components/configurador/ErrorStep.jsx` (prop `onEdit` opcional + botón), `src/pages/Configurador.jsx` (cablea `onEdit`).
- **Tests**: `scripts/wizard.test.mjs` — se actualiza el test existente de `submit` válido (ahora `submitted: false`) y se agregan casos de guard, resolución y vuelta a revisión.
- **API pública del núcleo**: cambio de contrato de `submit` (`submitted` ya no es `true` al iniciar). El único consumidor es `useConfigurador`; `ReviewStep` sigue deshabilitando el botón con `submitting || submitted`, que mantiene su semántica.
- **Dependencias**: ninguna nueva. Verificación con `npm run ci`.
- **Governance**: lógica de negocio → nivel MEDIUM.
