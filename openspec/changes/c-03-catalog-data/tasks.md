# Tasks

## 1. Catálogo de tipos de sitio

- [x] 1.1 Crear `src/data/configurador.js` y exportar `services` con los 7 tipos de sitio, cada uno con `id`, `name`, `description`, `priceARS`, `quotable`, `icon` y `tag` cuando corresponda.
- [x] 1.2 Completar `description` de cada tipo (qué incluye y para quién), en español.
- [x] 1.3 Modelar "Sistema a medida" con `priceARS: null` y `quotable: true`; el resto con precio numérico y `quotable: false`.
- [x] 1.4 Definir el `icon` (nombre de icono lucide-react) de cada tipo y las `tag` ("Más elegido" en Landing Page, "A cotizar" en Sistema a medida).

## 2. Catálogo de extras

- [x] 2.1 Exportar `extras` con los 8 extras, cada uno con `id`, `name`, `description`, `priceARS`, `category`, `recurring` y `recommended`.
- [x] 2.2 Marcar `maintenance` con `recurring: true`; el resto con `recurring: false`.
- [x] 2.3 Modelar `hosting` con `priceARS: 0`, `category: 'infra'`, `disclaimer: HOSTING_DISCLAIMER` y `recommended: true`; el resto con `recommended: false`.

## 3. Metadatos y texto legal

- [x] 3.1 Exportar `CURRENCY = 'ARS'`.
- [x] 3.2 Exportar `CATEGORIES` con los 5 valores válidos (`contenido`, `tecnico`, `crecimiento`, `soporte`, `infra`).
- [x] 3.3 Exportar `HOSTING_DISCLAIMER` con el texto de RN-HD-02 (gestión técnica; costo de hosting y dominio a cargo del cliente).
- [x] 3.4 Documentar el shape del catálogo con un bloque JSDoc (`@typedef` de `Service` y `Extra`).

## 4. Verificación

- [x] 4.1 Crear `scripts/verify-catalog.mjs` que valide: 7 servicios y 8 extras, `id` únicos y estables, coherencia `priceARS`/`quotable`, `category` dentro de `CATEGORIES`, `recommended` solo en "Hosting + Dominio", `priceARS` numérico ≥ 0 o `null`, y `CURRENCY === 'ARS'`.
- [x] 4.2 Agregar el script `verify:catalog` a `package.json` e incorporarlo a `ci`.
- [x] 4.3 Ejecutar `npm run verify:catalog` (verde) y `npm run ci` (lint + verificación + build verdes).
