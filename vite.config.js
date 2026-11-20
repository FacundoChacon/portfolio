import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { renderRouteHtml, routeOutputFile } from './scripts/lib/route-html.mjs'
import { ROUTES, resolveRouteMeta } from './src/data/seo.js'

/**
 * Genera un HTML estático por página pública (`dist/<ruta>/index.html`) a
 * partir del `index.html` que emite Vite, con los metadatos de `src/data/seo.js`.
 * Corre en `closeBundle`, así que aplica con cualquier forma de invocar el
 * build. Reescribe también `dist/index.html` con la meta de la home. Si la
 * plantilla pierde una etiqueta gestionada, el build falla.
 */
function routeHtmlPlugin() {
  let outDir = 'dist'
  return {
    name: 'route-html',
    apply: 'build',
    configResolved(config) {
      outDir = resolve(config.root, config.build.outDir)
    },
    closeBundle() {
      const template = readFileSync(resolve(outDir, 'index.html'), 'utf8')
      for (const route of ROUTES) {
        const target = resolve(outDir, routeOutputFile(route.path))
        mkdirSync(dirname(target), { recursive: true })
        writeFileSync(target, renderRouteHtml(template, resolveRouteMeta(route.path)))
      }
    },
  }
}

export default defineConfig({
  plugins: [react(), routeHtmlPlugin()],
})
