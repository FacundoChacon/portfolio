# Modelo de Datos

> El sistema **no tiene base de datos propia**. Las "entidades" se modelan como **estructuras en memoria del cliente** (catálogo + estado del wizard + payload del lead). La persistencia real ocurre en el servicio externo (Sheets/Notion), cuya forma la define el webhook.

## Dominios

| Dominio | Descripción |
|---------|-------------|
| Catálogo | Productos (tipos de sitio) y extras disponibles, sin precios |
| Configuración | Estado del wizard que arma el visitante paso a paso |
| Presupuesto | Selección (servicio, cantidad y extras); sin cálculo de importes |
| Lead | Payload final que se envía al webhook |

## ERD (relación lógica)

```
Catalog
 ├── Service*            (1..N productos)
 └── Extra*              (1..N extras)

QuoteConfig (estado del wizard)
 ├── serviceId  ────────► Service.id        (0..1 seleccionado)
 ├── extras[]   ────────► Extra.id          (0..N seleccionados)
 ├── quantity : number                       (>= 1)
 └── form : ContactForm                      (datos del prospecto)
        │
        ▼
   LeadPayload  ──POST──►  Webhook externo
   (servicio, cantidad, extras, contacto y meta; sin importes)
```

## Entidades

### Service (producto)
- `id`: string (kebab-case, único) — ej. `"ecommerce"`
- `name`: string — ej. `"E-commerce"`
- `description`: string — qué incluye y para quién
- `tag`: string (opcional) — ej. `"Más elegido"`
- `icon`: string — nombre del icono lucide-react

**Catálogo vigente** (sin precios; ver `openspec/specs/catalogo-del-configurador`):

| id | name | tag |
|----|------|-----|
| `landing` | Landing Page | Más elegido |
| `onepage` | One Page | — |
| `ecommerce` | E-commerce | — |
| `corporate` | Web Corporativa | — |
| `blog` | Blog | — |
| `portfolio` | Portfolio | — |
| `custom` | Sistema a medida | — |

### Extra (add-on)
- `id`: string (kebab-case, único)
- `name`: string
- `description`: string
- `category`: enum — `"contenido" | "tecnico" | "crecimiento" | "soporte" | "infra"`
- `disclaimer`: string (opcional) — texto legal/aclaratorio (Hosting/dominio)
- `recommended`: boolean — para preselección sugerida (solo `hosting`)

**Catálogo vigente** (sin precios ni recurrencia):

| id | name | category | notas |
|----|------|----------|-------|
| `seo` | SEO inicial | crecimiento | — |
| `copy` | Copywriting | contenido | — |
| `cms` | CMS / Blog | tecnico | — |
| `i18n` | Multi-idioma | tecnico | — |
| `clients` | Área de clientes (auth) | tecnico | — |
| `whatsapp` | Integración WhatsApp/CRM | crecimiento | — |
| `maintenance` | Mantenimiento mensual | soporte | — |
| `hosting` | Hosting + Dominio | infra | `disclaimer` (ver RN-HD), `recommended: true` |

### QuoteConfig (estado del wizard)
- `step`: number (0..3) — paso actual
- `serviceId`: string | null
- `extras`: string[] — ids de extras seleccionados
- `quantity`: number — unidades del servicio (>= 1)
- `form`: `{ name, email, phone?, project? }`
- `submitted`: boolean
- `status`: enum — `"idle" | "submitting" | "success" | "error"`

### LeadPayload (payload del webhook)
```jsonc
{
  "submittedAt": "ISO-8601",          // timestamp de envío
  "source": "facucode.dev/configurador",
  "service": { "id": "ecommerce", "name": "E-commerce" },
  "quantity": 1,
  "extras": [
    { "id": "seo", "name": "SEO inicial" }
  ],
  "contact": { "name": "Martina", "email": "m@marca.com", "phone": "+54...", "project": "..." },
  "meta": { "userAgent": "...", "referrer": "..." }
}
```

## Constraints e índices

- `Service.id` y `Extra.id` son únicos y estables (usados como claves de React y de payload).
- `quantity >= 1` (entero). El botón "-" se deshabilita en 1.
- `extras` no admite duplicados (selección por toggle).
- `email` debe ser válido antes de permitir el envío (paso 3).
- El payload no lleva importes (`priceARS`, `subtotal`, `total`, `currency`, `hasQuotable` y `recurring` no existen).

## Seed data inicial

Todo el catálogo (7 servicios + 8 extras) **es** el seed: vive en `src/data/configurador.js` como arrays de constantes versionadas. No hay migración ni carga en DB.
