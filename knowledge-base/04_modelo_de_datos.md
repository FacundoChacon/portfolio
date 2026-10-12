# Modelo de Datos

> El sistema **no tiene base de datos propia**. Las "entidades" se modelan como **estructuras en memoria del cliente** (catálogo + estado del wizard + payload del lead). La persistencia real ocurre en el servicio externo (Sheets/Notion), cuya forma la define el webhook.

## Dominios

| Dominio | Descripción |
|---------|-------------|
| Catálogo | Productos (tipos de sitio) y extras disponibles, con precios en ARS |
| Configuración | Estado del wizard que arma el visitante paso a paso |
| Presupuesto | Cálculo de subtotales, cantidad y total |
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
   (incluye items[], subtotal, total, metadata)
```

## Entidades

### Service (producto)
- `id`: string (kebab-case, único) — ej. `"ecommerce"`
- `name`: string — ej. `"E-commerce"`
- `description`: string — qué incluye y para quién
- `priceARS`: number | null — `null` cuando es "a cotizar" (Sistema a medida)
- `quotable`: boolean — `true` si el precio es "a cotizar"
- `tag`: string (opcional) — ej. `"Más elegido"`
- `icon`: string — nombre del icono lucide-react

**Catálogo v1.0** (precios de referencia, ver `10_preguntas_abiertas.md`):

| id | name | priceARS | tag |
|----|------|----------|-----|
| `landing` | Landing Page | 250000 | Más elegido |
| `onepage` | One Page | 180000 | — |
| `ecommerce` | E-commerce | 600000 | — |
| `corporate` | Web Corporativa | 450000 | — |
| `blog` | Blog | 300000 | — |
| `portfolio` | Portfolio | 220000 | — |
| `custom` | Sistema a medida | null | A cotizar |

### Extra (add-on)
- `id`: string (kebab-case, único)
- `name`: string
- `description`: string
- `priceARS`: number — `0` para "sin costo" (hosting/dominio)
- `category`: enum — `"contenido" | "tecnico" | "crecimiento" | "soporte" | "infra"`
- `recurring`: boolean — `true` si es mensual (Mantenimiento)
- `disclaimer`: string (opcional) — texto legal/aclaratorio (Hosting/dominio)
- `recommended`: boolean — para preselección sugerida

**Catálogo v1.0** (precios de referencia):

| id | name | priceARS | category | notas |
|----|------|----------|----------|-------|
| `seo` | SEO inicial | 120000 | crecimiento | — |
| `copy` | Copywriting | 90000 | contenido | — |
| `cms` | CMS / Blog | 150000 | tecnico | — |
| `i18n` | Multi-idioma | 180000 | tecnico | — |
| `clients` | Área de clientes (auth) | 250000 | tecnico | — |
| `whatsapp` | Integración WhatsApp/CRM | 80000 | crecimiento | — |
| `maintenance` | Mantenimiento mensual | 60000 | soporte | `recurring: true` |
| `hosting` | Hosting + Dominio | 0 | infra | `disclaimer` (ver RN-HD) |

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
  "service": { "id": "ecommerce", "name": "E-commerce", "priceARS": 600000 },
  "quantity": 1,
  "extras": [
    { "id": "seo", "name": "SEO inicial", "priceARS": 120000, "recurring": false }
  ],
  "hasQuotable": false,                // true si incluyó "Sistema a medida"
  "subtotal": 720000,
  "total": 720000,
  "currency": "ARS",
  "contact": { "name": "Martina", "email": "m@marca.com", "phone": "+54...", "project": "..." },
  "meta": { "userAgent": "...", "referrer": "..." }
}
```

## Constraints e índices

- `Service.id` y `Extra.id` son únicos y estables (usados como claves de React y de payload).
- `quantity >= 1` (entero). El botón "-" se deshabilita en 1.
- `extras` no admite duplicados (selección por toggle).
- `email` debe ser válido antes de permitir el envío (paso 3).
- El total nunca es negativo; extras con `priceARS: 0` no alteran el total.

## Seed data inicial

Todo el catálogo (7 servicios + 8 extras) **es** el seed: vive en `src/data/configurador.js` como arrays de constantes versionadas. No hay migración ni carga en DB.
