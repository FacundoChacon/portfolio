# Proposal

## Why

El configurador ya está en producción (webhook de Google Apps Script activo, doble submit bloqueado, reintento y fallback por WhatsApp resueltos), pero la revisión del 2026-11-20 dejó pendientes de calidad que C-11 debe cerrar antes del deploy final (C-12): el campo trampa (honeypot) se renderiza pero nadie lo lee, el payload manda un `userAgent` falso (`'node:test'`), hay fallas de accesibilidad WCAG 2.2 AA (foco invisible en los inputs, contraste insuficiente, texto animado que ignora `prefers-reduced-motion`, foco que no acompaña al cambio de paso) y el formulario envía datos personales a Google sin ningún aviso de uso.

## What Changes

- **Honeypot activo (RN-AB-01)**: si el campo trampa viene completo, el núcleo puro descarta el envío en silencio —no hace el POST y muestra la pantalla de éxito, sin darle señal al bot—. El campo se renombra de `company` (que el autocompletado del navegador puede llenar como "organización", descartando leads reales) a `website`, con `autocomplete="off"`. El payload sigue sin incluir el honeypot (se agrega el test que hoy falta).
- **`meta.userAgent` real**: `buildLeadPayload` toma `globalThis.navigator?.userAgent` (vacío si no hay `navigator`) en vez del literal `'node:test'`.
- **Accesibilidad (WCAG 2.2 AA)**:
  - `GlitchText` expone a las tecnologías de asistencia el texto real y estable (el texto revuelto queda `aria-hidden`) y no anima cuando el sistema pide movimiento reducido.
  - Foco visible en los campos del formulario (hoy `focus:outline-none` lo anula).
  - Contraste AA para texto chico: `text-gray-500`/`placeholder:text-gray-600` pasan a `gray-400` en el configurador.
  - Al cambiar de paso, el foco va al título del paso; las pantallas de éxito y error reciben el foco al aparecer; el envío en curso se anuncia por una región `aria-live`.
- **Aviso de privacidad**: una línea de texto junto al botón "Enviar solicitud" que explica para qué se usan los datos y cómo pedir su borrado, sin checkbox. **Texto confirmado por Facundo:** *"Uso tus datos solo para responder esta solicitud. No los comparto ni los uso para publicidad. Si querés que los borre, escribime a {email}."*
- **Copy es-AR**: la pantalla de éxito pasa a primera persona y corrige el fallback roto (`"Gracias el equipo. Te respondemos…"` → `"¡Gracias, {nombre}! Te respondo por email a la brevedad."`).
- **Anti-spam del receptor (fuera del repo)**: como `VITE_WEBHOOK_URL` es pública, los controles del cliente son cosméticos. Se entrega en `design.md` un snippet de Apps Script (validar `source`, límites de longitud, rate limit por email con `CacheService`) que Facundo pega y redeploya a mano. No forma parte del código del repo.

**Fuera de scope**: workflow de CI, headers de seguridad/CSP, sitemap, alineación de KB y `CHANGES.md` (van a C-12), PDF, upgrades mayores de dependencias, rediseños. Lo ya resuelto hoy (bloqueo de doble submit, reintento, `text/plain` + timeout de 20 s, rewrite SPA en `vercel.json`, fallback WhatsApp) no se toca. El "sidebar colapsado en móvil" del roadmap no se implementa: la spec vigente define el resumen apilado debajo del contenido y así funciona; el sticky de escritorio ya existe.

## Capabilities

### New Capabilities
- `texto-animado`: comportamiento del texto con efecto glitch del portfolio (texto estable para tecnologías de asistencia y respeto de la preferencia de movimiento reducido).

### Modified Capabilities
- `estado-del-configurador`: "Inicio del envío" suma el descarte silencioso cuando el campo trampa viene completo.
- `interfaz-del-configurador`: "Campo trampa oculto" (nombre no autocompletable, no viaja en el payload); nuevos requisitos de foco visible en campos, contraste AA, manejo del foco al cambiar de paso, anuncio del envío en curso y aviso de privacidad.
- `webhook-integration`: "Payload del lead" (`userAgent` real, sin honeypot) y "Pantallas de éxito y error" (foco al aparecer, copy en primera persona).

## Impact

- **Código**: `src/utils/wizard.js` (`submit` + `isLikelyBot`, `HONEYPOT_FIELD`), `src/utils/webhook.js` (`meta.userAgent`), nuevos helpers puros en `src/utils/` (movimiento reducido, foco/anuncios del wizard, saludo de éxito), `src/components/GlitchText.jsx`, `src/components/configurador/{FormStep,ReviewStep,WizardSteps,SummarySidebar,SuccessStep,ErrorStep}.jsx`, `src/pages/Configurador.jsx`.
- **Tests**: `scripts/wizard.test.mjs`, `scripts/webhook.test.mjs` y nuevos `scripts/*.test.mjs` con `node:test` (sin jsdom ni RTL; sin dependencias nuevas).
- **Sistemas externos**: el Apps Script receptor (cambio manual de Facundo, opcional pero recomendado).
- **Governance**: MEDIO (lógica de negocio del envío + UI); el aviso de privacidad requiere confirmación humana del texto.
