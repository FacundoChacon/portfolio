# CHANGES — Secuencia de Implementación

> Índice canónico de todos los changes del proyecto **Portfolio + Configurador de Presupuestos Web (facucode.dev)**.
> Cada change es atómico: un agente puede implementarlo en una sesión (~4-6 horas).
> **Leer este archivo antes de ejecutar cualquier `/opsx-propose`.**

---

> **Nota (2026-11-24) — `hero-escritura`.** Hero con entrada escrita en tres fases (texto izq→der, retrato tras un obturador, ficha der→izq), una vez por carga y con movimiento reducido en estado final. Se cierran los huecos bajo las acciones del hero y bajo los canales de Contáctame. No revive `texto-animado` (sin glitch). Trade-off de LCP: el retrato se pinta desde el primer frame bajo el obturador. Ver `openspec/changes/hero-escritura/`.

---

> **Nota (2026-11-23) — Rediseño Evangelion.** Sitio y configurador pasan de la estética cyber/neón a Evangelion brutalista. Changes en orden:
> 1. `tokens-fuentes-texturas-eva`: paleta `eva`, Noto Serif Display y JetBrains Mono autoalojadas, texturas y paneles.
> 2. `navbar-brutalista-glass`: barra con cristal oscuro y marca `FC //00`.
> 3. `proyectos-scroll-horizontal` (reemplazado por `proyectos-carrete-3d`): sección Proyectos; la versión final es un carrete 3D con respaldo de carrusel nativo.
> 4. `hero-brutalista`: hero con arranque por clip-path y texturas.
> 5. `acerca-testimonios-glass`: "Quién soy" y testimonios con paneles de cristal.
> 6. `stack-neumorfico-oscuro`: Stack en módulos neumórficos oscuros.
> 7. `contacto-brutalista`: contacto en panel brutalista.
> 8. `configurador-estilo-eva`: wizard, resumen y estados con la estética eva.
> 9. `limpieza-cyberpunk`: retira la paleta (`accent-*`, `neon-*`, `dark-*`, `muted-*`) y las fuentes (Orbitron, Rajdhani) cyberpunk, `GlitchText`, los keyframes y clases de glitch, brillo y escaneo, y la spec `texto-animado`; el cuerpo pasa a la pila de fuentes del sistema y un guard global impide que vuelvan.
> 10. `jerarquia-color-violeta` (depende de `limpieza-cyberpunk`, por `sistema-visual`): jerarquía violeta > naranja > verde agua con roles semánticos (`EVA_ROLES`), foco verde agua, éxito del configurador en celeste y errores en rojo claro, y un test de jerarquía.

---

> **Nota (2026-11-23) — pulido-build-indexable.** Plugin `route-html` en `writeBundle` (no tapa errores del build), detección `on*` robusta, dominio único (CI lee `seo.js`).

---

> **Nota (2026-11-20) — Ajustes post-C-10.** `fix-reintento-envio` (reintento tras error de envío), webhook con `Content-Type: text/plain` y timeout de 20 s (Google Apps Script), rewrite SPA aplicado en `vercel.json` y WhatsApp de respaldo configurado.

---

> **Nota (2026-10-12) — Sistema de precios eliminado.** El configurador dejó de exponer precios: el catálogo no tiene `priceARS`, se eliminaron `pricing.js`/`priceLabels.js`, la spec `calculo-de-presupuesto`, y los importes del resumen, PDF y payload del webhook. Ahora arma una **solicitud de presupuesto** (tipo de sitio + cantidad + extras + contacto) y el precio se confirma por email. Esto revierte **C-04** y ajusta **C-06/C-07/C-09/C-10**. Quedan pendientes **C-11** y **C-12**.

---

## Cómo usar este documento

1. **Identificá el change** libre en la fase correspondiente (respetá las dependencias de la columna `Dependencias`).
2. **Leé la KB** listada en su bloque `Leer antes` (archivos de `knowledge-base/`).
3. **Proponé** el change con `/opsx-propose C-NN-{nombre}` (OpenSpec crea el artefacto en `openspec/changes/`).
4. Implementá, verificá (`npm run ci`: lint + verificaciones + tests + build) y **archivá** el change (`/opsx-archive`) al quedar verde.
5. **Marcá el checkbox** `Estado` de este archivo (`[ ]` → `[x]`) y actualizá el resumen final.

---

## Árbol de dependencias

```
C-01 foundation-setup
└── C-02 routing-shell
    └── ┌───────────────┬──────────────┐
        │               │              │
C-03 catalog-data   C-04 pricing-engine (dep. C-03)
    │               C-05 wizard-state   (dep. C-03)
    │                   │
    └──────────────────►┴── C-06 wizard-layout (dep. C-02, C-04, C-05)
                            ├── C-07 service-extras-cards (dep. C-06, C-05)
                            └── C-08 contact-review-steps (dep. C-06, C-05)

C-04 pricing-engine ──► C-09 pdf-generator
C-04 + C-05 ─────────► C-10 webhook-integration

C-07 + C-08 + C-10 ──► C-11 antiabuse-and-polish
C-11 ────────────────► C-12 ci-and-deploy
```

### Paralelismo por fase

```
GATE 0: C-01 foundation-setup ✓
  → C-02 routing-shell                 [Agente C]

GATE 1: C-02 routing-shell ✓  y  C-03 catalog-data ✓   ← FORK
  → C-04 pricing-engine                [Agente A]
  → C-05 wizard-state                  [Agente A — si C-03 ✓, secuencial con C-04]
  → (C-09 pdf-generator puede iniciar cuando C-04 ✓)   [Agente C]

GATE 2: C-04 ✓ + C-05 ✓ + C-02 ✓   ← FORK
  → C-06 wizard-layout                 [Agente B]
  → C-09 pdf-generator                 [Agente C — si C-04 ✓]
  → C-10 webhook-integration           [Agente C — si C-04 ✓ y C-05 ✓]

GATE 3: C-06 wizard-layout ✓   ← FORK
  → C-07 service-extras-cards          [Agente B]
  → C-08 contact-review-steps          [Agente B — secuencial con C-07]

GATE 4: C-07 ✓ + C-08 ✓ + C-10 ✓
  → C-11 antiabuse-and-polish          [Agente B]

GATE 5: C-11 antiabuse-and-polish ✓
  → C-12 ci-and-deploy                 [Agente C]
```

### Camino crítico (7 changes — mínimo irreducible)

`C-01 → C-02 → C-05 → C-06 → C-08 → C-11 → C-12`

### Plan óptimo con 3 agentes

| Paso | Agente A (Dominio & Datos) | Agente B (UI Configurador) | Agente C (Infra & Integración) |
|------|---------------------------|---------------------------|-------------------------------|
| 1 | C-03 catalog-data | — | C-01 foundation-setup |
| 2 | C-04 pricing-engine | — | C-02 routing-shell |
| 3 | C-05 wizard-state | — | C-09 pdf-generator (si C-04 ✓) |
| 4 | — | C-06 wizard-layout (si C-05 ✓) | C-10 webhook-integration (si C-05 ✓) |
| 5 | — | C-07 service-extras-cards | C-12 ci-and-deploy (prep) |
| 6 | — | C-08 contact-review-steps | — |
| 7 | — | C-11 antiabuse-and-polish (si C-10 ✓, C-08 ✓) | C-12 ci-and-deploy (cierre) |

---

## FASE 1 — Fundaciones

### [C-01] `foundation-setup`
- **Estado**: [x] completado (2026-10-12)
- **Scope**:
  - Instalar deps: `react-router-dom`, `@react-pdf/renderer`.
  - Crear `.env.example` con `VITE_WEBHOOK_URL`, `VITE_WHATSAPP_NUMBER`, `VITE_CONTACT_EMAIL`, `VITE_APP_URL`.
  - Envolver `src/main.jsx` con `BrowserRouter`.
  - Crear carpetas `src/pages/`, `src/components/configurador/`, `src/utils/`, `src/data/`.
  - Verificar que `npm run lint` + `npm run build` sigan verdes (línea base).
  - Tests: ninguno aún (solo build verde).
- **Dependencias**: ninguna
- **Governance**: MEDIO
- **Leer antes**:
  - `knowledge-base/02_descripcion_general.md` §Stack
  - `knowledge-base/08_arquitectura_propuesta.md` §Estructura de directorios, §Variables de entorno

### [C-02] `routing-shell`
- **Estado**: `[x]` completado (2026-10-12)
- **Scope**:
  - Refactor `src/App.jsx` a `<Routes>`: `/` → portfolio (secciones actuales), `/configurador` → `React.lazy(Configurador)`, `*` → redirect a `/`.
  - `Suspense` con fallback coherente con el tema.
  - Placeholder mínimo de `pages/Configurador.jsx` (para no romper el lazy).
  - Adaptar `SiteNav.jsx`: CTA "Armá tu web" que navega a `/configurador` (usar `Link`/`useNavigate`); mantener anclas de la home.
  - Documentar fallback SPA para el hosting (ver P-07).
  - Tests: build genera chunk del configurador.
- **Dependencias**: `C-01`
- **Governance**: MEDIO
- **Leer antes**:
  - `knowledge-base/08_arquitectura_propuesta.md` §Patrones aplicados, §Rendimiento
  - `knowledge-base/06_funcionalidades.md` §US-001, §US-002
  - `knowledge-base/07_flujos_principales.md` §Flujo 2

---

## FASE 2 — Dominio del configurador (lógica pura y datos)

### [C-03] `catalog-data`
- **Estado**: `[x]` completado (2026-10-12)
- **Scope**:
  - Crear `src/data/configurador.js` con `services[]` (7: landing, onepage, ecommerce, corporate, blog, portfolio, custom) y `extras[]` (8: seo, copy, cms, i18n, clients, whatsapp, maintenance, hosting).
  - Cada item con `id`, `name`, `description`, `priceARS`, `icon` (lucide), y extras con `category`, `recurring`, `disclaimer`, `recommended`.
  - `custom` con `priceARS: null`, `quotable: true`; `hosting` con `priceARS: 0` + disclaimer textual (RN-HD-02).
  - Exportar constantes `CURRENCY = 'ARS'` y textos de disclaimer.
  - Tests: render de los arrays (shape) — o smoke test.
- **Dependencias**: ninguna (puede correr en paralelo a C-01/C-02)
- **Governance**: BAJO
- **Leer antes**:
  - `knowledge-base/04_modelo_de_datos.md` §Entidades (Service, Extra)
  - `knowledge-base/05_reglas_de_negocio.md` §RN-PR, §RN-CO, §RN-HD
  - `knowledge-base/10_preguntas_abiertas.md` §P-01 (precios a confirmar)

### [C-04] `pricing-engine`
- **Estado**: `[x]` revertido — sistema de precios eliminado (2026-10-12)
- **Nota**: ver la nota al inicio del documento. El configurador ya no calcula importes; se eliminaron `pricing.js`/`priceLabels.js` y la spec `calculo-de-presupuesto`.
- **Scope**:
  - Crear `src/utils/pricing.js`: `computeTotal(service, qty, extras)`, `formatARS(n)`, `splitRecurring(extras)` (único vs /mes), `hasQuotable(...)`.
  - Manejar `priceARS: null` (no suma, marca quotable) y `0` (no altera).
  - Formateo con `Intl.NumberFormat('es-AR', { style:'currency', currency:'ARS' })`.
  - Tests unitarios: total con qty>1, recurring separado, quotable, extras vacíos, precio 0.
- **Dependencias**: `C-03`
- **Governance**: MEDIO
- **Leer antes**:
  - `knowledge-base/05_reglas_de_negocio.md` §RN-PR, §RN-QT
  - `knowledge-base/04_modelo_de_datos.md` §QuoteConfig, §LeadPayload

### [C-05] `wizard-state`
- **Estado**: `[x]` completado (2026-10-12)
- **Scope**:
  - Crear `src/hooks/useConfigurador.js`: estado `{ step, serviceId, extras[], quantity, form, submitted, status }`.
  - Acciones: `setService`, `toggleExtra`, `setQuantity(min 1)`, `setForm`, `nextStep` (valida paso 3), `prevStep`, `submit`.
  - Validación de `name`/`email` (RN-VL-01) exponiendo `errors`.
  - Preselección por defecto: primer servicio, extras `recommended`, `quantity = 1`.
  - Tests: transiciones de pasos, toggle sin duplicados, quantity>=1, bloqueo de avance sin nombre/email.
- **Dependencias**: `C-03`
- **Governance**: MEDIO
- **Leer antes**:
  - `knowledge-base/04_modelo_de_datos.md` §QuoteConfig
  - `knowledge-base/05_reglas_de_negocio.md` §RN-VL, §RN-QT, §RN-PR-06

---

## FASE 3 — UI del configurador

### [C-06] `wizard-layout`
- **Estado**: `[x]` completado (2026-10-12)
- **Scope**:
  - `src/pages/Configurador.jsx`: layout 2 columnas (contenido + `SummarySidebar` sticky), header propio, estética cyber/neón.
  - `components/configurador/WizardSteps.jsx`: indicador de 4 pasos con estados (done/current/pending).
  - `components/configurador/SummarySidebar.jsx`: desglose en vivo (servicio×qty, extras, recurring /mes), total ARS, aviso "+ sistema a medida (a cotizar)".
  - Navegación Atrás/Continuar coherente con `useConfigurador`.
  - Tests: el total en el sidebar cambia al togglear (integración con pricing).
- **Dependencias**: `C-02`, `C-04`, `C-05`
- **Governance**: MEDIO
- **Leer antes**:
  - `knowledge-base/06_funcionalidades.md` §US-004 (CA-2)
  - `knowledge-base/08_arquitectura_propuesta.md` §Estructura, §Patrones
  - `knowledge-base/09_decisiones_y_supuestos.md` §DD-07

### [C-07] `service-extras-cards`
- **Estado**: `[x]` completado (2026-10-12)
- **Scope**:
  - `components/configurador/ServiceCards.jsx`: paso 1, 7 cards con nombre/descripción/precio ARS o "A cotizar", una seleccionada (RN-CO-01).
  - `components/configurador/ExtrasCards.jsx`: paso 2, 8 toggles; `hosting` con disclaimer visible (RN-HD-03); `maintenance` con "/mes".
  - `components/configurador/QuantityControl.jsx`: +/− con mínimo 1.
  - Estados visuales seleccionado/hover/focus; responsive.
  - Tests: etiquetas de precio y resolución de los iconos del catálogo. La selección única, el toggle y el mínimo de cantidad ya están cubiertos por `scripts/wizard.test.mjs` (C-05), así que no se duplican.
- **Dependencias**: `C-06`, `C-05`
- **Governance**: BAJO
- **Leer antes**:
  - `knowledge-base/06_funcionalidades.md` §US-003, §US-004, §US-005
  - `knowledge-base/05_reglas_de_negocio.md` §RN-HD, §RN-CO, §RN-QT

### [C-08] `contact-review-steps`
- **Estado**: `[x]` completado (2026-10-12)
- **Scope**:
  - `components/configurador/FormStep.jsx`: paso 3, campos nombre/email (obligatorios) + teléfono/descripción (opcionales), validación inline accesible (`aria-invalid`, `aria-describedby`).
  - `components/configurador/ReviewStep.jsx`: paso 4, resumen completo + botones "Editar" por bloque + nota "estimación no vinculante".
  - Incluir campo **honeypot** oculto (base para C-11) y placeholder de botón de envío.
  - Tests: `buildReview` (bloques, cantidad, "Sin extras", datos de contacto) y `goToStep` (saltos acotados). El bloqueo de avance sin nombre/email ya está cubierto por `scripts/wizard.test.mjs` (C-05), así que no se duplica.
- **Dependencias**: `C-06`, `C-05`
- **Governance**: MEDIO
- **Leer antes**:
  - `knowledge-base/06_funcionalidades.md` §US-006, §US-007
  - `knowledge-base/05_reglas_de_negocio.md` §RN-VL, §RN-PR-07, §RN-CO-02

---

## FASE 4 — Integración y entrega

### [C-09] `pdf-generator`
- **Estado**: `[x]` completado (2026-10-12)
- **Scope**:
  - `src/utils/pdfGenerator.js`: documento `@react-pdf/renderer` desde el `LeadPayload` (encabezado Facundo Chacón, fecha, servicio, extras, únicos vs /mes, total, disclaimer hosting, nota "no vinculante").
  - Import **dinámico** de `@react-pdf/renderer` (no engordar bundle inicial).
  - Función `buildPdfBlob(payload)` + helper de conversión a base64 para adjuntar.
  - Best-effort: error de PDF no rompe el envío (RN-PD-03).
  - Tests: genera blob no vacío para un payload de ejemplo.
- **Dependencias**: `C-04`
- **Governance**: MEDIO
- **Leer antes**:
  - `knowledge-base/05_reglas_de_negocio.md` §RN-PD
  - `knowledge-base/06_funcionalidades.md` §US-009
  - `knowledge-base/07_flujos_principales.md` §Flujo 3

### [C-10] `webhook-integration`
- **Estado**: `[x]` completado (2026-10-12)
- **Scope**:
  - `src/utils/webhook.js`: `buildLeadPayload(state)` + `sendLead(payload, pdfBlob)` (POST a `VITE_WEBHOOK_URL`, timeout, manejo de error).
  - Fallback si falta `VITE_WEBHOOK_URL`: serializar resumen a `mailto:` (embudo degradado).
  - `components/configurador/SuccessStep.jsx` (confirmación con nombre) y `ErrorStep.jsx` (mailto + WhatsApp con `VITE_WHATSAPP_NUMBER`).
  - Wire del botón "Enviar" → `submit` en `useConfigurador` con `status: submitting → success | error`.
  - Tests: `sendLead` con fetch mockeado (éxito y error); payload con/sin pdf.
- **Dependencias**: `C-04`, `C-05`
- **Governance**: ALTO
- **Leer antes**:
  - `knowledge-base/07_flujos_principales.md` §Flujo 1, §Flujo 4
  - `knowledge-base/05_reglas_de_negocio.md` §RN-NT, §RN-AB
  - `knowledge-base/04_modelo_de_datos.md` §LeadPayload
  - `knowledge-base/08_arquitectura_propuesta.md` §Seguridad

---

## FASE 5 — Calidad y cierre

### [C-11] `antiabuse-and-polish`
- **Estado**: `[x]` completado (2026-11-20)
- **Scope**:
  - Honeypot activo: descarte silencioso si está completo (RN-AB-01).
  - Bloqueo de doble submit (`status === 'submitting'`) (RN-AB-02).
  - Pasada de accesibilidad (focus visible, contraste AA, labels, `aria-live` en el resumen/estado).
  - Responsive fino (sidebar sticky en desktop, colapsada en móvil).
  - Copy final en es-AR y coherencia visual con el portfolio.
  - Tests: honeypot descarta; botón deshabilitado durante envío.
- **Dependencias**: `C-07`, `C-08`, `C-10`
- **Governance**: MEDIO
- **Leer antes**:
  - `knowledge-base/05_reglas_de_negocio.md` §RN-AB, §RN-EX
  - `knowledge-base/06_funcionalidades.md` §US-012

### [C-12] `ci-and-deploy`
- **Estado**: `[x]` completado (2026-11-20)
- **Scope**:
  - CI: el workflow corre `npm run ci` (incluye `verify:deploy`) y verifica artefactos del build (chunk `Configurador-*.js`, `sitemap.xml`, `og:image`).
  - Cabeceras de seguridad y CSP en `vercel.json` (rollout Report-Only → enforcing), `public/sitemap.xml` y `Sitemap` en `robots.txt`.
  - `.env.example` documentado; `VITE_WEBHOOK_URL`, `VITE_WHATSAPP_NUMBER` y `VITE_CONTACT_EMAIL` cargadas en el entorno del hosting.
  - Alinear la `knowledge-base/` con el sistema vigente (sin precios; webhook Apps Script; P-01, P-02, P-03 y P-07 resueltas) y cerrar `CHANGES.md`.
- **Dependencias**: `C-11`
- **Governance**: MEDIO
- **Leer antes**:
  - `knowledge-base/08_arquitectura_propuesta.md` §Seguridad, §Variables de entorno
  - `knowledge-base/10_preguntas_abiertas.md` §P-02, P-03, P-07 (resueltas)
  - `.github/workflows/ci.yml`, `vercel.json`

---

## FASE 6 — Portfolio (post-roadmap)

### [C-13] `testimonios-seccion`
- **Estado**: [x] completado (2026-11-11)
- **Scope**:
  - `src/data/testimonios.js`: testimonios de la home (`{ nombre, rol, comentario, rating }` × 3-6; array vacío hasta cargar testimonios reales — la sección queda oculta por guard del componente).
  - `src/components/Testimonials.jsx`: sección "04. Testimonios" de la home (figure → blockquote → figcaption, rating accesible `role="img"` + `aria-label`, avatar de iniciales decorativo).
  - `src/pages/Home.jsx`: montar `<Testimonials />` entre `<Stack />` y `<Contact />`.
  - `src/components/Contact.jsx`: renumerar el header de sección `04.` → `05.`.
  - `scripts/verify-testimonials.mjs` + `verify:testimonials` incluido en `npm run ci`.
- **Dependencias**: ninguna
- **Governance**: BAJO
- **Leer antes**:
  - `knowledge-base/02_descripcion_general.md`

---

## Resumen

| Fase | Changes | Paralelizable |
|------|---------|---------------|
| 1 — Fundaciones | C-01, C-02 | No (secuencial) |
| 2 — Dominio | C-03, C-04, C-05 | C-03 en paralelo a Fase 1 |
| 3 — UI | C-06, C-07, C-08 | C-07 y C-08 tras C-06 |
| 4 — Integración | C-09, C-10 | Sí (tras C-04/C-05) |
| 5 — Cierre | C-11, C-12 | No (secuencial) |
| 6 — Portfolio | C-13 | No |

**Total**: 13 changes · **Camino crítico**: 7 · **Gates**: 6

**Estado del roadmap**: C-01..C-12 completados (C-04 revertido el 2026-10-12, ver nota de precios); C-13 completado (2026-11-11). No quedan changes pendientes.

> **Checklist de deploy** (vigente): variables `VITE_WEBHOOK_URL`, `VITE_WHATSAPP_NUMBER` y `VITE_CONTACT_EMAIL` en Vercel (Production); cabeceras y CSP en `vercel.json` (primero Report-Only, luego enforcing); `/sitemap.xml` (con `/` y `/configurador`) y `/robots.txt` servidos como estáticos; `/configurador` con su HTML propio (título, canonical `https://www.facucode.dev/configurador`, `og:*` y `twitter:*`; ver `openspec/changes/configurador-indexable`); verificación post-deploy con `curl -I` y recorrido del configurador sin violaciones de CSP. Preguntas P-01 (cerrada), P-02, P-03 y P-07 resueltas: ver `knowledge-base/10_preguntas_abiertas.md`.
