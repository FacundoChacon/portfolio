# Arquitectura Propuesta

## Patrones aplicados

| Patrón | Dónde se usa | Por qué |
|--------|--------------|---------|
| SPA + routing cliente | `react-router-dom` con `BrowserRouter` | Habilitar `/configurador` como página aparte sin recargar |
| Lazy loading por ruta | `React.lazy` + `Suspense` en la ruta del configurador | No cargar el configurador (ni su PDF lib) en la home |
| State machine simple | `useConfigurador` (`step`, `status`) | Wizard predecible y testeable |
| Catálogo como dato | `data/configurador.js` | Precios y textos separados de la UI (fácil edición) |
| Cálculo puro aislado | `utils/pricing.js` | Lógica de totales testeable sin React |
| Adapter de integración | `utils/webhook.js` | Aislar el proveedor (n8n/Zapier/Make) para migrar sin tocar UI |
| Best-effort side-effect | `utils/pdfGenerator.js` | El PDF no debe bloquear el envío |
| Presentational vs container | `components/configurador/*` | Componentes de card puros + página que orquesta |

## Estructura de directorios

```
portfolio/
├── index.html
├── package.json
├── vite.config.js
├── tailwind.config.js
├── .env.example                      # NUEVO (VITE_WEBHOOK_URL, VITE_WHATSAPP_NUMBER)
├── .github/workflows/ci.yml          # EXTENDER: verificar chunk del configurador
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
    │       ├── SummarySidebar.jsx    # "carrito" total en vivo
    │       ├── SuccessStep.jsx       # confirmación
    │       └── ErrorStep.jsx         # fallback mailto/WhatsApp
    ├── hooks/
    │   ├── useReveal.js              # existente
    │   └── useConfigurador.js        # NUEVO — estado del wizard
    ├── utils/                        # NUEVO
    │   ├── pricing.js
    │   ├── pdfGenerator.js
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
- **Datos personales**: solo nombre/email/teléfono/descripción; se transmiten por HTTPS al webhook. No se persisten en el front ni en `localStorage`.

## Variables de entorno

| Variable | Descripción | Ejemplo | Sensible |
|----------|-------------|---------|----------|
| `VITE_WEBHOOK_URL` | Endpoint del webhook que recibe el lead | `https://hook.n8n.cloud/xxxx` | N (pública) |
| `VITE_WHATSAPP_NUMBER` | Número de WhatsApp de respaldo | `+5492612345678` | N |
| `VITE_CONTACT_EMAIL` | Email de respaldo (`mailto:`) | `chaconfacu2006@gmail.com` | N |
| `VITE_APP_URL` | URL canónica para el PDF/meta | `https://www.facucode.dev` | N |

> Si `VITE_WEBHOOK_URL` no está definida, el flujo cae a `mailto:` con el resumen serializado (modo degradado).

## Rendimiento

- El `@react-pdf/renderer` se importa **dinámicamente** solo al confirmar el envío (no engorda el bundle inicial).
- La ruta `/configurador` se carga con `React.lazy`, creando un chunk separado.
- El CI actual ya verifica artefactos; se extiende para verificar que exista el chunk del configurador.

## Testing (mínimo esperado)

- **Unit**: `pricing.js` (totales, recurring, quotable, quantity), `webhook.js` (serialización), validación del form.
- **Component**: selección de servicio/extras, recalculo en vivo, bloqueo de avance sin nombre/email.
- **E2E (opcional, futuro)**: recorrido completo hasta el success con webhook mockeado.
