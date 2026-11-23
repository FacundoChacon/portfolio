import test from 'node:test'
import { readFileSync } from 'node:fs'
import assert from 'node:assert/strict'
import { renderRouteHtml, extractHeadMeta, routeOutputFile } from './lib/route-html.mjs'
import { ROUTES, resolveRouteMeta } from '../src/data/seo.js'

const FIXTURE = `<!DOCTYPE html>
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
    <link href="https://fonts.googleapis.com/css2?family=Inter" rel="stylesheet" />
    <script type="module" crossorigin src="/assets/index-abc.js"></script>
    <link rel="stylesheet" crossorigin href="/assets/index-abc.css">
    <title>Titulo viejo</title>
  </head>
  <body><div id="root"></div></body>
</html>
`

const configurador = resolveRouteMeta('/configurador')
const home = resolveRouteMeta('/')

test('renderRouteHtml: aplica los metadatos del configurador a todas las etiquetas gestionadas', () => {
  const out = renderRouteHtml(FIXTURE, configurador)
  assert.match(out, /<title>Armá tu presupuesto web \| Facundo Chacón<\/title>/)
  assert.match(out, /<meta name="description" content="Elegí el tipo de sitio[^"]*Te respondo por email\." \/>/)
  assert.match(out, /<link rel="canonical" href="https:\/\/www\.facucode\.dev\/configurador" \/>/)
  assert.match(out, /<meta property="og:url" content="https:\/\/www\.facucode\.dev\/configurador" \/>/)
  assert.match(out, /<meta property="og:title" content="Armá tu presupuesto web \| Facundo Chacón" \/>/)
  assert.match(out, /<meta property="og:description" content="Elegí el tipo de sitio/)
  assert.match(out, /<meta property="og:image" content="https:\/\/www\.facucode\.dev\/og-image\.png" \/>/)
  assert.match(out, /<meta name="twitter:card" content="summary_large_image" \/>/)
  assert.match(out, /<meta name="twitter:title" content="Armá tu presupuesto web \| Facundo Chacón" \/>/)
  assert.match(out, /<meta name="twitter:description" content="Elegí el tipo de sitio/)
  assert.match(out, /<meta name="twitter:image" content="https:\/\/www\.facucode\.dev\/og-image\.png" \/>/)
  assert.doesNotMatch(out, /vieja/)
})

test('renderRouteHtml: la home usa título, descripción y og:description propios', () => {
  const out = renderRouteHtml(FIXTURE, home)
  assert.match(out, /<title>Facundo Chacón \| Desarrollador Full Stack Java \/ React<\/title>/)
  assert.match(out, /<meta name="description" content="Portfolio de Facundo Chacón/)
  assert.match(out, /<meta property="og:description" content="Desarrollador Full Stack Java \/ React\. Proyectos/)
  assert.match(out, /<link rel="canonical" href="https:\/\/www\.facucode\.dev\/" \/>/)
})

test('renderRouteHtml: tolera otro orden de atributos y comillas simples', () => {
  const template = FIXTURE.replace(
    '<link rel="canonical" href="https://www.facucode.dev/" />',
    "<link href='https://www.facucode.dev/' rel='canonical'>",
  ).replace(
    '<meta property="og:title" content="og vieja" />',
    '<meta content="og vieja" property="og:title" />',
  )
  const out = renderRouteHtml(template, configurador)
  assert.match(out, /<link href="https:\/\/www\.facucode\.dev\/configurador" rel='canonical'>/)
  assert.match(out, /<meta content="Armá tu presupuesto web \| Facundo Chacón" property="og:title" \/>/)
})

test('renderRouteHtml: no toca scripts, links de assets ni el body', () => {
  const out = renderRouteHtml(FIXTURE, configurador)
  for (const untouched of [
    '<script type="module" crossorigin src="/assets/index-abc.js"></script>',
    '<link rel="stylesheet" crossorigin href="/assets/index-abc.css">',
    '<link href="https://fonts.googleapis.com/css2?family=Inter" rel="stylesheet" />',
    '<body><div id="root"></div></body>',
  ]) {
    assert.ok(out.includes(untouched), `se alteró: ${untouched}`)
  }
})

test('renderRouteHtml: es idempotente y se puede cambiar de ruta sobre su propia salida', () => {
  const once = renderRouteHtml(FIXTURE, configurador)
  assert.equal(renderRouteHtml(once, configurador), once)
  assert.equal(renderRouteHtml(once, home), renderRouteHtml(FIXTURE, home))
})

test('renderRouteHtml: etiqueta faltante lanza un error que la nombra', () => {
  const sinCanonical = FIXTURE.replace(/<link rel="canonical"[^>]*>\n/, '')
  assert.throws(() => renderRouteHtml(sinCanonical, configurador), /canonical/)
  const sinCard = FIXTURE.replace(/<meta name="twitter:card"[^>]*>\n/, '')
  assert.throws(() => renderRouteHtml(sinCard, configurador), /twitter:card/)
  const sinTitle = FIXTURE.replace(/<title>[^<]*<\/title>\n/, '')
  assert.throws(() => renderRouteHtml(sinTitle, configurador), /title/)
})

test('renderRouteHtml: etiqueta repetida lanza un error que la nombra', () => {
  const dup = FIXTURE.replace('<meta charset="UTF-8" />', '<meta charset="UTF-8" />\n<meta name="description" content="otra" />')
  assert.throws(() => renderRouteHtml(dup, configurador), /meta name="description".*(repetid|2)/)
  const dupTitle = FIXTURE.replace('</head>', '<title>otro</title></head>')
  assert.throws(() => renderRouteHtml(dupTitle, configurador), /title/)
})

const SPECIAL = {
  ...configurador,
  title: 'Tom & "Jerry" <b>',
  description: 'a < b && c > d, "x" $& $1',
  socialTitle: 'Tom & "Jerry" <b>',
  socialDescription: 'a < b && c > d, "x" $& $1',
}

test('renderRouteHtml: escapa & " < > en title y description y el documento sigue bien formado', () => {
  const out = renderRouteHtml(FIXTURE, SPECIAL)
  assert.ok(out.includes('<title>Tom &amp; &quot;Jerry&quot; &lt;b&gt;</title>'))
  assert.ok(out.includes('content="a &lt; b &amp;&amp; c &gt; d, &quot;x&quot; $&amp; $1"'))
  assert.doesNotMatch(out, /content="[^"]*[<>][^"]*"/)
})

test('renderRouteHtml: un apóstrofo en el valor no rompe el reemplazo sobre su propia salida', () => {
  const apostrofe = { ...configurador, description: "Te respondo cuando puedo, no es d'Artagnan" }
  const once = renderRouteHtml(FIXTURE, apostrofe)
  assert.ok(once.includes(`<meta name="description" content="Te respondo cuando puedo, no es d'Artagnan" />`))
  const twice = renderRouteHtml(once, configurador)
  assert.equal(twice, renderRouteHtml(FIXTURE, configurador))
})

test('extractHeadMeta: devuelve el texto original aun con valores escapados', () => {
  const out = renderRouteHtml(FIXTURE, SPECIAL)
  const meta = extractHeadMeta(out)
  assert.equal(meta.title, 'Tom & "Jerry" <b>')
  assert.equal(meta.description, 'a < b && c > d, "x" $& $1')
})

test('extractHeadMeta: lee canonical, og, twitter y title de una página renderizada', () => {
  const meta = extractHeadMeta(renderRouteHtml(FIXTURE, configurador))
  assert.equal(meta.canonical, 'https://www.facucode.dev/configurador')
  assert.equal(meta.ogUrl, 'https://www.facucode.dev/configurador')
  assert.equal(meta.ogImage, 'https://www.facucode.dev/og-image.png')
  assert.equal(meta.twitterCard, 'summary_large_image')
  assert.equal(meta.twitterImage, 'https://www.facucode.dev/og-image.png')
  assert.equal(meta.title, 'Armá tu presupuesto web | Facundo Chacón')
  assert.deepEqual(meta.inlineScripts, 0)
  assert.deepEqual(meta.inlineHandlers, [])
})

test('extractHeadMeta: etiquetas ausentes devuelven null', () => {
  const meta = extractHeadMeta('<html><head></head><body></body></html>')
  assert.equal(meta.canonical, null)
  assert.equal(meta.ogUrl, null)
  assert.equal(meta.twitterCard, null)
  assert.equal(meta.title, null)
})

test('extractHeadMeta: detecta scripts inline y atributos on*', () => {
  const html = `${FIXTURE}<script>alert(1)</script><script type="module" src="/a.js"></script><img src="/x.png" onerror="x()"><body onload='y()'>`
  const meta = extractHeadMeta(html)
  assert.equal(meta.inlineScripts, 1)
  assert.deepEqual(meta.inlineHandlers.sort(), ['onerror', 'onload'])
})

test('extractHeadMeta: lista las URLs de assets propios (script src, link href de hojas y modulepreload)', () => {
  const html = `${FIXTURE}<link rel="modulepreload" crossorigin href="assets/x.js">`
  const meta = extractHeadMeta(html)
  assert.deepEqual(meta.assetUrls, [
    'https://fonts.googleapis.com/css2?family=Inter',
    '/assets/index-abc.js',
    '/assets/index-abc.css',
    'assets/x.js',
  ])
})

test('routeOutputFile: mapea la ruta al archivo del build, con o sin barra final', () => {
  assert.equal(routeOutputFile('/'), 'index.html')
  assert.equal(routeOutputFile('/configurador'), 'configurador/index.html')
  assert.equal(routeOutputFile('/configurador/'), 'configurador/index.html')
})

test('routeOutputFile: acepta una URL absoluta del sitio', () => {
  assert.equal(routeOutputFile('https://www.facucode.dev/'), 'index.html')
  assert.equal(routeOutputFile('https://www.facucode.dev/configurador'), 'configurador/index.html')
})

const TEMPLATE = readFileSync(new URL('../index.html', import.meta.url), 'utf8')

test('plantilla index.html: acepta renderRouteHtml para cada ruta de ROUTES', () => {
  for (const route of ROUTES) {
    const meta = resolveRouteMeta(route.path)
    const out = renderRouteHtml(TEMPLATE, meta)
    const head = extractHeadMeta(out)
    assert.equal(head.canonical, meta.canonical, route.path)
    assert.equal(head.ogUrl, meta.canonical, route.path)
    assert.equal(head.twitterCard, 'summary_large_image', route.path)
    assert.equal(head.title, meta.title, route.path)
  }
})

test('plantilla index.html: la home renderizada conserva los valores actuales de la plantilla', () => {
  const head = extractHeadMeta(TEMPLATE)
  const home = resolveRouteMeta('/')
  assert.equal(head.title, home.title)
  assert.equal(head.description, home.description)
  assert.equal(head.canonical, home.canonical)
  assert.equal(head.ogImage, home.image)
  assert.equal(head.twitterImage, home.image)
})

test('extractHeadMeta: no confunde texto "on…=" dentro de valores de atributo con manejadores', () => {
  const casos = [
    '<meta name="description" content="Guía de onboarding=fácil">',
    '<a href="/x?on=1&onda=2">x</a>',
    '<meta content="a > b onfoo=1">',
  ]
  for (const caso of casos) {
    assert.deepEqual(extractHeadMeta(`${FIXTURE}${caso}`).inlineHandlers, [], caso)
  }
})

test('extractHeadMeta: detecta manejadores reales con espacios, sin comillas y en mayúsculas', () => {
  const html = `${FIXTURE}<button onclick="x()">a</button><img onload = "x()"><img src="/a.png" onerror=x><a ONCLICK="x()">b</a>`
  assert.deepEqual(extractHeadMeta(html).inlineHandlers.sort(), ['onclick', 'onclick', 'onerror', 'onload'])
})
