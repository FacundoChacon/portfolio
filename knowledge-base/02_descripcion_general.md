# Descripción General

## Stack tecnológico

| Capa | Tecnología | Versión mínima | Notas |
|------|-----------|----------------|-------|
| Build | Vite | ^5.3.0 | Ya presente en el portfolio |
| UI | React | ^18.3.1 | Ya presente |
| Estilos | Tailwind CSS | ^3.4.4 | Ya presente |
| Iconos | lucide-react | ^0.400.0 | Ya presente; el configurador lo reutiliza |
| Routing | react-router-dom | ^7.x | Rutas `/` y `/configurador` |
| PDF | @react-pdf/renderer | ^4.9 | Generador listo pero **no integrado al envío** (su chunk no entra al build) |
| Lenguaje | JavaScript (ESM) | — | El portfolio NO usa TypeScript |
| CI | GitHub Actions | — | `npm run ci` (lint + verificaciones + tests + build) + verificación de artefactos |
| Hosting | Vercel | — | `www.facucode.dev`, deploy automático a `main`; cabeceras y CSP en `vercel.json` |

> **Nota de coherencia**: el prototipo de referencia (`Downloads/constructor-de-presupuestos-web`, Next.js 16 + TS + Tailwind 4) es solo inspiración visual/lógica. El configurador se implementa con el stack **real del portfolio** (React 18 + Vite + Tailwind 3 + JS).

## Arquitectura general

```
┌──────────────────────────────────────────────────────────┐
│                    facucode.dev (estático)                │
│                                                          │
│  /                    ─── Portfolio (SPA existente)       │
│  /configurador        ─── Configurador (NUEVO)            │
│                                                          │
│  React 18 + Vite + Tailwind 3                             │
│  react-router-dom (BrowserRouter + fallback SPA)          │
└───────────────────────┬──────────────────────────────────┘
                        │  POST JSON `text/plain` (lead: selección + contacto, sin importes)
                        ▼
        ┌───────────────────────────────────────┐
        │  Google Apps Script (webhook)          │
        ├───────────────────────────────────────┤
        │  ├─ Guard v3 (chequeo de `source`)     │
        │  ├─ Persiste en la hoja "Leads"        │
        │  └─ Email al dueño                     │
        └───────────────────────────────────────┘
```

**Decisiones de alto nivel:**
- **Sin backend propio**: el portfolio es estático; el envío se delega a un webhook externo. Migrar a backend propio luego solo cambia la URL destino.
- **SPA con router**: se incorpora `react-router-dom` para habilitar `/configurador` como ruta real. Vercel resuelve el fallback SPA a `index.html` mediante `rewrites` en `vercel.json`.
- **PDF en el cliente (no integrado)**: `@react-pdf/renderer` puede generar el presupuesto como blob sin servidor, pero hoy el envío no lo adjunta (`pdf: null`).

## Integraciones externas

| Servicio | Propósito | Tipo | Notas |
|----------|-----------|------|-------|
| Google Apps Script (webhook) | Recibir el lead, escribir en la hoja "Leads" y avisar por email | REST POST (302 a `script.googleusercontent.com`) | URL en `VITE_WEBHOOK_URL`; hosts fijados en la CSP (`connect-src`) |
| Google Sheets | Persistir leads (hoja "Leads") | Vía Apps Script | No accedido directo desde el front |
| Email (Apps Script) | Email al dueño | Vía Apps Script | No accedido directo desde el front |
| GitHub Actions | CI (`npm run ci` + artefactos) | CI | Gate de cada push/PR a `main` |

## Servicios de dominio (front, sin API propia)

No hay API REST propia. La lógica de dominio vive en el cliente:

| Módulo | Responsabilidad |
|--------|-----------------|
| `data/configurador.js` | Catálogo de productos y extras (fuente de verdad; sin precios) |
| `utils/summary.js`, `utils/review.js`, `utils/wizard.js`, `utils/wizardView.js` | Resumen de la selección, revisión y estado del wizard (puros) |
| `utils/pdfGenerator.js` | Generación del PDF del presupuesto |
| `utils/webhook.js` | Serialización + POST al webhook + manejo de errores |
| `hooks/useConfigurador.js` | Estado del wizard y transiciones entre pasos |
