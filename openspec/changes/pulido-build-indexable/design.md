# Design

## Context

Ver proposal.md — Why. Versiones instaladas que condicionan el diseño: **Vite 5.4.21** y **Rollup 4.62.2**. Los tests del repo corren con `node --test "scripts/**/*.test.mjs"` (no Vitest), con `node:assert/strict`.

Comportamiento verificado en `node_modules`:

- **Error en la fase de build** (`rollup()`): Rollup llama `buildEnd(error)` y luego `closeBundle(error)` y relanza. Si `closeBundle` lanza, ese error **reemplaza** al original (`hookParallel` rechaza antes del `throw error_`). En ese punto Vite todavía no vació `dist/` (`prepareOutDir` corre después de `rollup()`), así que el plugin trabajaría sobre el `dist/` del build anterior o fallaría con `ENOENT`.
- **Error en la fase de generación/escritura**: Rollup llama `renderError(error)` y relanza; Vite ejecuta `bundle.close()` en su `finally`, que dispara `closeBundle()` **sin argumentos**. `dist/` ya fue vaciado y puede estar a medio escribir: si el plugin lanza, la excepción del `finally` tapa la original.
- **`writeBundle`**: Rollup lo invoca solo después de escribir con éxito todos los archivos del output; nunca en los caminos de error.

## Goals / Non-Goals

**Goals:**
- Ante un build fallido, el plugin no toca `dist/` y el error reportado es el original.
- La detección de manejadores inline acepta solo nombres de atributo reales, sin importar mayúsculas.
- El dominio del sitio queda escrito una sola vez (`src/data/seo.js`) para las verificaciones de metadatos del build.

**Non-Goals:**
- Unificar `SITE_ORIGIN` de `scripts/lib/deploy-config.mjs` (usado por `checkSitemap`) con `SITE_URL`: es otra duplicación del dominio, pero fuera del alcance acordado (queda como follow-up).
- Parsear HTML completo (comentarios `<!-- -->`, `<script>`/`<style>` con `<` en su contenido, CDATA). El HTML verificado es el que emite Vite desde una plantilla propia.
- Tocar el resto del paso "Verify build artifacts" de `ci.yml` (existencia de archivos, chunk del configurador, `og:image" content="/` relativo, que no repite el dominio).

## Decisions

### D1. Generar en `writeBundle` en lugar de `closeBundle` (hallazgo 1)

El plugin pasa a usar el hook `writeBundle`, que Rollup solo invoca tras una escritura exitosa. Así no hace falta estado: en cualquier fallo (fase de build o de escritura) el hook no corre y el error original sube intacto. Si el propio plugin falla en `writeBundle` (plantilla sin una etiqueta gestionada), el build falla con su mensaje, como exige `metadatos-por-ruta` ("Generación verificada de los metadatos").

Se extrae `routeHtmlPlugin()` a `scripts/lib/route-html-plugin.mjs` (ESM sin dependencias de Vite) para poder testearlo; `vite.config.js` solo lo importa.

Alternativas consideradas:
- **Mantener `closeBundle` + flag**: marcar `failed = true` en `buildEnd(error)` y `renderError(error)` y salir temprano en `closeBundle`. Funciona (y es lo que sugería la revisión), pero agrega estado mutable entre hooks y depende de cubrir los dos caminos de error; `writeBundle` expresa la misma garantía por contrato de Rollup.
- **Usar el argumento `closeBundle(error)`**: Rollup 4 lo pasa solo en la fase de build; en el camino de escritura Vite llama `closeBundle()` sin argumento, así que no alcanza.

Trade-off aceptado: con `build.write: false` (uso programático sin escritura) el plugin no corre; es correcto, porque no hay `dist/index.html` del que partir.

**Test**: test de integración en `scripts/route-html-plugin.test.mjs` que llama a `build()` de Vite sobre un root temporal (`os.tmpdir()`), `logLevel: 'silent'`, `configFile: false`, con el plugin:
- *Build roto* (entry con error de sintaxis): la promesa rechaza con el error original (menciona el archivo/sintaxis) y **no** con `ENOENT`/`route-html`; no se crea `<outDir>/configurador/index.html`. Con la implementación actual (`closeBundle`) este test falla → RED real.
- *Build sano* (plantilla con las etiquetas gestionadas y un entry trivial): existen `<outDir>/index.html` y `<outDir>/configurador/index.html` con el canonical de cada ruta.

### D2. Tokenizar atributos para detectar `on*` (hallazgo 2)

`extractHeadMeta` reemplaza la regex `/<[a-zA-Z][^>]*?\s(on[a-z]+)\s*=/g` por dos pasos:
1. Una regex de **etiqueta de apertura** que consume los atributos respetando comillas, del estilo `<([a-zA-Z][\w:-]*)((?:\s+[^\s"'>/=]+(?:\s*=\s*(?:"[^"]*"|'[^']*'|[^\s"'=<>`]+))?)*)\s*/?>` (así un `>` dentro de un valor entre comillas no corta la etiqueta).
2. Sobre el grupo de atributos, iterar `([^\s"'>/=]+)(?:\s*=\s*(?:"[^"]*"|'[^']*'|[^\s"'=<>`]+))?` y quedarse con los **nombres** que cumplen `/^on/i` y tienen al menos una letra más; se devuelven en minúsculas (como hoy).

Casos que deben cumplirse (tests): detecta `onclick="..."`, `onload = "..."`, `onerror=x` (sin comillas) y `ONCLICK="..."`; **no** marca `content="... onboarding=..."`, `href="/x?on=1&onda=2"`, ni un valor con `>` y texto `onfoo=` después. Se mantiene el test existente (`onerror`, `onload`).

Alternativa descartada: agregar un parser HTML (p. ej. `parse5`) como devDependency. Más robusto, pero es una dependencia nueva para un HTML propio y acotado.

### D3. Mover los chequeos con dominio de `ci.yml` a `checkBuiltPages` (hallazgo 3)

Opciones evaluadas:
- **A. `env: SITE_URL` a nivel de job en `ci.yml`**: elimina la repetición dentro del YAML, pero el dominio sigue duplicado respecto de `src/data/seo.js`.
- **B (elegida). Eliminar los dos `grep` y cubrirlos en `checkBuiltPages`**, que ya corre en `npm run ci` (`verify:build`):
  - El `grep` del canonical del configurador es **redundante hoy**: `verify:deploy` exige que `public/sitemap.xml` liste exactamente `canonicalUrl(ROUTES)` y `verify:build` exige que el HTML de cada URL del sitemap declare `canonical` y `og:url` iguales a esa URL.
  - El `grep` de `og:image` es más estricto que lo actual (`checkBuiltPages` solo pide que empiece con el origen). Se endurece: `og:image` y `twitter:image` deben ser **iguales** a `resolveRouteMeta(pathname).image` de `src/data/seo.js` (hoy `OG_IMAGE`). Usar la meta de la ruta, y no la constante, deja lugar a imágenes por ruta en el futuro.

B deja el dominio en un único lugar para estas verificaciones, con tests unitarios en lugar de `grep` en shell. `deploy-config.mjs` pasa a importar `src/data/seo.js` (módulo ESM sin dependencias, ya importado por `verify-deploy.mjs` y los tests).

## Risks / Trade-offs

- [El test de integración de D1 ejecuta `vite build` y alarga `npm test` (~1–3 s)] → root temporal mínimo, `logLevel: 'silent'`, limpieza con `rm -rf` en `after`. Si resultara lento o frágil en CI, se acota al caso "build roto".
- [`writeBundle` corre en paralelo con el `writeBundle` de otros plugins] → ningún plugin del proyecto reescribe `index.html` en ese hook (Vite emite el HTML en `generateBundle`); el test "build sano" lo cubre.
- [La regex de D2 sigue sin ser un parser HTML completo] → alcance acotado al HTML propio (Non-Goals); los casos límite relevantes quedan en tests.
- [Endurecer `og:image` a igualdad exacta puede romper si alguien cambia la imagen solo en la plantilla] → es el comportamiento buscado: la spec fija la imagen y `seo.js` es la fuente única; el error nombra la URL, el archivo y el valor encontrado.
- [Quitar chequeos de `ci.yml` reduce defensa en profundidad] → las mismas garantías siguen en `npm run ci` dentro del mismo job, antes del paso eliminado.

## Migration Plan

Sin migración: tooling de build y CI. Rollback = revertir el commit. Validación: `npm run ci` local en verde y el workflow de CI en verde en el PR/push.
