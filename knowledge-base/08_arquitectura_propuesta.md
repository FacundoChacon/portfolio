# Arquitectura Propuesta

## Patrones aplicados

| Patrón | Dónde se usa | Por qué |
|--------|--------------|---------|
| SPA + routing cliente | `react-router-dom` con `BrowserRouter` | Habilitar `/configurador` como página aparte sin recargar |
| Lazy loading por ruta | `React.lazy` + `Suspense` en la ruta del configurador | No cargar el configurador en la home (el CI verifica el chunk `Configurador-*.js`) |
| State machine simple | `useConfigurador` (`step`, `status`) | Wizard predecible y testeable |
| Catálogo como dato | `data/configurador.js` | Textos separados de la UI (fácil edición); sin precios |
| Lógica pura aislada | `utils/wizard.js`, `summary.js`, `review.js` | Estado y resumen testeables sin React |
| Adapter de integración | `utils/webhook.js` | Aislar el proveedor del webhook (hoy Apps Script) para migrar sin tocar UI |
| Best-effort side-effect | `utils/pdfGenerator.js` | El PDF no debe bloquear el envío (aún no integrado) |
| Presentational vs container | `components/configurador/*` | Componentes de card puros + página que orquesta |

## Estructura de directorios

```
portfolio/
├── index.html
├── package.json
├── vite.config.js
├── tailwind.config.js
├── .env.example                      # VITE_WEBHOOK_URL, VITE_WHATSAPP_NUMBER, VITE_CONTACT_EMAIL
├── vercel.json                       # rewrite SPA + cabeceras de seguridad + CSP
├── scripts/                          # verify-*.mjs, lib/deploy-config.mjs, lib/route-html.mjs y tests (node:test)
├── .github/workflows/ci.yml          # npm run ci + verificación de artefactos
├── CHANGES.md                        # NUEVO (índice de changes)
├── knowledge-base/                   # NUEVO (esta KB)
└── src/
    ├── main.jsx                      # EXTENDER: envolver en BrowserRouter
    ├── App.jsx                       # EXTENDER: definir rutas
    ├── index.css
    ├── pages/
    │   └── Configurador.jsx          # NUEVO — página /configurador
    ├── components/
    │   ├── (existentes: SiteNav, Hero, About, Projects, Stack, Contact, GlitchText, BrandIcons)
    │   ├── SiteNav.jsx               # EXTENDER: link "Armá tu web" (navegación router)
    │   └── configurador/             # NUEVO
    │       ├── WizardSteps.jsx       # indicador de progreso (4 pasos)
    │       ├── ServiceCards.jsx      # selección de tipo de sitio
    │       ├── ExtrasCards.jsx       # selección de extras + disclaimer
    │       ├── QuantityControl.jsx   # +/- cantidad
    │       ├── FormStep.jsx          # datos de contacto + validación
    │       ├── ReviewStep.jsx        # resumen del paso 4
    │       ├── SummarySidebar.jsx    # resumen en vivo de la selección
    │       ├── SuccessStep.jsx       # confirmación
    │       └── ErrorStep.jsx         # fallback mailto/WhatsApp
    ├── hooks/
    │   ├── useReveal.js              # existente
    │   └── useConfigurador.js        # NUEVO — estado del wizard
    ├── utils/
    │   ├── wizard.js, wizardView.js, summary.js, review.js, contact.js, motion.js
    │   ├── pdfGenerator.js, pdfDocument.js   # no integrados al envío
    │   └── webhook.js
    └── data/
        └── configurador.js           # NUEVO — catálogo (servicios + extras)
```

## Seguridad

- **Autenticación**: ninguna (sitio público, actores anónimos).
- **Autorización**: no aplica; no hay recursos protegidos.
- **Validación de input**: en el cliente (formato email, campos obligatorios, honeypot). El webhook **revalida** el payload (nunca confiar solo en el front).
- **Secrets management**: `VITE_*` es **público** por definición en Vite. No poner tokens/credenciales ahí. El webhook debe usar su propia auth (secret en el query param o header), asumiendo que la URL es descubrible.
- **Anti-abuso**: honeypot + bloqueo de doble submit + rate limiting en el webhook.
- **Cabeceras HTTP** (`vercel.json`, bloque `source: "/(.*)"`, validado por `npm run verify:deploy` en CI): `X-Content-Type-Options: nosniff`, `Referrer-Policy: strict-origin-when-cross-origin`, `X-Frame-Options: DENY`, `Permissions-Policy: camera=(), microphone=(), geolocation=(), payment=(), usb=()`.
- **CSP**: `default-src 'self'; script-src 'self'; style-src 'self' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; img-src 'self' data:; connect-src 'self' https://script.google.com https://script.googleusercontent.com; object-src 'none'; base-uri 'self'; form-action 'self'; frame-ancestors 'none'`. Sin `'unsafe-inline'` ni `'unsafe-eval'`.
- **Rollout de la CSP**: Deploy 1 como `Content-Security-Policy-Report-Only`; Deploy 2 (tras verificar producción sin violaciones) con la clave `Content-Security-Policy` enforcing. Mientras esté en Report-Only, `verify:deploy` muestra una advertencia.
- **Cómo actualizarla**: si se cambia el proveedor del webhook, ajustar `connect-src` en `vercel.json` y las constantes de `scripts/lib/deploy-config.mjs` (con sus tests); si se integra el PDF (`yoga-layout` compila WebAssembly), agregar `'wasm-unsafe-eval'` a `script-src`.
- **Datos personales**: solo nombre/email/teléfono/descripción; se transmiten por HTTPS al webhook. No se persisten en el front ni en `localStorage`.

## Variables de entorno

| Variable | Descripción | Ejemplo | Sensible |
|----------|-------------|---------|----------|
| `VITE_WEBHOOK_URL` | Endpoint del webhook (Apps Script) que recibe el lead | `https://script.google.com/macros/s/<id>/exec` | N (pública) |
| `VITE_WHATSAPP_NUMBER` | WhatsApp de respaldo, dígitos internacionales sin `+` | `549261XXXXXXX` | N |
| `VITE_CONTACT_EMAIL` | Email de respaldo (`mailto:`); si falta, el código usa un fallback | `tu@email.com` | N |

> Si `VITE_WEBHOOK_URL` no está definida, el flujo cae a `mailto:` con el resumen serializado (modo degradado).

## Rendimiento

- `@react-pdf/renderer` no está integrado al envío; su chunk no entra al build actual.
- La ruta `/configurador` se carga con `React.lazy`, creando el chunk `dist/assets/Configurador-*.js`.
- Metadatos por ruta: la fuente única es `src/data/seo.js` (`ROUTES`, `resolveRouteMeta`). Un plugin de Vite (`vite.config.js`, `closeBundle`) genera con `scripts/lib/route-html.mjs` un HTML estático por página pública (`dist/index.html` y `dist/configurador/index.html`) con título, description, canonical, `og:*` y `twitter:*` propios y los mismos assets; falla el build si la plantilla `index.html` pierde una etiqueta gestionada. Vercel sirve ese archivo antes del rewrite SPA. En el cliente, `useRouteMeta` (`src/hooks/useRouteMeta.js`) sincroniza título, description y canonical al navegar.
- El CI corre `npm run ci` (incluye `npm run verify:build`, que valida cada URL del sitemap contra su HTML construido) y verifica que el build emita el chunk `Configurador-*.js`, que `dist/index.html` no lo referencie y que existan `configurador/index.html`, `sitemap.xml` y `robots.txt`.

## Testing (mínimo esperado)

- **Unit** (`node --test "scripts/**/*.test.mjs"`, parte de `npm run ci`): `wizard.js`, `summary.js`, `review.js`, `webhook.js` (payload sin importes, `text/plain`, timeout), validación del form y `scripts/lib/deploy-config.mjs` (cabeceras, CSP, sitemap y robots).
- **Component**: selección de servicio/extras, recalculo en vivo, bloqueo de avance sin nombre/email.
- **E2E (opcional, futuro)**: recorrido completo hasta el success con webhook mockeado.
