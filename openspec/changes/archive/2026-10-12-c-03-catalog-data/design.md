# Design

## Context

C-01 dejó la carpeta `src/data/` (vacía) y C-02 el shell de rutas. Todavía no existe ninguna fuente de verdad de productos: los precios y descripciones viven únicamente en la KB (`04_modelo_de_datos.md`, `05_reglas_de_negocio.md`). C-03 los convierte en datos de la aplicación.

El proyecto es **JavaScript puro** (sin TypeScript) y **sin backend**: el catálogo es un módulo de constantes que el resto del front importa.

## Goals / Non-Goals

**Goals**
- Una única fuente de verdad de tipos de sitio y extras, editable sin tocar componentes.
- Codificar las tres semánticas de precio que la UI y el cálculo deben respetar: cotizable (null), sin costo (0) y recurrente (mensual).
- Exponer metadatos (moneda, categorías) y el texto legal de hosting.

**Non-Goals**
- Cálculo de subtotales/totales → C-04 (`pricing-engine`).
- Preselección, estado del wizard y render de tarjetas → C-05..C-08.
- Formateo de moneda en pantalla → C-04/UI.
- Validación de tipos en runtime (no hay TS ni schema runtime).

## Decisions

### D1 — Un único módulo de datos
Todo el catálogo vive en `src/data/configurador.js`, que exporta los arrays y las constantes. Sin factory, sin clases, sin split en varios archivos: el catálogo es pequeño (7 + 8 ítems) y un solo módulo es más fácil de editar (que es el objetivo).

### D2 — JavaScript puro documentado con JSDoc
No se introduce TypeScript ni validación de schema en runtime. El *shape* se documenta con `@typedef`/`@type` de JSDoc, que da autocompletado en el editor sin agregar build ni dependencias.

### D3 — El icono es un identificador, no un componente
Cada servicio declara `icon` como **string** con el nombre del icono de `lucide-react` (por ejemplo `"ShoppingCart"`). Esto mantiene el catálogo como dato serializable y desacoplado de React; la UI resuelve el componente (C-07). Los extras **no** llevan `icon` (fuera del contrato de la KB).

### D4 — Precios como enteros de ARS
`priceARS` es un **entero** en pesos argentinos, sin centavos. El formateo con `Intl.NumberFormat('es-AR', ...)` es responsabilidad de C-04/UI (RN-PR-01); el dato guarda el número crudo.

### D5 — "Sistema a medida" cotizable
Se modela con `priceARS: null` y `quotable: true`. El resto de los servicios lleva `priceARS` numérico y `quotable: false`. La UI debe tratar `null` como "A cotizar" y nunca formatearlo como número (RN-CO-01).

### D6 — "Hosting + Dominio" sin costo y con disclaimer explícito
Se modela con `priceARS: 0`, `category: 'infra'` y `disclaimer: HOSTING_DISCLAIMER`. El texto se exporta como constante nombrada (no inline) para reutilizarlo en el PDF (C-09) sin duplicarlo. Corresponde a RN-HD-01/02.

### D7 — `recommended: true` solo en "Hosting + Dominio"
Decisión del dueño del producto: el único extra preseleccionado es el que **no** infla el total (cuesta 0). Así el visitante ve un total limpio al abrir el configurador y suma lo que quiera. El resto de los extras queda en `false`. El consumo de `recommended` (preselección) es de C-05.

### D8 — Constantes auxiliares exportadas
Se exportan `CURRENCY` (`'ARS'`), `CATEGORIES` (los 5 valores válidos) y `HOSTING_DISCLAIMER`, para que C-04..C-09 no repitan literales.

### D9 — Smoke test de forma en Node
Un script `scripts/verify-catalog.mjs` importa el módulo y valida el contrato (conteos, ids únicos, coherencia `priceARS`/`quotable`, categorías válidas, `recommended` único, moneda). Aprovecha que `package.json` tiene `"type": "module"` y que el módulo no importa nada de React. Se expone como `npm run verify:catalog` y se suma a `npm run ci`.

## Risks / Trade-offs

- **Precios placeholder (P-01)**: los valores ARS son de referencia hasta que Facundo los confirme. Mitigación: viven en un solo archivo y hay un solo lugar que tocarlos.
- **Sin tipado en runtime**: un typo en un `id`, `category` o `icon` no rompe el build. Mitigación: el smoke test (D9) valida el shape y los conjuntos cerrados; los iconos inválidos se detectan visualmente en C-07.
- **Icono como string**: requiere un mapa nombre→componente en la UI; a cambio, el catálogo queda desacoplado y testeable en Node.

## Migration Plan

No aplica: es un módulo nuevo y no hay datos persistidos ni consumidores previos.

## Open Questions

- ¿Cuáles son los precios ARS definitivos? (P-01, bloquea el deploy, no el desarrollo).
