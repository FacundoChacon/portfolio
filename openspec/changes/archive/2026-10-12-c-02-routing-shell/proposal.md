# Proposal

## Why

El **Configurador de Presupuestos Web** debe vivir en una página propia (`/configurador`) sin que el visitante abandone el portfolio. Hoy el sitio es un SPA de una sola vista sin rutas: no hay forma de llegar a una segunda página ni de compartir/deep-linkear una URL. C-01 dejó el `BrowserRouter` montado pero **sin rutas**. Este change convierte esa base en una estructura de rutas real y un punto de entrada desde el portfolio.

## What Changes

- **`src/App.jsx` pasa a ser un shell de rutas** con `<Routes>`:
  - `/` → portfolio (las secciones actuales).
  - `/configurador` → `React.lazy(() => import('./pages/Configurador'))`.
  - `*` → `<Navigate to="/" replace />` (ruta desconocida vuelve a la home).
- **Se extrae la home** a `src/pages/Home.jsx` (mueve `SiteNav` + las secciones desde `App.jsx`), para que `App` quede como router puro.
- **`Suspense`** con un fallback coherente con el tema para el chunk diferido del configurador.
- **Placeholder mínimo de `src/pages/Configurador.jsx`** (título + volver al inicio) para no romper el `lazy`. El layout real es C-06.
- **`src/components/SiteNav.jsx`**: se agrega un CTA **"Armá tu web"** que navega a `/configurador` con navegación client-side (`Link`/`useNavigate`); el logo pasa a `Link` a `/`. Las **anclas de sección de la home se mantienen** como están.
- **Sin cambios rompientes** (**BREAKING**: ninguno).

## Capabilities

### New Capabilities
- `navegacion-del-sitio`: enrutado cliente del sitio — rutas de la home y del configurador, carga diferida de `/configurador`, redirección de rutas desconocidas y acceso al configurador desde la navegación del portfolio.

### Modified Capabilities
- Ninguna.

## Impact

- **Código**: `src/App.jsx` (pasa a router), nuevo `src/pages/Home.jsx`, nuevo `src/pages/Configurador.jsx` (placeholder), `src/components/SiteNav.jsx` (CTA).
- **Bundle**: el configurador se emite como **chunk separado** (lazy), fuera del bundle inicial.
- **Hosting**: recargar `/configurador` directo requiere **fallback SPA** (rewrite a `index.html`). Se **documenta** acá y se **aplica** en C-12 (ver P-07).
- **CI**: se extiende en C-12 para verificar la existencia del chunk del configurador.
