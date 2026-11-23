import test, { after } from 'node:test'
import assert from 'node:assert/strict'
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { build } from 'vite'
import { routeHtmlPlugin } from './lib/route-html-plugin.mjs'
import { canonicalUrl, ROUTES } from '../src/data/seo.js'

const TEMPLATE = `<!DOCTYPE html>
<html lang="es">
  <head>
    <meta charset="UTF-8" />
    <meta name="description" content="desc vieja" />
    <link rel="canonical" href="https://www.facucode.dev/" />
    <meta property="og:url" content="https://www.facucode.dev/" />
    <meta property="og:title" content="og vieja" />
    <meta property="og:description" content="og desc vieja" />
    <meta property="og:image" content="https://www.facucode.dev/vieja.png" />
    <meta name="twitter:card" content="summary" />
    <meta name="twitter:title" content="tw vieja" />
    <meta name="twitter:description" content="tw desc vieja" />
    <meta name="twitter:image" content="https://www.facucode.dev/vieja.png" />
    <title>Titulo viejo</title>
  </head>
  <body><div id="root"></div><script type="module" src="/main.js"></script></body>
</html>
`

const roots = []

/** Proyecto Vite mínimo en un directorio temporal, con el entry indicado. */
function makeRoot(entrySource) {
  const root = mkdtempSync(join(tmpdir(), 'rhp-'))
  roots.push(root)
  mkdirSync(join(root, 'dist'), { recursive: true })
  writeFileSync(join(root, 'index.html'), TEMPLATE)
  writeFileSync(join(root, 'main.js'), entrySource)
  return root
}

const runBuild = (root) =>
  build({ root, configFile: false, logLevel: 'silent', plugins: [routeHtmlPlugin()], build: { outDir: 'dist', emptyOutDir: true } })

after(() => {
  for (const root of roots) rmSync(root, { recursive: true, force: true })
})

test('routeHtmlPlugin: un build roto rechaza con el error original y no genera páginas', async () => {
  const root = makeRoot('const = ;\n')
  await assert.rejects(runBuild(root), (error) => {
    assert.doesNotMatch(String(error.message), /ENOENT|route-html/)
    assert.match(String(error.message), /main\.js|Unexpected|expected|Expression/i)
    return true
  })
  assert.equal(existsSync(join(root, 'dist', 'configurador', 'index.html')), false)
})

test('routeHtmlPlugin: un build sano genera el HTML de cada ruta con su canonical', async () => {
  const root = makeRoot("console.log('ok')\n")
  await runBuild(root)
  for (const route of ROUTES) {
    const file = route.path === '/' ? 'index.html' : join(route.path.slice(1), 'index.html')
    const html = readFileSync(join(root, 'dist', file), 'utf8')
    assert.ok(html.includes(`rel="canonical" href="${canonicalUrl(route.path)}"`), `${file} sin su canonical`)
  }
})
