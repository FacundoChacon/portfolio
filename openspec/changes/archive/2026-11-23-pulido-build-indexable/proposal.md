# Proposal

## Why

La revisión independiente del change archivado `configurador-indexable` dejó tres hallazgos de severidad baja en el tooling de build y CI: el plugin que genera los HTML por ruta puede tapar el error real de un build fallido, la detección de manejadores `on*` del verificador del build da falsos positivos (y no detecta mayúsculas), y el dominio del sitio está escrito a mano en `ci.yml` además de en `src/data/seo.js`. Son baratos de cerrar ahora, mientras el contexto está fresco, y evitan diagnósticos engañosos en CI.

## What Changes

- **Plugin `route-html` (build)**: deja de generar `dist/<ruta>/index.html` cuando el build falló. Hoy corre en `closeBundle`, que Rollup/Vite invocan también ante un error (fase de build: `closeBundle(error)`; fase de escritura: `bundle.close()` en el `finally` de Vite). Si el plugin lanza ahí (por ejemplo `ENOENT` al leer `dist/index.html`), su error reemplaza al original. Tras el cambio, ante un build fallido el plugin no hace nada y el error original es el que se reporta. El plugin se extrae de `vite.config.js` a `scripts/lib/` para poder testearlo.
- **Detección de manejadores inline (`extractHeadMeta`)**: pasa a reconocer solo **nombres de atributo** reales `on*` (tokenizando los atributos y saltando valores entre comillas). Deja de marcar texto como `onboarding=` dentro de un valor (`content="..."`, query strings de URLs) y pasa a detectar también nombres en mayúsculas (`ONCLICK`), con o sin espacios antes del `=` y con valores sin comillas.
- **Dominio en CI**: se quitan de `.github/workflows/ci.yml` los dos `grep` que repiten `https://www.facucode.dev` (og:image de la home y canonical del configurador). Esas garantías pasan a vivir en `checkBuiltPages` (`npm run verify:build`), que ya valida el canonical contra el sitemap y ahora valida `og:image` / `twitter:image` contra la imagen que declara `src/data/seo.js` para cada ruta (fuente única del dominio).

Sin cambios visibles en el sitio publicado: mismo HTML, mismos metadatos, misma CSP.

## Capabilities

### New Capabilities

(ninguna)

### Modified Capabilities

(ninguna) — Los tres puntos endurecen la verificación y el manejo de errores del build sin cambiar el comportamiento especificado. `metadatos-por-ruta` ya exige "no hay atributos `on*`" (un `on...=` dentro de un valor no es un atributo) y `og:image` = `https://www.facucode.dev/og-image.png`; el change alinea las herramientas con esa spec. Por eso el change declara `skip_specs: true`.

## Impact

- `vite.config.js`: importa el plugin desde su nuevo módulo.
- `scripts/lib/route-html-plugin.mjs` (nuevo) + `scripts/route-html-plugin.test.mjs` (nuevo, `node:test`).
- `scripts/lib/route-html.mjs` (`extractHeadMeta`) + `scripts/route-html.test.mjs`.
- `scripts/lib/deploy-config.mjs` (`checkBuiltPages`, pasa a importar `src/data/seo.js`) + `scripts/deploy-config.test.mjs`.
- `.github/workflows/ci.yml`: se eliminan dos chequeos redundantes del paso "Verify build artifacts".
- Sin dependencias nuevas. Gobernanza: LOW/MEDIUM (tooling de build y config de CI).
