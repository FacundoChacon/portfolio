#!/usr/bin/env node
/**
 * Verifica el build (después de `vite build`): cada URL de `dist/sitemap.xml`
 * debe tener su HTML en `dist/` con `canonical` y `og:url` iguales a esa URL,
 * imágenes sociales iguales a la de `src/data/seo.js` (fuente única del
 * dominio), sin scripts inline, con la fuente principal precargada desde el
 * propio origen y sin referencias a Google Fonts.
 *
 * La lógica vive en `scripts/lib/deploy-config.mjs` (`checkBuiltPages`, con
 * tests) y `scripts/lib/route-html.mjs`. Este CLI solo lee `dist/`.
 *
 * Uso: npm run verify:build
 */
import { existsSync, readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { checkBuiltPages } from './lib/deploy-config.mjs'
import { PRELOAD_FONT_STEMS } from './lib/font-preload.mjs'
import { routeOutputFile } from './lib/route-html.mjs'

const root = fileURLToPath(new URL('..', import.meta.url))
const dist = `${root}dist/`

if (!existsSync(`${dist}sitemap.xml`)) {
  console.error('verify:build FALLÓ:\n  - falta dist/sitemap.xml (¿se corrió npm run build?)')
  process.exit(1)
}

const sitemap = readFileSync(`${dist}sitemap.xml`, 'utf8')
const urls = [...sitemap.matchAll(/<loc>\s*([^<]*?)\s*<\/loc>/g)].map((m) => m[1])

const pages = urls.map((url) => {
  const relative = routeOutputFile(url)
  const path = `${dist}${relative}`
  return { url, file: `dist/${relative}`, html: existsSync(path) ? readFileSync(path, 'utf8') : null }
})

const errors = urls.length === 0 ? ['dist/sitemap.xml no lista ninguna URL'] : checkBuiltPages(pages, {
      preloadStems: PRELOAD_FONT_STEMS,
      assetExists: (href) => existsSync(`${dist}${href.slice(1)}`),
    })

if (errors.length > 0) {
  console.error('verify:build FALLÓ:')
  for (const error of errors) console.error(`  - ${error}`)
  process.exit(1)
}

console.log(`verify:build OK (${urls.length} páginas)`)
