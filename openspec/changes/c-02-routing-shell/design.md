# Design

## Context

Ver `proposal.md — Why`. Estado actual relevante:

- C-01 dejó `BrowserRouter` montado en `src/main.jsx`, pero **sin `<Routes>`**: `App.jsx` renderiza directamente `SiteNav` + las secciones (`Hero`, `About`, `Projects`, `Stack`, `Contact`) dentro de un `<main>`.
- `SiteNav.jsx` usa anclas (`#presentacion`, `#quien-soy`, `#proyectos`, `#stack`, `#contacto`) y dos acciones: "CV" (a `/cv.pdf`) y "Hablemos" (a `#contacto`). No conoce el router.
- El sitio es estático (`vite build`), sin backend. El hosting definitivo está pendiente (P-07).
- Restricciones: JavaScript (no TS), CI verde, no romper la home actual.

## Goals / Non-Goals

**Goals:**
- Que `App.jsx` sea un shell de rutas: `/` → home, `/configurador` → página lazy, `*` → redirect a `/`.
- Mantener el render de `/` **idéntico** al actual.
- Ofrecer un CTA que llegue al configurador con navegación client-side.
- Dejar un placeholder de `Configurador` que permita que `lazy` funcione (el layout es C-06).

**Non-Goals:**
- Construir el layout/pasos del configurador (C-06…C-08).
- Aplicar la configuración de fallback SPA en el hosting (C-12); acá solo se **documenta**.
- Manejar scroll a hash entre rutas (las anclas viven solo en `/`).
- Página 404 dedicada (se resuelve con redirect a `/`, coherente con Flujo 2).

## Decisions

### D1 — `App.jsx` como router puro; extraer la home a `src/pages/Home.jsx`
**Decisión**: mover el contenido actual de `App.jsx` (SiteNav + `<main>` con las secciones) a `src/pages/Home.jsx`, y dejar `App.jsx` con solo `<Routes>`.
**Rationale**: separa "shell de rutas" de "contenido de la home"; encaja con la carpeta `pages/` creada en C-01 y con el patrón *container vs presentational*.
**Alternativa descartada**: dejar las secciones inline en `App.jsx` y solo envolver con `Routes` — mezcla responsabilidades y dificulta C-06.

### D2 — `React.lazy` + `Suspense` solo en la ruta del configurador
**Decisión**: `const Configurador = lazy(() => import('./pages/Configurador'))`, envuelto en `<Suspense fallback={...}>` a nivel de la ruta.
**Rationale**: la home no debe cargar el configurador (ni, más adelante, la lib de PDF). Genera un chunk separado y verificable en el build.
**Trade-off**: aparece un estado de carga breve la primera vez; se mitiga con un fallback con la estética del tema.

### D3 — Rutas desconocidas → `<Navigate to="/" replace />`
**Decisión**: la ruta `*` redirige a `/` (sin página 404 propia).
**Rationale**: coincide con el caso de error del Flujo 2 ("ruta desconocida → 404 amistoso" = volver al portfolio) y evita una pantalla muerta.

### D4 — CTA en `SiteNav` con `Link`; anclas de la home intactas
**Decisión**: agregar `<Link to="/configurador">` ("Armá tu web"); convertir el logo `{"<FC/>"}` a `<Link to="/">`. Los enlaces de sección (`#...`) y "Hablemos" quedan como `<a>`.
**Rationale**: US-001 CA-1 pide un CTA visible que lleve al configurador; las anclas solo tienen sentido dentro de `/`, donde ya se está.
**Alternativa descartada**: convertir todas las anclas a `Link to="/#..."` — requeriría manejo de scroll a hash y no aporta para C-02.

### D5 — Placeholder de `Configurador.jsx`
**Decisión**: crear un componente mínimo (título + botón/enlace "Volver al inicio") que exporte `default`. Se reemplaza por el layout real en C-06.
**Rationale**: `lazy` necesita un módulo con default export; mantiene el change acotado y el chunk verificable.

### D6 — Fallback SPA: documentar ahora, aplicar en C-12
**Decisión**: dejar asentado que recargar `/configurador` directo exige un rewrite de todas las rutas a `/index.html` en el hosting. No se configura acá.
**Rationale**: el hosting final es una incógnita abierta (P-07). `vite preview` ya sirve el fallback SPA, así que la verificación local es posible sin tocar el hosting.

## Risks / Trade-offs

- **Recarga directa de `/configurador` en producción** sin fallback → 404 del hosting. Mitigación: documentado (D6) y aplicado en C-12.
- **`SiteNav` fuera de `/`**: si algún día el nav se renderiza en `/configurador`, las anclas `#...` no navegarían a la home. Mitigación: `SiteNav` queda dentro de `Home`; el configurador tendrá su propio header (C-06).
- **Falla al descargar el chunk diferido** → fallback permanente. Mitigación: fallback con estética; un error boundary real puede sumarse en C-11 si se considera necesario.
- **Chunk en blanco intermitente** con red lenta → Mitigación: fallback visible (D2).

## Migration Plan

1. **Apply**: crear `pages/Home.jsx` y `pages/Configurador.jsx` → refactor de `App.jsx` a `<Routes>` → adaptar `SiteNav.jsx` → `npm run lint` + `npm run build` → verificar chunk y navegación.
2. **Deploy**: cambio aditivo (nueva URL); apto para publicar. Sin el fallback del hosting, `/configurador` solo funciona navegando desde la home (no por recarga directa) hasta C-12.
3. **Rollback**: revertir `App.jsx` al render directo, borrar `pages/Home.jsx` y `pages/Configurador.jsx`, revertir `SiteNav.jsx`.

## Open Questions

- ¿Cuál es el hosting final (Vercel / Netlify / otro)? Define el formato del fallback SPA (P-07). Se difiere a C-12.
