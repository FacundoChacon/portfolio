/**
 * Validadores puros de la configuración de deploy (C-12).
 *
 * Sin I/O: reciben el contenido ya leído y devuelven errores/advertencias para
 * que los tests puedan afirmar los mensajes. El CLI `scripts/verify-deploy.mjs`
 * se ocupa de leer los archivos y de fijar el código de salida.
 */

/** Hosts de Google Apps Script que el webhook necesita en `connect-src` (envío + redirección 302). */
export const WEBHOOK_HOSTS = ['https://script.google.com', 'https://script.googleusercontent.com']

/** Palabras clave que ninguna directiva de recursos puede llevar. */
const UNSAFE_KEYWORDS = ["'unsafe-inline'", "'unsafe-eval'", "'unsafe-hashes'"]

/** Fuentes extra que `script-src` además no admite (comodines y esquemas desnudos se validan aparte). */
export const FORBIDDEN_SCRIPT_SOURCES = ['blob:']

/** Directivas de recursos endurecidas: nombre -> esquemas desnudos tolerados (img-src usa `data:`). */
const HARDENED_DIRECTIVES = {
  'style-src': [],
  'img-src': ['data:'],
  'font-src': [],
}

/** Directivas de endurecimiento: nombre -> fuentes exactas exigidas. */
export const REQUIRED_CSP = {
  'default-src': ["'self'"],
  'object-src': ["'none'"],
  'base-uri': ["'self'"],
  'form-action': ["'self'"],
  'frame-ancestors': ["'none'"],
}

/** Cabeceras simples exigidas con valor exacto. */
export const REQUIRED_HEADERS = {
  'X-Content-Type-Options': 'nosniff',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'X-Frame-Options': 'DENY',
}

/** Features que `Permissions-Policy` debe deshabilitar. */
export const REQUIRED_PERMISSIONS = ['camera=()', 'microphone=()', 'geolocation=()', 'payment=()', 'usb=()']

/**
 * Parsea una CSP a un mapa directiva -> fuentes. Si una directiva se repite se
 * conserva la primera (como hace el navegador) y se informa en `duplicates`.
 * @param {string} value
 * @returns {{ directives: Map<string, string[]>, duplicates: string[] }}
 */
export function parseCsp(value) {
  const directives = new Map()
  const duplicates = []
  for (const raw of String(value).split(';')) {
    const tokens = raw.trim().split(/\s+/).filter(Boolean)
    if (tokens.length === 0) continue
    const name = tokens[0].toLowerCase()
    if (directives.has(name)) {
      duplicates.push(name)
      continue
    }
    directives.set(name, tokens.slice(1))
  }
  return { directives, duplicates }
}

const isBareScheme = (source) => /^[a-z][a-z0-9+.-]*:$/i.test(source)
const isWildcardSource = (source) => source === '*' || /^[a-z][a-z0-9+.-]*:\/\/\*/i.test(source)

/** Fuentes inseguras de una directiva: palabras clave peligrosas, comodines y esquemas desnudos no tolerados. */
function unsafeSources(sources, allowedSchemes = [], extraForbidden = []) {
  return sources.filter((source) => {
    const lower = source.toLowerCase()
    if (UNSAFE_KEYWORDS.includes(lower) || extraForbidden.includes(lower)) return true
    if (isWildcardSource(lower)) return true
    return isBareScheme(lower) && !allowedSchemes.includes(lower)
  })
}

/**
 * Valida que una CSP cumpla las directivas exigidas.
 * @param {string} value
 * @returns {string[]} errores (vacío si es válida)
 */
export function checkCsp(value) {
  const errors = []
  const { directives, duplicates } = parseCsp(value)

  for (const name of duplicates) {
    errors.push(`CSP: la directiva ${name} está duplicada (el navegador ignora la segunda)`)
  }

  for (const [name, expected] of Object.entries(REQUIRED_CSP)) {
    const sources = directives.get(name)
    if (!sources) {
      errors.push(`CSP: falta la directiva ${name} ${expected.join(' ')}`)
    } else if (sources.length !== expected.length || sources.some((s, i) => s !== expected[i])) {
      errors.push(`CSP: ${name} debe ser ${expected.join(' ')} (es: ${sources.join(' ') || 'vacía'})`)
    }
  }

  const scriptSrc = directives.get('script-src')
  if (!scriptSrc) {
    errors.push("CSP: falta la directiva script-src (debe declararse explícita, p. ej. 'self')")
  } else {
    for (const source of unsafeSources(scriptSrc, [], FORBIDDEN_SCRIPT_SOURCES)) {
      errors.push(`CSP: script-src no puede incluir ${source}`)
    }
  }

  for (const [name, allowedSchemes] of Object.entries(HARDENED_DIRECTIVES)) {
    for (const source of unsafeSources(directives.get(name) ?? [], allowedSchemes)) {
      errors.push(`CSP: ${name} no puede incluir ${source}`)
    }
  }

  const connectSrc = directives.get('connect-src')
  if (!connectSrc) {
    errors.push('CSP: falta la directiva connect-src')
  } else {
    for (const required of ["'self'", ...WEBHOOK_HOSTS]) {
      if (!connectSrc.includes(required)) {
        errors.push(`CSP: connect-src debe incluir ${required}`)
      }
    }
    for (const source of connectSrc.filter((x) => isWildcardSource(x) || isBareScheme(x))) {
      errors.push(`CSP: connect-src no puede usar comodines (${source})`)
    }
  }

  return errors
}

const CSP_ENFORCING = 'Content-Security-Policy'
const CSP_REPORT_ONLY = 'Content-Security-Policy-Report-Only'
const GLOBAL_SOURCE = '/(.*)'

/**
 * Valida el contenido de `vercel.json`: rewrite SPA, cabeceras globales y CSP.
 * La CSP solo en Report-Only es válida pero genera una advertencia.
 * @param {object | null} config JSON ya parseado de `vercel.json`
 * @returns {{ errors: string[], warnings: string[] }}
 */
export function checkVercelConfig(config) {
  const errors = []
  const warnings = []
  const safe = config && typeof config === 'object' ? config : {}

  const hasSpaRewrite = (Array.isArray(safe.rewrites) ? safe.rewrites : []).some(
    (r) => r && r.source === GLOBAL_SOURCE && r.destination === '/index.html',
  )
  if (!hasSpaRewrite) {
    errors.push(`vercel.json: falta el rewrite SPA ${GLOBAL_SOURCE} -> /index.html`)
  }

  const globalBlock = (Array.isArray(safe.headers) ? safe.headers : []).find((h) => h && h.source === GLOBAL_SOURCE)
  if (!globalBlock) {
    errors.push(`vercel.json: faltan las cabeceras con source "${GLOBAL_SOURCE}" (deben aplicar a todas las respuestas)`)
    return { errors, warnings }
  }

  // Vercel trata los nombres de cabecera sin distinguir mayúsculas: se indexan en minúsculas.
  const lowered = new Map(
    (globalBlock.headers || []).filter((h) => h && typeof h.key === 'string').map((h) => [h.key.toLowerCase(), h.value]),
  )
  const byKey = { has: (key) => lowered.has(key.toLowerCase()), get: (key) => lowered.get(key.toLowerCase()) }

  for (const [key, expected] of Object.entries(REQUIRED_HEADERS)) {
    if (!byKey.has(key)) {
      errors.push(`vercel.json: falta la cabecera ${key}`)
    } else if (byKey.get(key) !== expected) {
      errors.push(`vercel.json: ${key} debe ser "${expected}" (es "${byKey.get(key)}")`)
    }
  }

  if (!byKey.has('Permissions-Policy')) {
    errors.push('vercel.json: falta la cabecera Permissions-Policy')
  } else {
    for (const feature of REQUIRED_PERMISSIONS) {
      if (!byKey.get('Permissions-Policy').includes(feature)) {
        errors.push(`vercel.json: Permissions-Policy debe incluir ${feature}`)
      }
    }
  }

  const cspKey = byKey.has(CSP_ENFORCING) ? CSP_ENFORCING : byKey.has(CSP_REPORT_ONLY) ? CSP_REPORT_ONLY : null
  if (!cspKey) {
    errors.push(`vercel.json: falta la cabecera ${CSP_ENFORCING}`)
  } else {
    errors.push(...checkCsp(byKey.get(cspKey)))
    if (cspKey === CSP_REPORT_ONLY) {
      warnings.push('CSP en modo reporte (Content-Security-Policy-Report-Only): el navegador no la aplica')
    }
  }

  return { errors, warnings }
}

const SITEMAP_NAMESPACE = 'http://www.sitemaps.org/schemas/sitemap/0.9'
const SITE_ORIGIN = 'https://www.facucode.dev/'

/**
 * Valida un sitemap XML (parseo con regex: el archivo es propio y simple).
 * @param {string} xml
 * @param {string[]} expectedUrls conjunto exacto de `<loc>` esperado
 * @returns {string[]} errores
 */
export function checkSitemap(xml, expectedUrls) {
  const errors = []
  const urlset = /<urlset\b([^>]*)>/.exec(xml)
  if (!urlset) {
    return ['sitemap.xml: no contiene un elemento <urlset>']
  }
  const attrs = urlset[1].replace(/\s+/g, '')
  if (!attrs.includes(`xmlns="${SITEMAP_NAMESPACE}"`) && !attrs.includes(`xmlns='${SITEMAP_NAMESPACE}'`)) {
    errors.push(`sitemap.xml: el <urlset> debe declarar xmlns="${SITEMAP_NAMESPACE}"`)
  }

  const locs = [...xml.matchAll(/<loc>\s*([^<]*?)\s*<\/loc>/g)].map((m) => m[1])
  const seen = new Set()
  for (const loc of locs) {
    if (!loc.startsWith(SITE_ORIGIN)) {
      errors.push(`sitemap.xml: <loc> debe ser una URL absoluta de ${SITE_ORIGIN} (es "${loc}")`)
    }
    if (seen.has(loc)) {
      errors.push(`sitemap.xml: <loc> duplicado ${loc}`)
    }
    seen.add(loc)
  }
  for (const url of expectedUrls) {
    if (!seen.has(url)) errors.push(`sitemap.xml: falta la URL ${url}`)
  }
  for (const loc of seen) {
    if (!expectedUrls.includes(loc) && loc.startsWith(SITE_ORIGIN)) {
      errors.push(`sitemap.xml: URL inesperada ${loc}`)
    }
  }
  return errors
}

/**
 * Valida `robots.txt`: política abierta y `Sitemap` absoluto (tolera `\r\n`).
 * @param {string} txt
 * @param {string} sitemapUrl URL absoluta esperada del sitemap
 * @returns {string[]} errores
 */
export function checkRobots(txt, sitemapUrl) {
  const errors = []
  const lines = String(txt).split(/\r?\n/).map((l) => l.trim())
  if (!lines.includes('User-agent: *')) errors.push('robots.txt: falta "User-agent: *"')
  if (!lines.includes('Allow: /')) errors.push('robots.txt: falta "Allow: /"')
  if (!lines.includes(`Sitemap: ${sitemapUrl}`)) {
    errors.push(`robots.txt: falta la línea "Sitemap: ${sitemapUrl}" (URL absoluta)`)
  }
  return errors
}
