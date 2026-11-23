# Tasks

> Strict TDD: cada tarea de código arranca con un test que falla (RED) y se verifica con `npm test` (`node --test "scripts/**/*.test.mjs"`). Antes de tocar un archivo existente, correr sus tests y registrar la línea base (safety net).

## 1. Detección de manejadores inline sin falsos positivos (D2)

- [x] 1.1 Safety net: correr `node --test scripts/route-html.test.mjs scripts/deploy-config.test.mjs` y registrar cuántos tests pasan (todos deben estar en verde).
- [x] 1.2 RED: en `scripts/route-html.test.mjs` agregar tests de `extractHeadMeta` que **no** marquen `on` dentro de valores: `<meta name="description" content="Guía de onboarding=fácil">`, `<a href="/x?on=1&onda=2">` y un valor con `>` seguido de `onfoo=` (`<meta content="a > b onfoo=1">`) → `inlineHandlers` vacío. Verificar que al menos el caso `onboarding=` falla con la regex actual.
- [x] 1.3 RED: agregar tests que **sí** detecten handlers reales: `onclick="x()"`, `onload = "x()"` (espacios), `onerror=x` (sin comillas) y `ONCLICK="x()"` (mayúsculas, devuelto como `onclick`). Verificar que el caso `ONCLICK` falla hoy (falso negativo de la regex actual).
- [x] 1.4 GREEN: en `scripts/lib/route-html.mjs` reemplazar la regex de `inlineHandlers` por la tokenización de etiqueta + atributos de D2. Verificar: `node --test scripts/route-html.test.mjs` en verde, incluido el test existente `detecta scripts inline y atributos on*`.
- [x] 1.5 REFACTOR: extraer las regex de etiqueta/atributo a constantes con nombre y un comentario breve; verificar `node --test scripts/route-html.test.mjs scripts/deploy-config.test.mjs` en verde (`checkBuiltPages` consume `inlineHandlers`).

## 2. Imagen social validada contra la fuente única (D3, parte de código)

- [x] 2.1 RED: en `scripts/deploy-config.test.mjs` agregar un test de `checkBuiltPages` donde `og:image` (y otro para `twitter:image`) es una URL absoluta del dominio pero distinta de la de `src/data/seo.js` (p. ej. `https://www.facucode.dev/otra.png`) → debe reportar un error que nombre la URL de la página, la etiqueta y el valor encontrado. Verificar que falla con la implementación actual (`startsWith`).
- [x] 2.2 GREEN: en `scripts/lib/deploy-config.mjs` importar `resolveRouteMeta` de `../../src/data/seo.js` y exigir `og:image` y `twitter:image` iguales a `resolveRouteMeta(new URL(url).pathname).image`. Verificar: `node --test scripts/deploy-config.test.mjs` en verde, incluidos los tests existentes de imágenes relativas y de páginas válidas.
- [x] 2.3 REFACTOR: ajustar el mensaje de error para que indique el valor esperado; actualizar el JSDoc de `scripts/verify-build.mjs` (cabecera) mencionando que la imagen social se valida contra `src/data/seo.js`. Verificar `npm test` en verde.

## 3. Plugin `route-html` que no tapa errores del build (D1)

- [x] 3.1 Safety net: `npm run build && npm run verify:build` en verde con el plugin actual; registrar la salida.
- [x] 3.2 Extraer sin cambiar comportamiento `routeHtmlPlugin()` de `vite.config.js` a `scripts/lib/route-html-plugin.mjs` (todavía con `closeBundle`) e importarlo desde `vite.config.js`. Verificar: `npm run build && npm run verify:build` en verde y `npm run lint` sin errores.
- [x] 3.3 RED: crear `scripts/route-html-plugin.test.mjs` con un test de integración que corre `build()` de Vite (`configFile: false`, `logLevel: 'silent'`, root temporal en `os.tmpdir()`, `plugins: [routeHtmlPlugin()]`) sobre un entry con error de sintaxis y una plantilla `index.html` con las etiquetas gestionadas: la promesa debe rechazar con el error original (no `ENOENT` ni un error de `route-html`) y no debe existir `<outDir>/configurador/index.html`. Verificar que falla con `closeBundle`.
- [x] 3.4 GREEN: cambiar el hook del plugin de `closeBundle` a `writeBundle` y actualizar su JSDoc (por qué `writeBundle`). Verificar: `node --test scripts/route-html-plugin.test.mjs` en verde.
- [x] 3.5 TRIANGULATE: agregar el caso "build sano" (entry trivial válido) que verifica que existen `<outDir>/index.html` y `<outDir>/configurador/index.html` con el canonical de cada ruta. Verificar: el test pasa y el directorio temporal se limpia en `after`.
- [x] 3.6 REFACTOR: extraer helpers del test (creación del root temporal) si hay duplicación; verificar `npm test` en verde y que el tiempo total de `npm test` sigue siendo razonable (anotar la duración).

## 4. CI sin dominio duplicado (D3, config)

- [x] 4.1 En `.github/workflows/ci.yml`, paso "Verify build artifacts", eliminar los bloques `if` del `grep` de `og:image` absoluto de la home y del `grep` del canonical del configurador (los únicos que contienen `https://www.facucode.dev`). Verificar con `grep -n "facucode" .github/workflows/ci.yml` → sin resultados, y revisión del YAML (indentación, `set -euo pipefail`, `fail` intactos).
- [x] 4.2 Verificar localmente el script restante del paso: tras `npm run build`, ejecutar su contenido en bash (Git Bash) y comprobar que termina con `Artefactos OK`.

## 5. Integración

- [x] 5.1 Correr `npm run ci` completo (lint, verificaciones, tests, build, verify:build) y verificar que termina en verde.
- [x] 5.2 Tras el push, verificar que el workflow CI de GitHub Actions queda en verde. Evidencia: GitHub Actions run 45221108953 sobre el commit f7873e6, conclusión success (job "Lint + verificaciones + tests + build").
