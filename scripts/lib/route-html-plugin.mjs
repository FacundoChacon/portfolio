import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { renderRouteHtml, routeOutputFile } from './route-html.mjs'
import { ROUTES, resolveRouteMeta } from '../../src/data/seo.js'

/**
 * Genera un HTML estático por página pública (`dist/<ruta>/index.html`) a
 * partir del `index.html` que emite Vite, con los metadatos de `src/data/seo.js`.
 * Corre en `writeBundle`, que Rollup invoca solo tras escribir con éxito el
 * bundle: ante un build fallido no toca `dist/` y el error original llega
 * intacto (en `closeBundle` el plugin lo taparía). Reescribe también
 * `dist/index.html` con la meta de la home. Si la plantilla pierde una
 * etiqueta gestionada, el build falla.
 */
export function routeHtmlPlugin() {
  let outDir = 'dist'
  return {
    name: 'route-html',
    apply: 'build',
    configResolved(config) {
      outDir = resolve(config.root, config.build.outDir)
    },
    writeBundle() {
      const template = readFileSync(resolve(outDir, 'index.html'), 'utf8')
      for (const route of ROUTES) {
        const target = resolve(outDir, routeOutputFile(route.path))
        mkdirSync(dirname(target), { recursive: true })
        writeFileSync(target, renderRouteHtml(template, resolveRouteMeta(route.path)))
      }
    },
  }
}
