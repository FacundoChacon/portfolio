# Proposal

## Why

El portfolio actual es un SPA **sin router** y sin las piezas mínimas para alojar una página aparte. El **Configurador de Presupuestos Web** (`/configurador`) necesita una base común: enrutado, una librería de generación de PDF, un contrato estable de variables de entorno y una estructura de carpetas donde montar el resto de los changes (C-02…C-12). Sin esta fundación, cada change posterior improvisaría su propio esqueleto y el contrato de configuración.

Este change es deliberadamente **fundacional**: no agrega comportamiento visible al usuario; habilita que los siguientes lo hagan.

## What Changes

- **Nuevas dependencias**: `react-router-dom` (enrutado cliente) y `@react-pdf/renderer` (generación de PDF en el cliente).
- **Provider de router**: se envuelve la app en `BrowserRouter` dentro de `src/main.jsx`. Todavía **no** se definen rutas (eso es C-02).
- **Contrato de entorno**: se crea `.env.example` con `VITE_WEBHOOK_URL`, `VITE_WHATSAPP_NUMBER`, `VITE_CONTACT_EMAIL`, `VITE_APP_URL` (todas públicas; ninguna credencial).
- **Estructura de carpetas**: `src/pages/`, `src/components/configurador/`, `src/utils/`, `src/data/` (con `.gitkeep`).
- **Sin cambios rompientes** (**BREAKING**: ninguno).
- El CI existente debe permanecer verde (`npm run lint` + `npm run build`).

## Capabilities

> Este change declara `skip_specs: true` (tooling/infraestructura sin cambio de comportamiento observable). No crea ni modifica capabilities; solo habilita a los changes que sí lo hacen.

### New Capabilities
- Ninguna.

### Modified Capabilities
- Ninguna.

## Impact

- **Dependencias**: `package.json` / `package-lock.json` incorporan `react-router-dom` y `@react-pdf/renderer`.
- **Código**: `src/main.jsx` (provider `BrowserRouter`).
- **Nuevos artefactos**: `.env.example`; carpetas `src/pages/`, `src/components/configurador/`, `src/utils/`, `src/data/`.
- **CI**: `.github/workflows/ci.yml` debe seguir pasando sin cambios en este change (la verificación de artefactos del configurador se agrega en C-12).
- **Riesgo**: bajo; cambio aditivo. Único punto de atención: que `BrowserRouter` no altere el render actual del portfolio (aún sin rutas definidas, el contenido se renderiza igual).
