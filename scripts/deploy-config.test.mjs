import test from 'node:test'
import assert from 'node:assert/strict'
import { parseCsp, checkCsp, checkVercelConfig, checkSitemap, checkRobots, checkBuiltPages } from './lib/deploy-config.mjs'
import { readFileSync } from 'node:fs'
import { canonicalUrl, resolveRouteMeta } from '../src/data/seo.js'
import { renderRouteHtml, routeOutputFile } from './lib/route-html.mjs'

const CSP_OK = [
  "default-src 'self'",
  "script-src 'self'",
  "style-src 'self'",
  "font-src 'self'",
  "img-src 'self' data:",
  "connect-src 'self' https://script.google.com https://script.googleusercontent.com",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
].join('; ')

test('parseCsp: mapea cada directiva a su lista de fuentes', () => {
  const { directives } = parseCsp(CSP_OK)
  assert.deepEqual(directives.get('script-src'), ["'self'"])
  assert.deepEqual(directives.get('connect-src'), [
    "'self'",
    'https://script.google.com',
    'https://script.googleusercontent.com',
  ])
  assert.equal(directives.size, 10)
})

test('parseCsp: tolera espacios extra, saltos de línea y ; final', () => {
  const { directives } = parseCsp("  default-src   'self' ;\n script-src 'self' ;  ")
  assert.deepEqual([...directives.keys()], ['default-src', 'script-src'])
  assert.deepEqual(directives.get('default-src'), ["'self'"])
})

test('parseCsp: informa directivas duplicadas y normaliza el nombre a minúsculas', () => {
  const { directives, duplicates } = parseCsp("Script-Src 'self'; script-src 'none'")
  assert.deepEqual(duplicates, ['script-src'])
  assert.deepEqual(directives.get('script-src'), ["'self'"])
})

test('checkCsp: la CSP del design D3 no tiene errores', () => {
  assert.deepEqual(checkCsp(CSP_OK), [])
})

/** Reemplaza (o agrega/quita si `sources` es null) una directiva de la CSP válida. */
function withDirective(name, sources) {
  const parts = CSP_OK.split('; ').filter((d) => !d.startsWith(`${name} `))
  if (sources !== null) parts.push(`${name} ${sources}`)
  return parts.join('; ')
}

const hasErrorFor = (errors, directive) => errors.some((e) => e.includes(directive))

test('checkCsp: script-src con fuentes peligrosas nombra la directiva y la fuente', () => {
  for (const bad of ["'unsafe-inline'", "'unsafe-eval'", '*', 'https:', 'http:', 'data:']) {
    const errors = checkCsp(withDirective('script-src', `'self' ${bad}`))
    assert.ok(
      errors.some((e) => e.includes('script-src') && e.includes(bad)),
      `debería rechazar ${bad}: ${JSON.stringify(errors)}`,
    )
  }
})

test('checkCsp: script-src ausente es error (debe declararse explícito)', () => {
  assert.ok(hasErrorFor(checkCsp(withDirective('script-src', null)), 'script-src'))
})

test('checkCsp: directivas de endurecimiento faltantes o con otro valor', () => {
  for (const name of ['default-src', 'object-src', 'base-uri', 'form-action', 'frame-ancestors']) {
    const missing = checkCsp(withDirective(name, null))
    assert.ok(hasErrorFor(missing, name), `falta ${name}: ${JSON.stringify(missing)}`)
  }
  const wrong = checkCsp(withDirective('frame-ancestors', '*'))
  assert.ok(hasErrorFor(wrong, 'frame-ancestors'))
  const wrongObject = checkCsp(withDirective('object-src', "'self'"))
  assert.ok(hasErrorFor(wrongObject, 'object-src'))
})

test('checkCsp: connect-src exige los hosts del webhook y rechaza comodines', () => {
  const noRedirect = checkCsp(
    withDirective('connect-src', "'self' https://script.google.com"),
  )
  assert.ok(noRedirect.some((e) => e.includes('connect-src') && e.includes('script.googleusercontent.com')))

  const noGoogle = checkCsp(
    withDirective('connect-src', "'self' https://script.googleusercontent.com"),
  )
  assert.ok(noGoogle.some((e) => e.includes('connect-src') && e.includes('https://script.google.com')))

  for (const wildcard of ['*', 'https://*.google.com']) {
    const errors = checkCsp(
      withDirective(
        'connect-src',
        `'self' https://script.google.com https://script.googleusercontent.com ${wildcard}`,
      ),
    )
    assert.ok(
      errors.some((e) => e.includes('connect-src') && e.includes(wildcard)),
      `debería rechazar ${wildcard}: ${JSON.stringify(errors)}`,
    )
  }
})

test('checkCsp: connect-src rechaza esquemas desnudos (https:, wss:, http:, data:)', () => {
  for (const bad of ['https:', 'wss:', 'http:', 'data:']) {
    const errors = checkCsp(
      withDirective(
        'connect-src',
        `'self' https://script.google.com https://script.googleusercontent.com ${bad}`,
      ),
    )
    assert.ok(
      errors.some((e) => e.includes('connect-src') && e.includes(bad)),
      `debería rechazar ${bad}: ${JSON.stringify(errors)}`,
    )
  }
})

test('checkCsp: script-src rechaza blob: y unsafe-hashes', () => {
  for (const bad of ['blob:', "'unsafe-hashes'"]) {
    const errors = checkCsp(withDirective('script-src', `'self' ${bad}`))
    assert.ok(errors.some((e) => e.includes('script-src') && e.includes(bad)), `${bad}: ${JSON.stringify(errors)}`)
  }
})

test('checkCsp: style-src, img-src y font-src rechazan fuentes inseguras', () => {
  const unsafe = ["'unsafe-inline'", "'unsafe-eval'", "'unsafe-hashes'", '*', 'https://*', 'https:', 'http:']
  for (const name of ['style-src', 'img-src', 'font-src']) {
    for (const bad of unsafe) {
      const errors = checkCsp(withDirective(name, `'self' ${bad}`))
      assert.ok(
        errors.some((e) => e.includes(name) && e.includes(bad)),
        `${name} debería rechazar ${bad}: ${JSON.stringify(errors)}`,
      )
    }
  }
  for (const name of ['style-src', 'font-src']) {
    const errors = checkCsp(withDirective(name, "'self' data:"))
    assert.ok(errors.some((e) => e.includes(name) && e.includes('data:')), `${name} data:`)
  }
})

test('checkCsp: img-src permite data: (el sitio lo usa) pero ningún otro esquema desnudo', () => {
  assert.deepEqual(checkCsp(withDirective('img-src', "'self' data:")), [])
  assert.deepEqual(checkCsp(withDirective('img-src', "'self' https://images.example.com")), [])
  assert.ok(checkCsp(withDirective('img-src', "'self' data: blob:")).some((e) => e.includes('img-src') && e.includes('blob:')))
  assert.ok(checkCsp(withDirective('img-src', '*')).some((e) => e.includes('img-src')))
})

test('checkCsp: directiva duplicada es error (el navegador ignora la segunda)', () => {
  const errors = checkCsp(`${CSP_OK}; script-src 'self' https:`)
  assert.ok(errors.some((e) => e.includes('script-src') && /duplicad/i.test(e)))
})

// --- checkVercelConfig ---

const PERMISSIONS = 'camera=(), microphone=(), geolocation=(), payment=(), usb=()'

/** Config válida; `cspKey` permite probar enforcing vs Report-Only. */
function validConfig(cspKey = 'Content-Security-Policy') {
  return {
    rewrites: [{ source: '/(.*)', destination: '/index.html' }],
    headers: [
      {
        source: '/(.*)',
        headers: [
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'Permissions-Policy', value: PERMISSIONS },
          { key: cspKey, value: CSP_OK },
        ],
      },
    ],
  }
}

function mutate(fn, cspKey) {
  const config = validConfig(cspKey)
  fn(config)
  return config
}

const globalHeaders = (config) => config.headers[0].headers
const setHeader = (config, key, value) => {
  const header = globalHeaders(config).find((h) => h.key === key)
  header.value = value
}
const dropHeader = (config, key) => {
  config.headers[0].headers = globalHeaders(config).filter((h) => h.key !== key)
}

test('checkVercelConfig: config completa con CSP enforcing no tiene errores ni warnings', () => {
  assert.deepEqual(checkVercelConfig(validConfig()), { errors: [], warnings: [] })
})

test('checkVercelConfig: falta una cabecera simple -> error que la nombra', () => {
  const { errors } = checkVercelConfig(mutate((c) => dropHeader(c, 'X-Content-Type-Options')))
  assert.ok(errors.some((e) => e.includes('X-Content-Type-Options')))
})

test('checkVercelConfig: Referrer-Policy o X-Frame-Options con otro valor -> error', () => {
  const referrer = checkVercelConfig(mutate((c) => setHeader(c, 'Referrer-Policy', 'no-referrer')))
  assert.ok(referrer.errors.some((e) => e.includes('Referrer-Policy')))
  const frame = checkVercelConfig(mutate((c) => setHeader(c, 'X-Frame-Options', 'SAMEORIGIN')))
  assert.ok(frame.errors.some((e) => e.includes('X-Frame-Options')))
})

test('checkVercelConfig: Permissions-Policy sin una feature requerida -> error que la nombra', () => {
  const { errors } = checkVercelConfig(
    mutate((c) => setHeader(c, 'Permissions-Policy', 'microphone=(), geolocation=(), payment=(), usb=()')),
  )
  assert.ok(errors.some((e) => e.includes('Permissions-Policy') && e.includes('camera=()')))
})

test('checkVercelConfig: CSP solo en Report-Only pasa con warning de modo reporte', () => {
  const result = checkVercelConfig(validConfig('Content-Security-Policy-Report-Only'))
  assert.deepEqual(result.errors, [])
  assert.equal(result.warnings.length, 1)
  assert.match(result.warnings[0], /modo reporte/i)
})

test('checkVercelConfig: sin CSP -> error', () => {
  const { errors } = checkVercelConfig(mutate((c) => dropHeader(c, 'Content-Security-Policy')))
  assert.ok(errors.some((e) => e.includes('Content-Security-Policy')))
})

test('checkVercelConfig: una CSP debilitada propaga el error de checkCsp (también en Report-Only)', () => {
  const weak = (key) => {
    const config = validConfig(key)
    setHeader(config, key, withDirective('script-src', "'self' 'unsafe-inline'"))
    return config
  }
  assert.ok(checkVercelConfig(weak('Content-Security-Policy')).errors.some((e) => e.includes('script-src')))
  assert.ok(
    checkVercelConfig(weak('Content-Security-Policy-Report-Only')).errors.some((e) => e.includes('script-src')),
  )
})

test('checkVercelConfig: las claves de cabecera se comparan sin distinguir mayúsculas', () => {
  const config = validConfig()
  for (const h of globalHeaders(config)) h.key = h.key.toLowerCase()
  assert.deepEqual(checkVercelConfig(config), { errors: [], warnings: [] })

  const upper = validConfig('Content-Security-Policy-Report-Only')
  for (const h of globalHeaders(upper)) h.key = h.key.toUpperCase()
  const result = checkVercelConfig(upper)
  assert.deepEqual(result.errors, [])
  assert.equal(result.warnings.length, 1)
})

test('checkVercelConfig: con claves en minúsculas sigue detectando valores incorrectos', () => {
  const config = validConfig()
  for (const h of globalHeaders(config)) h.key = h.key.toLowerCase()
  globalHeaders(config).find((h) => h.key === 'x-frame-options').value = 'SAMEORIGIN'
  assert.ok(checkVercelConfig(config).errors.some((e) => e.includes('X-Frame-Options')))
})

test('checkVercelConfig: sin el rewrite SPA -> error', () => {
  const none = checkVercelConfig(mutate((c) => { delete c.rewrites }))
  assert.ok(none.errors.some((e) => e.includes('rewrite')))
  const wrong = checkVercelConfig(mutate((c) => { c.rewrites = [{ source: '/(.*)', destination: '/otro.html' }] }))
  assert.ok(wrong.errors.some((e) => e.includes('rewrite')))
})

test('checkVercelConfig: cabeceras bajo otro source (no global) -> error', () => {
  const { errors } = checkVercelConfig(mutate((c) => { c.headers[0].source = '/assets/(.*)' }))
  assert.ok(errors.some((e) => e.includes('/(.*)')))
})

test('checkVercelConfig: config vacía o sin headers no lanza y reporta errores', () => {
  assert.ok(checkVercelConfig({}).errors.length > 0)
  assert.ok(checkVercelConfig(null).errors.length > 0)
})

// --- checkSitemap / checkRobots ---

const HOME = 'https://www.facucode.dev/'
const CONFIGURADOR = 'https://www.facucode.dev/configurador'
const EXPECTED = [HOME, CONFIGURADOR]
const NS = 'http://www.sitemaps.org/schemas/sitemap/0.9'

function sitemap(locs, ns = NS) {
  const nsAttr = ns ? ` xmlns="${ns}"` : ''
  const urls = locs.map((l) => `  <url><loc>${l}</loc></url>`).join('\n')
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset${nsAttr}>\n${urls}\n</urlset>\n`
}

test('checkSitemap: sitemap válido con la home y el configurador', () => {
  assert.deepEqual(checkSitemap(sitemap(EXPECTED), EXPECTED), [])
})

test('checkSitemap: sitemap con solo la home reporta que falta /configurador', () => {
  const errors = checkSitemap(sitemap([HOME]), EXPECTED)
  assert.ok(errors.some((e) => /falta/i.test(e) && e.includes(CONFIGURADOR)))
})

test('checkSitemap: sitemap con solo /configurador reporta que falta la home', () => {
  assert.ok(checkSitemap(sitemap([CONFIGURADOR]), EXPECTED).some((e) => /falta/i.test(e) && e.includes(HOME)))
})

test('checkSitemap: falta una URL esperada y sobra una extra', () => {
  const missing = checkSitemap(sitemap([]), EXPECTED)
  assert.ok(missing.some((e) => e.includes(HOME) && /falta/i.test(e)))
  const extra = checkSitemap(sitemap([...EXPECTED, 'https://www.facucode.dev/otra']), EXPECTED)
  assert.ok(extra.some((e) => e.includes('https://www.facucode.dev/otra') && /inesperada/i.test(e)))
})

test('checkSitemap: <loc> duplicado', () => {
  const errors = checkSitemap(sitemap([HOME, HOME]), EXPECTED)
  assert.ok(errors.some((e) => e.includes(HOME) && /duplicad/i.test(e)))
})

test('checkSitemap: URL relativa o de otro host', () => {
  const relative = checkSitemap(sitemap([HOME, '/configurador']), EXPECTED)
  assert.ok(relative.some((e) => e.includes('/configurador') && /absoluta/i.test(e)))
  const otherHost = checkSitemap(sitemap([HOME, 'https://example.com/configurador']), EXPECTED)
  assert.ok(otherHost.some((e) => e.includes('https://example.com/configurador') && /absoluta/i.test(e)))
})

test('checkSitemap: sin xmlns de sitemaps.org 0.9 o sin urlset', () => {
  assert.ok(checkSitemap(sitemap(EXPECTED, ''), EXPECTED).some((e) => e.includes('xmlns')))
  assert.ok(checkSitemap(sitemap(EXPECTED, 'http://otro.org/ns'), EXPECTED).some((e) => e.includes('xmlns')))
  assert.ok(checkSitemap('<html></html>', EXPECTED).some((e) => e.includes('urlset')))
})

const SITEMAP_URL = 'https://www.facucode.dev/sitemap.xml'

test('checkRobots: válido, también con saltos de línea \r\n', () => {
  const txt = `User-agent: *\nAllow: /\nSitemap: ${SITEMAP_URL}\n`
  assert.deepEqual(checkRobots(txt, SITEMAP_URL), [])
  assert.deepEqual(checkRobots(txt.replace(/\n/g, '\r\n'), SITEMAP_URL), [])
})

test('checkRobots: falta la línea Sitemap, es relativa o apunta a otra URL', () => {
  const base = 'User-agent: *\nAllow: /\n'
  assert.ok(checkRobots(base, SITEMAP_URL).some((e) => e.includes('Sitemap')))
  assert.ok(checkRobots(`${base}Sitemap: /sitemap.xml\n`, SITEMAP_URL).some((e) => e.includes('Sitemap')))
  assert.ok(
    checkRobots(`${base}Sitemap: https://otro.dev/sitemap.xml\n`, SITEMAP_URL).some((e) => e.includes('Sitemap')),
  )
})

test('checkRobots: falta User-agent: * o Allow: /', () => {
  const sitemapLine = `Sitemap: ${SITEMAP_URL}\n`
  assert.ok(checkRobots(`Allow: /\n${sitemapLine}`, SITEMAP_URL).some((e) => e.includes('User-agent')))
  assert.ok(checkRobots(`User-agent: *\n${sitemapLine}`, SITEMAP_URL).some((e) => e.includes('Allow')))
})

// --- checkBuiltPages ---

const TEMPLATE_HTML = readFileSync(new URL('../index.html', import.meta.url), 'utf8')

/** Página construida válida para una ruta, con la misma plantilla que usa el build. */
function builtPage(path, mutate = (html) => html) {
  const url = canonicalUrl(path)
  return { url, file: `dist/${routeOutputFile(path)}`, html: mutate(renderRouteHtml(TEMPLATE_HTML, resolveRouteMeta(path))) }
}

const validPages = () => [builtPage('/'), builtPage('/configurador')]

test('checkBuiltPages: home y configurador construidos correctamente no reportan errores', () => {
  assert.deepEqual(checkBuiltPages(validPages()), [])
})

test('checkBuiltPages: HTML faltante nombra la URL y el archivo esperado', () => {
  const pages = [builtPage('/'), { url: CONFIGURADOR, file: 'dist/configurador/index.html', html: null }]
  const errors = checkBuiltPages(pages)
  assert.equal(errors.length, 1)
  assert.ok(errors[0].includes(CONFIGURADOR) && errors[0].includes('dist/configurador/index.html'))
})

test('checkBuiltPages: canonical distinto de la URL nombra la URL y el valor encontrado', () => {
  const pages = [builtPage('/'), builtPage('/configurador', (html) => html.replace('facucode.dev/configurador" />', 'facucode.dev/" />'))]
  const errors = checkBuiltPages(pages)
  assert.ok(errors.some((e) => e.includes(CONFIGURADOR) && e.includes('canonical') && e.includes('https://www.facucode.dev/')))
})

test('checkBuiltPages: og:url distinto de la URL falla aunque el canonical sea correcto', () => {
  const pages = [builtPage('/configurador', (html) => html.replace(/(og:url" content=")[^"]*/, '$1https://www.facucode.dev/otra'))]
  const errors = checkBuiltPages(pages)
  assert.ok(errors.some((e) => e.includes('og:url') && e.includes('https://www.facucode.dev/otra')))
  assert.ok(!errors.some((e) => e.includes('canonical')))
})

test('checkBuiltPages: og:image o twitter:image relativas fallan nombrando la URL', () => {
  const og = builtPage('/', (html) => html.replace(/(og:image" content=")[^"]*/, '$1/og-image.png'))
  assert.ok(checkBuiltPages([og]).some((e) => e.includes('og:image') && e.includes('/og-image.png')))
  const tw = builtPage('/configurador', (html) => html.replace(/(twitter:image" content=")[^"]*/, '$1og-image.png'))
  const errors = checkBuiltPages([tw])
  assert.ok(errors.some((e) => e.includes(CONFIGURADOR) && e.includes('twitter:image')))
  assert.ok(!errors.some((e) => e.includes('og:image')))
})

test('checkBuiltPages: twitter:card ausente o distinto de summary_large_image falla', () => {
  const sin = builtPage('/', (html) => html.replace(/\s*<meta name="twitter:card"[^>]*>/, ''))
  assert.ok(checkBuiltPages([sin]).some((e) => e.includes('twitter:card')))
  const otra = builtPage('/', (html) => html.replace('summary_large_image', 'summary'))
  assert.ok(checkBuiltPages([otra]).some((e) => e.includes('twitter:card') && e.includes('summary')))
})

test('checkBuiltPages: <script> inline o atributo on* falla (la CSP no admite inline)', () => {
  const inline = builtPage('/', (html) => html.replace('</body>', '<script>alert(1)</script></body>'))
  assert.ok(checkBuiltPages([inline]).some((e) => /inline/i.test(e) && e.includes('script')))
  const handler = builtPage('/', (html) => html.replace('<div id="root">', '<div id="root" onclick="x()">'))
  assert.ok(checkBuiltPages([handler]).some((e) => e.includes('onclick')))
})

test('checkBuiltPages: asset propio con ruta relativa falla; absolutas y externas pasan', () => {
  const relativa = builtPage('/configurador', (html) => html.replace('src="/src/main.jsx"', 'src="assets/index.js"'))
  assert.ok(checkBuiltPages([relativa]).some((e) => e.includes('assets/index.js') && /relativ/i.test(e)))
  assert.deepEqual(checkBuiltPages(validPages()), [])
})

test('checkBuiltPages: og:image o twitter:image absolutas del dominio pero distintas de seo.js fallan con el valor esperado', () => {
  const otra = 'https://www.facucode.dev/otra.png'
  const og = builtPage('/', (html) => html.replace(/(og:image" content=")[^"]*/, `$1${otra}`))
  const ogErrors = checkBuiltPages([og])
  assert.ok(ogErrors.some((e) => e.includes('og:image') && e.includes(otra) && e.includes(resolveRouteMeta('/').image)))
  const tw = builtPage('/configurador', (html) => html.replace(/(twitter:image" content=")[^"]*/, `$1${otra}`))
  const twErrors = checkBuiltPages([tw])
  assert.ok(twErrors.some((e) => e.includes(CONFIGURADOR) && e.includes('twitter:image') && e.includes(otra)))
  assert.ok(!twErrors.some((e) => e.includes('og:image')))
})

// --- CSP endurecida: style-src y font-src solo 'self' ---

test("checkCsp: style-src con https://fonts.googleapis.com falla nombrando directiva y host", () => {
  const errors = checkCsp(withDirective('style-src', "'self' https://fonts.googleapis.com"))
  assert.ok(errors.some((e) => e.includes('style-src') && e.includes('https://fonts.googleapis.com')), JSON.stringify(errors))
})

test("checkCsp: font-src con https://fonts.gstatic.com falla nombrando directiva y host", () => {
  const errors = checkCsp(withDirective('font-src', "'self' https://fonts.gstatic.com"))
  assert.ok(errors.some((e) => e.includes('font-src') && e.includes('https://fonts.gstatic.com')), JSON.stringify(errors))
})

test('checkCsp: sin font-src o sin style-src falla con "falta la directiva"', () => {
  for (const name of ['font-src', 'style-src']) {
    const errors = checkCsp(withDirective(name, null))
    assert.ok(errors.some((e) => e.includes(`falta la directiva ${name}`)), `${name}: ${JSON.stringify(errors)}`)
  }
})

test("checkCsp: style-src y font-src deben ser exactamente 'self' (otro origen propio también falla)", () => {
  for (const name of ['style-src', 'font-src']) {
    const errors = checkCsp(withDirective(name, "'self' https://cdn.ejemplo.com"))
    assert.ok(errors.some((e) => e.includes(name) && e.includes('cdn.ejemplo.com')), `${name}: ${JSON.stringify(errors)}`)
  }
})

// --- checkBuiltPages: fuentes ---

const FONT_STEM = 'jetbrains-mono-latin-wght-normal'
const FONT_HREF = `/assets/${FONT_STEM}-AbC123.woff2`
const PRELOAD = `<link rel="preload" as="font" type="font/woff2" href="${FONT_HREF}" crossorigin>`
const fontOpts = (existing = [FONT_HREF]) => ({
  preloadStems: [FONT_STEM],
  assetExists: (href) => existing.includes(href),
})
const withPreload = (html) => html.replace('</head>', `${PRELOAD}</head>`)
const fontPages = () => [builtPage('/', withPreload), builtPage('/configurador', withPreload)]

test('checkBuiltPages: páginas con la precarga correcta no reportan errores', () => {
  assert.deepEqual(checkBuiltPages(fontPages(), fontOpts()), [])
})

test('checkBuiltPages: página sin precarga nombra la URL y el stem', () => {
  const errors = checkBuiltPages([builtPage('/')], fontOpts())
  assert.equal(errors.length, 1)
  assert.ok(errors[0].includes(canonicalUrl('/')) && errors[0].includes(FONT_STEM), errors[0])
})

test('checkBuiltPages: precarga sin crossorigin falla', () => {
  const sin = builtPage('/', (html) => html.replace('</head>', `${PRELOAD.replace(' crossorigin', '')}</head>`))
  const errors = checkBuiltPages([sin], fontOpts())
  assert.ok(errors.some((e) => e.includes('crossorigin') && e.includes(FONT_STEM)), JSON.stringify(errors))
})

test('checkBuiltPages: precarga con type distinto de font/woff2 falla', () => {
  const mal = builtPage('/', (html) => html.replace('</head>', `${PRELOAD.replace('font/woff2', 'font/woff')}</head>`))
  assert.equal(checkBuiltPages([mal], fontOpts()).length, 1)
})

test('checkBuiltPages: precarga a un archivo inexistente nombra la ruta', () => {
  const errors = checkBuiltPages(fontPages(), fontOpts([]))
  assert.ok(errors.some((e) => e.includes(FONT_HREF)), JSON.stringify(errors))
  assert.equal(errors.length, 2)
})

test('checkBuiltPages: HTML que referencia Google Fonts nombra URL y origen', () => {
  for (const host of ['fonts.googleapis.com', 'fonts.gstatic.com']) {
    const pagina = builtPage('/', (html) => withPreload(html).replace('</head>', `<link rel="stylesheet" href="https://${host}/css2?family=X"></head>`))
    const errors = checkBuiltPages([pagina], fontOpts())
    assert.ok(errors.some((e) => e.includes(canonicalUrl('/')) && e.includes(host)), `${host}: ${JSON.stringify(errors)}`)
  }
})

test('checkBuiltPages: sin opciones no exige precarga pero igual rechaza Google Fonts', () => {
  assert.deepEqual(checkBuiltPages(validPages()), [])
  const google = builtPage('/', (html) => html.replace('</head>', '<link rel="preconnect" href="https://fonts.gstatic.com"></head>'))
  assert.ok(checkBuiltPages([google]).some((e) => e.includes('fonts.gstatic.com')))
})
