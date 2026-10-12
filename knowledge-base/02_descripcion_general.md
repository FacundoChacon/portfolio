# Descripción General

## Stack tecnológico

| Capa | Tecnología | Versión mínima | Notas |
|------|-----------|----------------|-------|
| Build | Vite | ^5.3.0 | Ya presente en el portfolio |
| UI | React | ^18.3.1 | Ya presente |
| Estilos | Tailwind CSS | ^3.4.4 | Ya presente |
| Iconos | lucide-react | ^0.400.0 | Ya presente; el configurador lo reutiliza |
| Routing | react-router-dom | ^6.x | **NUEVO** — hoy el portfolio no tiene router |
| PDF | @react-pdf/renderer | ^3.x | **NUEVO** — genera el presupuesto en el cliente |
| Lenguaje | JavaScript (ESM) | — | El portfolio NO usa TypeScript |
| CI | GitHub Actions | — | `lint` + `build` + verificación de artefactos |

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
                        │  POST JSON (lead + items + total)
                        ▼
        ┌───────────────────────────────────────┐
        │  Webhook externo (n8n / Zapier / Make) │
        ├───────────────────────────────────────┤
        │  ├─ Persiste en Google Sheets/Notion   │
        │  ├─ Email al dueño (con PDF adjunto)   │
        │  ├─ Auto-reply al prospecto (con PDF)  │
        │  └─ Notificación Telegram/Slack (opt.) │
        └───────────────────────────────────────┘
```

**Decisiones de alto nivel:**
- **Sin backend propio**: el portfolio es estático; el envío se delega a un webhook externo. Migrar a backend propio luego solo cambia la URL destino.
- **SPA con router**: se incorpora `react-router-dom` para habilitar `/configurador` como ruta real. El hosting (Vercel/Netlify) resuelve el fallback SPA a `index.html`.
- **PDF en el cliente**: `@react-pdf/renderer` genera el presupuesto como blob sin servidor; se adjunta vía el webhook.

## Integraciones externas

| Servicio | Propósito | Tipo | Notas |
|----------|-----------|------|-------|
| Webhook (n8n/Zapier/Make) | Recibir el lead y orquestar notificaciones | REST POST | URL en `VITE_WEBHOOK_URL` |
| Google Sheets / Notion / Airtable | Persistir leads | Vía webhook | No accedido directo desde el front |
| SMTP / proveedor email | Email al dueño + auto-reply | Vía webhook | No accedido directo desde el front |
| GitHub Actions | CI (lint + build) | CI | Ya existente; se extiende al nuevo código |

## Servicios de dominio (front, sin API propia)

No hay API REST propia. La lógica de dominio vive en el cliente:

| Módulo | Responsabilidad |
|--------|-----------------|
| `data/configurador.js` | Catálogo de productos y extras (fuente de verdad de precios) |
| `utils/pricing.js` | Cálculo de totales, formateo ARS, cantidades |
| `utils/pdfGenerator.js` | Generación del PDF del presupuesto |
| `utils/webhook.js` | Serialización + POST al webhook + manejo de errores |
| `hooks/useConfigurador.js` | Estado del wizard y transiciones entre pasos |
