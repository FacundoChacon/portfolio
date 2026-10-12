# CHANGES — Secuencia de Implementación

> Índice canónico de todos los changes del proyecto **Portfolio + Configurador de Presupuestos Web (facucode.dev)**.
> Cada change es atómico: un agente puede implementarlo en una sesión (~4-6 horas).
> **Leer este archivo antes de ejecutar cualquier `/opsx-propose`.**

---

## Cómo usar este documento

1. **Identificá el change** libre en la fase correspondiente (respetá las dependencias de la columna `Dependencias`).
2. **Leé la KB** listada en su bloque `Leer antes` (archivos de `knowledge-base/`).
3. **Proponé** el change con `/opsx-propose C-NN-{nombre}` (OpenSpec crea el artefacto en `openspec/changes/`).
4. Implementá, verificá (`npm run lint && npm run build`) y **archivá** el change (`/opsx-archive`) al quedar verde.
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
- **Estado**: `[x]` completado (2026-10-12)
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
- **Estado**: `[ ]` pendiente
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
- **Estado**: `[ ]` pendiente
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
- **Estado**: `[ ]` pendiente
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
- **Estado**: `[ ]` pendiente
- **Scope**:
  - `components/configurador/ServiceCards.jsx`: paso 1, 7 cards con nombre/descripción/precio ARS o "A cotizar", una seleccionada (RN-CO-01).
  - `components/configurador/ExtrasCards.jsx`: paso 2, 8 toggles; `hosting` con disclaimer visible (RN-HD-03); `maintenance` con "/mes".
  - `components/configurador/QuantityControl.jsx`: +/− con mínimo 1.
  - Estados visuales seleccionado/hover/focus; responsive.
  - Tests: selección única de servicio; toggle de extras; mínimo de cantidad.
- **Dependencias**: `C-06`, `C-05`
- **Governance**: BAJO
- **Leer antes**:
  - `knowledge-base/06_funcionalidades.md` §US-003, §US-004, §US-005
  - `knowledge-base/05_reglas_de_negocio.md` §RN-HD, §RN-CO, §RN-QT

### [C-08] `contact-review-steps`
- **Estado**: `[ ]` pendiente
- **Scope**:
  - `components/configurador/FormStep.jsx`: paso 3, campos nombre/email (obligatorios) + teléfono/descripción (opcionales), validación inline accesible (`aria-invalid`, `aria-describedby`).
  - `components/configurador/ReviewStep.jsx`: paso 4, resumen completo + botones "Editar" por bloque + nota "estimación no vinculante".
  - Incluir campo **honeypot** oculto (base para C-11) y placeholder de botón de envío.
  - Tests: bloqueo de avance sin nombre/email; resumen refleja el estado.
- **Dependencias**: `C-06`, `C-05`
- **Governance**: MEDIO
- **Leer antes**:
  - `knowledge-base/06_funcionalidades.md` §US-006, §US-007
  - `knowledge-base/05_reglas_de_negocio.md` §RN-VL, §RN-PR-07, §RN-CO-02

---

## FASE 4 — Integración y entrega

### [C-09] `pdf-generator`
- **Estado**: `[ ]` pendiente
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
- **Estado**: `[ ]` pendiente
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
- **Estado**: `[ ]` pendiente
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
- **Estado**: `[ ]` pendiente
- **Scope**:
  - Extender `.github/workflows/ci.yml`: verificar que el build emita el chunk del configurador (y mantener las verificaciones de `og:image`/artefactos).
  - Verificar `.env.example` documentado; confirmar `VITE_WEBHOOK_URL` en el entorno del hosting.
  - Configuración de **fallback SPA** en el hosting (Vercel `rewrites` o Netlify `_redirects`) para `/configurador`.
  - Checklist de deploy (P-01 precios, P-02 webhook, P-03 WhatsApp).
  - Actualizar `knowledge-base/README.md` y cerrar `CHANGES.md`.
- **Dependencias**: `C-11`
- **Governance**: MEDIO
- **Leer antes**:
  - `knowledge-base/08_arquitectura_propuesta.md` §Seguridad, §Variables de entorno
  - `knowledge-base/10_preguntas_abiertas.md` §P-01, P-02, P-03, P-07
  - `.github/workflows/ci.yml`

---

## Resumen

| Fase | Changes | Paralelizable |
|------|---------|---------------|
| 1 — Fundaciones | C-01, C-02 | No (secuencial) |
| 2 — Dominio | C-03, C-04, C-05 | C-03 en paralelo a Fase 1 |
| 3 — UI | C-06, C-07, C-08 | C-07 y C-08 tras C-06 |
| 4 — Integración | C-09, C-10 | Sí (tras C-04/C-05) |
| 5 — Cierre | C-11, C-12 | No (secuencial) |

**Total**: 12 changes · **Camino crítico**: 7 · **Gates**: 6

**Primer change recomendado**: `C-01` (foundation-setup)

Para arrancar: `/opsx-propose C-01-foundation-setup`

> **Bloqueantes externos** (no frenan el desarrollo, sí el deploy): confirmar precios ARS (P-01), URL del webhook (P-02) y WhatsApp de respaldo (P-03). Ver `knowledge-base/10_preguntas_abiertas.md`.
