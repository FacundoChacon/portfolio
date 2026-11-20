/**
 * Núcleo puro de transformación del HTML por ruta (sin I/O).
 *
 * Toma la plantilla (`dist/index.html`) y reemplaza el valor de cada etiqueta
 * de metadatos gestionada. No toca scripts, links de assets ni nada más.
 */

/**
 * Tabla de etiquetas gestionadas: cómo ubicarlas y qué valor de la meta llevan.
 * `attr` es el atributo cuyo valor se reemplaza (`content` / `href`).
 */
const MANAGED_TAGS = [
  { label: 'meta name="description"', tag: 'meta', key: 'name', id: 'description', attr: 'content', value: (m) => m.description },
  { label: 'link rel="canonical"', tag: 'link', key: 'rel', id: 'canonical', attr: 'href', value: (m) => m.canonical },
  { label: 'meta property="og:url"', tag: 'meta', key: 'property', id: 'og:url', attr: 'content', value: (m) => m.canonical },
  { label: 'meta property="og:title"', tag: 'meta', key: 'property', id: 'og:title', attr: 'content', value: (m) => m.socialTitle },
  { label: 'meta property="og:description"', tag: 'meta', key: 'property', id: 'og:description', attr: 'content', value: (m) => m.socialDescription },
  { label: 'meta property="og:image"', tag: 'meta', key: 'property', id: 'og:image', attr: 'content', value: (m) => m.image },
  { label: 'meta name="twitter:card"', tag: 'meta', key: 'name', id: 'twitter:card', attr: 'content', value: () => 'summary_large_image' },
  { label: 'meta name="twitter:title"', tag: 'meta', key: 'name', id: 'twitter:title', attr: 'content', value: (m) => m.socialTitle },
  { label: 'meta name="twitter:description"', tag: 'meta', key: 'name', id: 'twitter:description', attr: 'content', value: (m) => m.socialDescription },
  { label: 'meta name="twitter:image"', tag: 'meta', key: 'name', id: 'twitter:image', attr: 'content', value: (m) => m.image },
]

/** Escapa los caracteres con significado en HTML (válido en texto y en atributos entre comillas). */
export function escapeHtml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
}

const TITLE_REGEX = /(<title>)[^<]*(<\/title>)/g

/** Regex que ubica la etiqueta (en cualquier orden de atributos). */
function tagRegex({ tag, key, id }) {
  return new RegExp(String.raw`<${tag}\b[^>]*\b${key}=["']${id}["'][^>]*>`, 'g')
}

/** Regex del atributo cuyo valor se reemplaza dentro de una etiqueta. */
function attrRegex(attr) {
  return new RegExp(String.raw`(\b${attr}=)(["'])[\s\S]*?\2`)
}

/** Falla si la plantilla no tiene exactamente una coincidencia de la etiqueta. */
function assertExactlyOne(count, label) {
  if (count === 0) throw new Error(`route-html: falta la etiqueta ${label} en la plantilla`)
  if (count > 1) throw new Error(`route-html: la etiqueta ${label} está repetida (${count} veces) en la plantilla`)
}

/**
 * Genera el HTML de una ruta a partir de la plantilla. Lanza un `Error` que
 * nombra la etiqueta si falta o está repetida (así falla el build).
 * @param {string} html plantilla con todas las etiquetas gestionadas
 * @param {import('../../src/data/seo.js').RouteMeta} meta
 * @returns {string}
 */
export function renderRouteHtml(html, meta) {
  assertExactlyOne((html.match(TITLE_REGEX) ?? []).length, '<title>')
  let out = html.replace(TITLE_REGEX, (_, open, close) => `${open}${escapeHtml(meta.title)}${close}`)
  for (const spec of MANAGED_TAGS) {
    const regex = tagRegex(spec)
    assertExactlyOne((out.match(regex) ?? []).length, spec.label)
    const replaceAttr = attrRegex(spec.attr)
    out = out.replace(regex, (tag) => tag.replace(replaceAttr, (_, name) => `${name}"${escapeHtml(spec.value(meta))}"`))
  }
  return out
}

/** Inversa de `escapeHtml`. */
function unescapeHtml(value) {
  return value.replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&amp;/g, '&')
}

/** Valor de un atributo dentro de una etiqueta (texto original, sin escapar) o `null`. */
function readAttr(tag, attr) {
  const match = new RegExp(String.raw`\b${attr}=(["'])([\s\S]*?)\1`).exec(tag)
  return match ? unescapeHtml(match[2]) : null
}

/** Valor del atributo de la primera etiqueta gestionada que coincida, o `null`. */
function readManaged(html, id) {
  const spec = MANAGED_TAGS.find((s) => s.id === id)
  const tag = html.match(tagRegex(spec))?.[0]
  return tag ? readAttr(tag, spec.attr) : null
}

/**
 * Lectura inversa para la verificación del build: metadatos declarados en el
 * HTML, scripts inline, atributos `on*` y URLs de assets (script src y links
 * de hojas de estilo / modulepreload) en orden de documento.
 * @param {string} html
 */
export function extractHeadMeta(html) {
  const title = /<title>([^<]*)<\/title>/.exec(html)
  const assetUrls = []
  let inlineScripts = 0
  for (const [tag, name] of html.matchAll(/<(script|link)\b[^>]*>/g)) {
    if (name === 'script') {
      const src = readAttr(tag, 'src')
      if (src === null) inlineScripts += 1
      else assetUrls.push(src)
    } else if (/\brel=["'](?:stylesheet|modulepreload)["']/.test(tag)) {
      const href = readAttr(tag, 'href')
      if (href !== null) assetUrls.push(href)
    }
  }
  const inlineHandlers = [...html.matchAll(/<[a-zA-Z][^>]*?\s(on[a-z]+)\s*=/g)].map((m) => m[1].toLowerCase())
  return {
    title: title ? unescapeHtml(title[1]) : null,
    description: readManaged(html, 'description'),
    canonical: readManaged(html, 'canonical'),
    ogUrl: readManaged(html, 'og:url'),
    ogImage: readManaged(html, 'og:image'),
    twitterCard: readManaged(html, 'twitter:card'),
    twitterImage: readManaged(html, 'twitter:image'),
    inlineScripts,
    inlineHandlers,
    assetUrls,
  }
}

/**
 * Archivo (relativo a `dist/`) donde se escribe el HTML de una ruta. Punto
 * único de cambio si hubiera que pasar al plan B de D1 (`configurador.html`).
 * @param {string} pathOrUrl ruta (`/configurador`) o URL absoluta del sitio
 * @returns {string}
 */
export function routeOutputFile(pathOrUrl) {
  const path = String(pathOrUrl).replace(/^https?:\/\/[^/]+/, '') || '/'
  const trimmed = path.replace(/\/+$/, '')
  return trimmed === '' ? 'index.html' : `${trimmed.slice(1)}/index.html`
}
