# Proposal

## Why

El configurador necesita una fuente de verdad única para los productos y precios que ofrece. Hoy no existe: sin catálogo, el motor de cálculo (C-04) y toda la UI del wizard (C-05..C-08) no tienen de dónde leer servicios, extras ni sus reglas de precio, y cualquier cambio de precio obligaría a tocar componentes.

## What Changes

- Nuevo módulo de catálogo `src/data/configurador.js` con `services` (7 tipos de sitio) y `extras` (8 extras) como constantes versionadas.
- Cada **servicio** expone `id` (kebab-case, único y estable), `name`, `description`, `priceARS` (`number | null`), `quotable`, `tag` (opcional) e `icon` (nombre de icono lucide-react).
- Cada **extra** expone `id`, `name`, `description`, `priceARS`, `category`, `recurring`, `disclaimer` (opcional) y `recommended`.
- "Sistema a medida" se modela como **cotizable**: `priceARS: null` + `quotable: true` ("A cotizar", no suma al total).
- "Hosting + Dominio" se modela con `priceARS: 0` + `disclaimer` textual (solo gestión técnica; el costo de hosting y dominio queda a cargo del cliente).
- `recommended: true` **únicamente** en "Hosting + Dominio"; el resto en `false`.
- Se exportan además `CURRENCY = 'ARS'`, `CATEGORIES` y el texto del disclaimer de hosting.
- Sin cambios de comportamiento en la UI todavía: los consumidores llegan en C-04..C-09.

## Capabilities

### New Capabilities
- `catalogo-del-configurador`: el catálogo de productos que el configurador ofrece (tipos de sitio y extras), con sus atributos, categorías y semántica de precio (cotizable, sin costo, recurrente, recomendado).

### Modified Capabilities
<!-- Ninguna: no hay capacidades existentes cuyos requisitos cambien. -->

## Impact

- **Código**: nuevo `src/data/configurador.js` (la carpeta `src/data/` ya existe desde C-01).
- **Consumidores futuros**: C-04 (`pricing-engine`), C-05..C-08 (wizard y UI), C-09 (PDF).
- **Dependencias**: ninguna nueva.
- **Datos**: los precios son valores de referencia en ARS pendientes de confirmación (P-01); se editan sin tocar la UI.
