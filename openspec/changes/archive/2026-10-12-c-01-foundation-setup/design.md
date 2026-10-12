# Design

## Context

Ver `proposal.md — Why` para la motivación. Estado actual relevante:

- El portfolio es un SPA **React 18 + Vite 5 + Tailwind 3 + JavaScript (ESM)**, montado con `ReactDOM.createRoot` en `src/main.jsx`, **sin router**. La navegación es por anclas (`#presentacion`, `#quien-soy`, …) dentro de `App.jsx`.
- No hay backend ni base de datos; el deploy es estático (CI en GitHub Actions: `lint` + `build`).
- El roadmap canónico (`CHANGES.md`) define C-01 como el primer change y los posteriores (C-02…C-12) asumen ya presentes: router, dependencia de PDF, contrato de entorno y carpetas.
- Restricciones: **no TypeScript**, mantener CI verde, no romper el render actual del portfolio.

## Goals / Non-Goals

**Goals:**
- Dejar instaladas y disponibles las dos librerías nuevas (`react-router-dom`, `@react-pdf/renderer`) sin alterar el comportamiento actual.
- Establecer el provider de enrutado en el punto de entrada (`BrowserRouter`) para que C-02 solo tenga que declarar `<Routes>`.
- Fijar un contrato único de variables de entorno públicas (`VITE_*`) documentado en `.env.example`.
- Crear la estructura de directorios donde los changes siguientes montan su código.

**Non-Goals:**
- Definir rutas o la página `/configurador` (eso es C-02).
- Importar/ejecutar la librería de PDF (se usa recién en C-09, con import dinámico).
- Tocar el CI (la verificación del configurador llega en C-12).
- Configurar el fallback SPA del hosting (C-02 documenta, C-12 aplica).

## Decisions

### D1 — Router: `react-router-dom` (y no hash routing / MPA)
**Decisión**: incorporar `react-router-dom` con `BrowserRouter`.
**Alternativas**: hash routing (`#/configurador`), multi-page Vite, modal.
**Rationale**: URLs limpias y patrón estándar; el hosting (Vercel/Netlify) resuelve el fallback SPA. Coincide con la decisión DD-02 de la KB.
**Trade-off**: se agrega una dependencia (~) y se depende del fallback del hosting para recargas directas (se resuelve en C-02/C-12, no aquí).

### D2 — Montar `BrowserRouter` en C-01, declarar rutas en C-02
**Decisión**: envolver la app en `BrowserRouter` ya en este change, dejando `App.jsx` sin `<Routes>` todavía.
**Rationale**: separa "infra lista" (C-01) de "comportamiento de rutas" (C-02), manteniendo C-01 sin cambio observable. `BrowserRouter` sin rutas renderiza el contenido idéntico al actual.
**Alternativa descartada**: hacer router + rutas juntos — rompería la granularidad del roadmap y mezclaría tooling con comportamiento (que además requeriría spec).

### D3 — `@react-pdf/renderer` se instala ahora, se importa después
**Decisión**: agregar la dependencia en C-01, pero **no** importarla hasta C-09, y allí de forma **dinámica** (`import()`).
**Rationale**: la instalación no afecta el bundle; el import dinámico evita engordar el bundle inicial del portfolio. Instalar ahora deja el `package.json` estable para los changes siguientes.
**Alternativa descartada**: instalar en C-09 — funcionaría, pero centraliza todas las dependencias del feature en la fase fundacional.

### D4 — Contrato de entorno público y sin secretos
**Decisión**: `.env.example` documenta solo variables `VITE_*` públicas: `VITE_WEBHOOK_URL`, `VITE_WHATSAPP_NUMBER`, `VITE_CONTACT_EMAIL`, `VITE_APP_URL`.
**Rationale**: en Vite, `VITE_*` queda embebido en el bundle (público). No debe contener credenciales; el webhook valida por su lado.
**Trade-off**: la URL del webhook es descubrible; se mitiga con validación/rate limiting del lado del webhook.

### D5 — Estructura de carpetas
**Decisión**: crear `src/pages/`, `src/components/configurador/`, `src/utils/`, `src/data/` con `.gitkeep` para versionar las vacías.
**Rationale**: coincide con la estructura de `knowledge-base/08_arquitectura_propuesta.md`; evita que cada change posterior improvise ubicaciones.

### D6 — Versiones
**Decisión**: instalar la **última estable** vigente de cada librería al momento del apply (react-router-dom ≥ 6; @react-pdf/renderer ≥ 3), registrando la versión resuelta en `package.json`. No se fija un pin exacto en este documento.
**Rationale**: evita documentar una versión que puede quedar obsoleta; el lockfile (`package-lock.json`) es la fuente de verdad.

## Risks / Trade-offs

- **Bundle inicial más grande por `@react-pdf/renderer`** → Mitigación: se importa dinámicamente en C-09; en C-01 no se importa.
- **`BrowserRouter` sin rutas podría cambiar el render si algo asume URLs relativas** → Mitigación: el portfolio usa anclas y assets absolutos (`/profile.webp`); verificar build + preview con el mismo aspecto.
- **Peer deps con React 18** → Mitigación: verificar instalación limpia (`npm install` sin `--force`) y `npm run build` verde.
- **Confusión de secretos en `.env`** → Mitigación: `.env.example` con comentario explícito de que son públicas; `.env` ya está ignorado por `.gitignore`.
- **Recarga directa de `/configurador` en producción** → No aplica en C-01 (no hay ruta); se trata en C-02 (documentar) y C-12 (configurar fallback).

## Migration Plan

1. **Apply**: `npm install react-router-dom @react-pdf/renderer` → crear `.env.example` y carpetas → envolver `main.jsx` con `BrowserRouter` → verificar `npm run lint` y `npm run build`.
2. **Deploy**: sin cambio visible para el usuario; apto para publicar sin riesgo.
3. **Rollback**: revertir `src/main.jsx`, eliminar `.env.example` y carpetas vacías, y `npm uninstall react-router-dom @react-pdf/renderer`.

## Open Questions

- ¿El sitio se publica en la raíz del dominio (`/`) o bajo un subpath? Si fuera subpath, habría que fijar `base` en `vite.config.js`. Se difiere; se asume raíz (coherente con `canonical`/`og:url` = `https://www.facucode.dev/`).
