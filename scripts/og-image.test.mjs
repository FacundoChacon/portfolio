/**
 * Imagen para compartir (`public/og-image.png`): lectura de PNG, plantilla HTML
 * y guard del archivo publicado. El render con Chromium (`npm run og:image`) es
 * manual y no forma parte de `npm test`.
 */
import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { readFileSync } from 'node:fs'
import test from 'node:test'

import { logoSvg } from '../src/data/logo.js'
import { EVA_LOGO_COLORS, EVA_THEME_COLORS } from '../src/styles/eva-tokens.js'
import {
  OG_IMAGE_HEIGHT,
  OG_IMAGE_MAX_BYTES,
  OG_IMAGE_TEXT,
  OG_IMAGE_WIDTH,
  buildOgImageHtml,
  escapeHtml,
  readPngInfo,
} from './lib/og-image.mjs'
import { LEGACY_RULES, scanLegacy } from './lib/legacy-guard.mjs'

/** Buffer sintético: firma PNG + chunk IHDR (13 bytes) con las dimensiones pedidas. */
function fakePng({ width, height, bitDepth = 8, colorType = 2 }) {
  const signature = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])
  const ihdr = Buffer.alloc(8 + 13 + 4)
  ihdr.writeUInt32BE(13, 0)
  ihdr.write('IHDR', 4, 'ascii')
  ihdr.writeUInt32BE(width, 8)
  ihdr.writeUInt32BE(height, 12)
  ihdr[16] = bitDepth
  ihdr[17] = colorType
  return Buffer.concat([signature, ihdr])
}

// --- readPngInfo ---

test('readPngInfo lee ancho, alto, profundidad y tipo de color del IHDR', () => {
  assert.deepEqual(readPngInfo(fakePng({ width: 1200, height: 630 })), {
    width: 1200,
    height: 630,
    bitDepth: 8,
    colorType: 2,
  })
})

test('readPngInfo distingue otras dimensiones y tipo de color', () => {
  assert.deepEqual(readPngInfo(fakePng({ width: 800, height: 418, colorType: 6 })), {
    width: 800,
    height: 418,
    bitDepth: 8,
    colorType: 6,
  })
})

test('readPngInfo rechaza firma inválida y buffers truncados con un error que dice PNG', () => {
  const invalido = fakePng({ width: 1200, height: 630 })
  invalido[1] = 0x00
  assert.throws(() => readPngInfo(invalido), /PNG/)
  assert.throws(() => readPngInfo(fakePng({ width: 1200, height: 630 }).subarray(0, 20)), /PNG/)
  assert.throws(() => readPngInfo(Buffer.alloc(0)), /PNG/)
})

test('constantes del formato: 1200x630 y tope de 300 KB', () => {
  assert.equal(OG_IMAGE_WIDTH, 1200)
  assert.equal(OG_IMAGE_HEIGHT, 630)
  assert.equal(OG_IMAGE_MAX_BYTES, 307200)
})

// --- buildOgImageHtml ---

const FONTS = { serif: 'data:font/woff2;base64,AAAA', mono: 'data:font/woff2;base64,BBBB' }
const html = buildOgImageHtml({ colors: EVA_THEME_COLORS, fonts: FONTS, logoColors: EVA_LOGO_COLORS })
const count = (text, fragment) => text.split(fragment).length - 1
const SVG_XMLNS = 'xmlns="http://www.w3.org/2000/svg"'

test('la plantilla contiene una sola vez nombre, rol y dominio', () => {
  assert.deepEqual(OG_IMAGE_TEXT, {
    name: 'Facundo Chacón',
    role: 'Desarrollador Full Stack Java / React',
    domain: 'facucode.dev',
  })
  for (const texto of Object.values(OG_IMAGE_TEXT)) assert.equal(count(html, texto), 1, texto)
})

test('la plantilla declara 1200x630 y usa los colores de los tokens', () => {
  assert.match(html, /1200px/)
  assert.match(html, /630px/)
  for (const role of ['black', 'primary', 'secondary', 'tertiary']) {
    assert.ok(html.toLowerCase().includes(EVA_THEME_COLORS[role].toLowerCase()), `falta el color del rol ${role}`)
  }
})

test('cambiar un color de la paleta cambia la plantilla sin editarla', () => {
  const alterada = buildOgImageHtml({ colors: { ...EVA_THEME_COLORS, primary: '#123456' }, fonts: FONTS, logoColors: EVA_LOGO_COLORS })
  assert.ok(alterada.includes('#123456'))
  assert.ok(!alterada.toLowerCase().includes(EVA_THEME_COLORS.primary.toLowerCase()))
  assert.ok(!alterada.includes('155 92 240') && !alterada.includes('155, 92, 240'), 'tinte derivado del primario original')
})

test('los @font-face usan solo data URLs y no hay recursos de terceros', () => {
  const sources = [...html.matchAll(/src:\s*(url\([^)]*\)[^;]*);/g)].map((m) => m[1])
  assert.equal(sources.length, 2)
  for (const src of sources) assert.match(src, /^url\(data:font\/woff2;base64,[A-Za-z0-9+/=]+\)/)
  // El unico http(s) permitido es el namespace `xmlns` del SVG del logo: no es un recurso que se descargue.
  assert.ok(!/https?:\/\//.test(html.replaceAll(SVG_XMLNS, '')), 'la plantilla no puede referenciar http(s)')
})

test('escapeHtml neutraliza los caracteres de marcado', () => {
  assert.equal(escapeHtml(`<b a="1">Tom & 'Jerry'</b>`), '&lt;b a=&quot;1&quot;&gt;Tom &amp; &#39;Jerry&#39;&lt;/b&gt;')
  assert.equal(escapeHtml('Facundo Chacón'), 'Facundo Chacón')
})

test('la plantilla no trae restos de la estética anterior', () => {
  assert.deepEqual(
    scanLegacy([{ path: 'og-image.html', source: html }], { rules: LEGACY_RULES, permitidos: [], pendientes: [] }),
    [],
  )
})

// --- glifo del logotipo (change logo-eva, design D7) ---

const LOGO_COMPLETO = logoSvg({ variante: 'completo', colores: EVA_LOGO_COLORS })

test('la plantilla contiene el glifo completo exactamente una vez, con los colores del logo', () => {
  assert.equal(count(html, LOGO_COMPLETO), 1)
  for (const hex of Object.values(EVA_LOGO_COLORS)) assert.ok(html.includes(hex), `falta ${hex}`)
  assert.equal(count(html, '<svg xmlns'), 1, 'un solo svg con namespace: el glifo (la grilla es otro svg sin xmlns)')
})

test('con logoColors falsos la plantilla usa los falsos y no los reales del logo', () => {
  const falsos = { fill: '#111111', edge: '#222222' }
  const alterada = buildOgImageHtml({ colors: EVA_THEME_COLORS, fonts: FONTS, logoColors: falsos })
  assert.equal(count(alterada, logoSvg({ variante: 'completo', colores: falsos })), 1)
  for (const real of Object.values(EVA_LOGO_COLORS)) assert.ok(!alterada.toLowerCase().includes(real.toLowerCase()), real)
})

test('el glifo va a la derecha y el contenido se acota a la izquierda para no superponerse', () => {
  assert.match(html, /\.logo\s*\{[^}]*position:\s*absolute[^}]*right:\s*\d+px/)
  assert.match(html, /\.content\s*\{[^}]*right:\s*(\d+)px/)
  const derecha = Number(/\.content\s*\{[^}]*right:\s*(\d+)px/.exec(html)[1])
  const ancho = Number(/\.logo\s*\{[^}]*width:\s*(\d+)px/.exec(html)?.[1])
  const margen = Number(/\.logo\s*\{[^}]*right:\s*(\d+)px/.exec(html)[1])
  assert.ok(derecha >= margen + ancho, `.content (right ${derecha}) debe dejar libre el glifo (${margen} + ${ancho})`)
})

// --- archivo publicado ---

const PNG_PATH = new URL('../public/og-image.png', import.meta.url)
/** SHA-256 de la og-image cyberpunk anterior: no puede volver a publicarse. */
const PNG_CYBERPUNK_SHA256 = 'ae97b9743efa5c66439d163a5583ba11d743da8048a4d3a94ec2344dbd38fcbe'

test('public/og-image.png es un PNG 1200x630 de a lo sumo 300 KB', () => {
  const buffer = readFileSync(PNG_PATH)
  const info = readPngInfo(buffer)
  assert.equal(info.width, OG_IMAGE_WIDTH)
  assert.equal(info.height, OG_IMAGE_HEIGHT)
  assert.ok([2, 6].includes(info.colorType), `colorType inesperado: ${info.colorType}`)
  assert.ok(
    buffer.length <= OG_IMAGE_MAX_BYTES,
    `og-image.png pesa ${buffer.length} bytes (tope ${OG_IMAGE_MAX_BYTES})`,
  )
})

test('public/og-image.png ya no es la imagen cyberpunk anterior', () => {
  const sha = createHash('sha256').update(readFileSync(PNG_PATH)).digest('hex')
  assert.notEqual(sha, PNG_CYBERPUNK_SHA256)
})
