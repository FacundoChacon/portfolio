/**
 * Tests del hero brutalista (change `hero-brutalista`): datos puros, guard
 * estático de `Hero.jsx`, contraste y animación de entrada.
 */
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'

import { EVA_COLORS } from '../src/styles/eva-tokens.js'
import tailwindConfig from '../tailwind.config.js'
import { findForbiddenTokens, withoutMotionSafe } from './lib/class-guard.mjs'
import { blendOver, checkContrastPairs, contrastRatio } from './lib/contrast.mjs'
import { ruleBody } from './lib/css-rules.mjs'
import { TIEMPOS } from '../src/utils/escritura.js'
import {
  DESCRIPCION,
  ENLACES_PERFIL,
  FICHA,
  KICKER,
  PERFIL,
  RETRATO,
  SUBTITULO,
  externalLinkProps,
  nombreCompleto,
} from '../src/data/presentacion.js'

const ROOT = new URL('../', import.meta.url)
const read = (path) => readFileSync(new URL(path, ROOT), 'utf8')

/** Lee ancho/alto de un WebP (VP8, VP8L o VP8X) desde su cabecera. */
function webpSize(buffer) {
  assert.equal(buffer.toString('ascii', 0, 4), 'RIFF')
  assert.equal(buffer.toString('ascii', 8, 12), 'WEBP')
  const kind = buffer.toString('ascii', 12, 16)
  if (kind === 'VP8 ') return { width: buffer.readUInt16LE(26) & 0x3fff, height: buffer.readUInt16LE(28) & 0x3fff }
  if (kind === 'VP8X') return { width: buffer.readUIntLE(24, 3) + 1, height: buffer.readUIntLE(27, 3) + 1 }
  if (kind === 'VP8L') {
    const bits = buffer.readUInt32LE(21)
    return { width: (bits & 0x3fff) + 1, height: ((bits >> 14) & 0x3fff) + 1 }
  }
  throw new Error(`WebP desconocido: ${kind}`)
}

// --- Datos (design D1) ---------------------------------------------------

test('nombreCompleto: nombre y apellido reales', () => {
  assert.equal(nombreCompleto(PERFIL), 'Facundo Chacón')
})

test('nombreCompleto: triangula con otros nombres y recorta espacios', () => {
  assert.equal(nombreCompleto({ nombre: 'Ana', apellido: 'Gómez' }), 'Ana Gómez')
  assert.equal(nombreCompleto({ nombre: '  Ana ', apellido: ' Gómez  ' }), 'Ana Gómez')
  assert.equal(nombreCompleto({ nombre: 'Ana', apellido: '' }), 'Ana')
})

test('FICHA: ids y orden, con etiqueta y valor no vacíos', () => {
  assert.deepEqual(FICHA.map((fila) => fila.id), ['rol', 'stack', 'ubicacion', 'estado'])
  for (const fila of FICHA) {
    assert.ok(fila.etiqueta.trim() && fila.valor.trim(), `fila ${fila.id} incompleta`)
  }
})

test('FICHA: el estado es "ok" y lo dice con texto, no solo con tono', () => {
  const estado = FICHA.find((fila) => fila.id === 'estado')
  assert.equal(estado.tono, 'ok')
  assert.match(estado.valor, /operativo/i)
  assert.deepEqual(FICHA.filter((fila) => fila.tono).map((fila) => fila.id), ['estado'])
})

test('FICHA: el rol coincide con el del perfil', () => {
  assert.equal(FICHA.find((fila) => fila.id === 'rol').valor, PERFIL.rol)
})

test('ENLACES_PERFIL: GitHub y LinkedIn con https y ids únicos', () => {
  assert.deepEqual(ENLACES_PERFIL.map((e) => e.id), ['github', 'linkedin'])
  assert.equal(new Set(ENLACES_PERFIL.map((e) => e.id)).size, ENLACES_PERFIL.length)
  for (const { href, label } of ENLACES_PERFIL) {
    assert.ok(label.trim())
    assert.match(href, /^https:\/\//)
    assert.doesNotThrow(() => new URL(href))
  }
})

test('externalLinkProps: pestaña nueva sin acceso a la ventana de origen', () => {
  assert.deepEqual(externalLinkProps(), { target: '_blank', rel: 'noopener noreferrer' })
})

test('RETRATO: dimensiones iguales a la cabecera de public/profile.webp', () => {
  const { width, height } = webpSize(readFileSync(new URL('public/profile.webp', ROOT)))
  assert.deepEqual({ width: RETRATO.width, height: RETRATO.height }, { width, height })
  assert.equal(RETRATO.src, '/profile.webp')
  assert.match(RETRATO.alt, /Facundo Chacón/)
})

// --- Animación de entrada (design D7) --------------------------------------

test('tailwind: animation eva-boot usa evaBoot y dura <= 0.4s', () => {
  const animation = tailwindConfig.theme.extend.animation['eva-boot']
  assert.ok(animation, 'falta animation["eva-boot"]')
  assert.match(animation, /^evaBoot\s/)
  const seconds = Number(animation.match(/(\d*\.?\d+)s/)?.[1])
  assert.ok(seconds > 0 && seconds <= 0.4, `duración ${seconds}s fuera de (0, 0.4]`)
})

test('tailwind: el keyframe evaBoot solo anima clip-path (sin propiedades de layout)', () => {
  const frames = tailwindConfig.theme.extend.keyframes.evaBoot
  assert.ok(frames, 'falta keyframes.evaBoot')
  const props = new Set(Object.values(frames).flatMap((frame) => Object.keys(frame)))
  assert.deepEqual([...props], ['clip-path'])
})

test('tailwind: las animaciones cyberpunk ya no existen (limpieza-cyberpunk) y eva-boot se conserva', () => {
  const animation = tailwindConfig.theme.extend.animation
  for (const name of ['fade-in', 'slide-up', 'pulse-slow', 'flicker']) assert.ok(!(name in animation), `sobra ${name}`)
  assert.ok(animation['eva-boot'], 'falta eva-boot')
})

// --- Guard estático de Hero.jsx (design D10) -------------------------------

const HERO = read('src/components/Hero.jsx')

/** Token de utilidad con variantes opcionales (`md:`, `hover:`...). */
const util = (body) => new RegExp(String.raw`(?<![\w-])(?:[\w-]+:)*${body}(?![\w-])`)

const FORBIDDEN_RULES = [
  { rule: 'accent-*', pattern: util(String.raw`(?:bg|text|border|from|to|via|shadow|ring)-accent-[\w/]+`) },
  { rule: 'neon-*', pattern: /neon-/ },
  { rule: 'dark', pattern: util(String.raw`(?:bg|text|border|from|to|via)-dark(?:-\w+)?`) },
  { rule: 'glow', pattern: /glow/ },
  { rule: 'glitch', pattern: /glitch/i },
  { rule: 'flicker', pattern: /flicker/ },
  { rule: 'cyber-grid', pattern: /cyber-grid/ },
  { rule: 'blur-', pattern: util(String.raw`blur(?:-[\w[\]]+)?`) },
  { rule: 'backdrop-', pattern: /backdrop-/ },
  { rule: 'rounded', pattern: util(String.raw`rounded(?:-[\w[\]]+)?`) },
  { rule: 'font-display', pattern: util('font-display') },
  { rule: 'text-white', pattern: /text-white/ },
  { rule: 'text-gray-N', pattern: /text-gray-\d/ },
  { rule: 'hex literal', pattern: /#[0-9a-fA-F]{3,8}(?![\w-])/ },
  { rule: 'loading=lazy', pattern: /loading=["{'`]+lazy/ },
  { rule: 'order-', pattern: util(String.raw`order-[\w[\]-]+`) },
  { rule: '--eva-hex-color', pattern: /--eva-hex-color/ },
  { rule: 'texto eva-primary/gray-dim', pattern: /text-eva-(?:primary|gray-dim)(?![\w-])/ },
  { rule: 'nombre de color de acento', pattern: /eva-(?:orange|purple|green|red|violet|aqua|sky)(?![\w-])/ },
  { rule: 'animate sin motion-safe', pattern: withoutMotionSafe(String.raw`animate-[\w-]+`) },
  { rule: 'hover translate sin motion-safe', pattern: withoutMotionSafe(String.raw`hover:-?translate-[xy]-[\w.]+`) },
  { rule: 'focus translate sin motion-safe', pattern: withoutMotionSafe(String.raw`focus-visible:-?translate-[xy]-[\w.]+`) },
]

test('Hero.jsx: sin clases cyberpunk ni utilidades prohibidas', () => {
  assert.deepEqual(findForbiddenTokens(HERO, FORBIDDEN_RULES), [])
})

test('guard de Hero: las reglas detectan el hero cyberpunk anterior (triangulación)', () => {
  const viejo = `<div className="cyber-grid blur-[120px] rounded-lg bg-accent-green/20 box-glow-cyan order-2 md:order-1">
    <h1 className="font-display text-white animate-flicker"><img loading="lazy" /></h1>
    <a className="hover:-translate-y-0.5 text-gray-400">`
  const reglas = new Set(findForbiddenTokens(viejo, FORBIDDEN_RULES).map((f) => f.rule))
  for (const regla of [
    'accent-*', 'glow', 'flicker', 'cyber-grid', 'blur-', 'rounded', 'font-display', 'text-white',
    'text-gray-N', 'loading=lazy', 'order-', 'animate sin motion-safe', 'hover translate sin motion-safe',
  ]) {
    assert.ok(reglas.has(regla), `la regla "${regla}" no detectó el hero viejo`)
  }
})

test('guard de Hero: lo permitido no dispara reglas (font-eva-display, motion-safe)', () => {
  const ok = `<h1 className="font-eva-display font-stretch-extra-condensed motion-safe:animate-eva-boot motion-safe:hover:-translate-y-0.5 border-eva-primary">`
  assert.deepEqual(findForbiddenTokens(ok, FORBIDDEN_RULES), [])
})

test('Hero.jsx: contiene los elementos requeridos', () => {
  const required = [
    'id="presentacion"', 'font-eva-display', 'font-stretch-', 'whitespace-nowrap', 'eva-hex-grid', 'eva-stripes',
    'eva-panel-label', 'eva-panel-code', 'fetchpriority="high"', 'decoding="async"', 'aria-hidden', 'sr-only',
    'RETRATO', 'FICHA', 'ENLACES_PERFIL', 'externalLinkProps', 'nombreCompleto', 'motion-safe:',
  ]
  assert.deepEqual(required.filter((token) => !HERO.includes(token)), [])
  assert.equal((HERO.match(/<h1\b/g) ?? []).length, 1)
})

/**
 * Problemas de integración de la entrada escrita en el marcado del hero (D4, D7).
 * @param {string} source
 * @returns {string[]}
 */
function integracionHeroProblems(source) {
  const problems = []
  const img = source.match(/<img\b[\s\S]*?\/>/)?.[0] ?? ''
  const h1 = source.match(/<h1\b[^>]*>/)?.[0] ?? ''
  if (!img || !h1) return ['faltan <img> o <h1>']
  if (/(?<![\w-])(?:animate-|opacity-|invisible|hidden|clip)/.test(img.replace(/aria-hidden/g, ''))) problems.push('la <img> se anima, oculta o recorta')
  if (!img.includes('fetchpriority="high"')) problems.push('la <img> perdió fetchpriority="high"')
  if (!h1.includes('aria-label=')) problems.push('el h1 perdió su aria-label')
  if (/(?<![\w-])(?:[\w-]+:)*(?:animate-|opacity-|invisible|hidden)/.test(h1)) problems.push('el h1 se anima u oculta')
  const figure = source.match(/<figure\b[\s\S]*?<\/figure>/)?.[0] ?? ''
  if (!/<span\b[^>]*aria-hidden="true"[^>]*data-obturador|<span\b[^>]*data-obturador[^>]*aria-hidden="true"/.test(figure)) {
    problems.push('falta el obturador aria-hidden dentro de la figure')
  }
  if (!/<section\b[^>]*data-escritura=/.test(source)) problems.push('la sección no expone data-escritura')
  if (!/opacity-0/.test(source)) problems.push('las acciones y la ficha no usan opacity-0')
  const fuera = source.replace(/aria-hidden/g, '')
  if (/(?<![\w-])(?:[\w-]+:)*(?:invisible|hidden)(?![\w-])/.test(fuera.replace(/\bhidden items-center\b|\bhidden w-2\b|\bhidden\s+w-2\b/g, ''))) {
    problems.push('oculta con invisible/hidden')
  }
  const usos = (source.match(/<TextoEscrito\b/g) ?? []).length
  if (usos < 7) problems.push('' + usos + ' usos de TextoEscrito (se esperan 5 + dt y dd)')
  if (/\bstyle=/.test(source)) problems.push('usa style= (CSP)')
  return problems
}

test('Hero.jsx: la escritura se integra sin tocar la <img> ni el h1 (candidatos a LCP)', () => {
  assert.deepEqual(integracionHeroProblems(HERO), [])
})

test('integracionHeroProblems: rechaza una <img> animada y un hero sin escritura (triangulación)', () => {
  const malo = '<section id="presentacion"><h1 className="animate-x"><figure><img className="opacity-0" fetchpriority="high" /></figure>'
  const problemas = integracionHeroProblems(malo)
  for (const esperado of [
    'la <img> se anima, oculta o recorta',
    'el h1 perdió su aria-label',
    'el h1 se anima u oculta',
    'falta el obturador aria-hidden dentro de la figure',
    'la sección no expone data-escritura',
  ]) assert.ok(problemas.includes(esperado), esperado)
  assert.ok(problemas.includes('0 usos de TextoEscrito (se esperan 5 + dt y dd)'))
})

test('package.json: sin librerías de animación ni de tipeo (la escritura es CSS + rAF)', () => {
  const pkg = JSON.parse(read('package.json'))
  const todas = Object.keys({ ...pkg.dependencies, ...pkg.devDependencies })
  const prohibidas = ['gsap', 'framer-motion', 'motion', 'typed.js', 'react-type-animation']
  assert.deepEqual(todas.filter((nombre) => prohibidas.includes(nombre)), [])
})

test('Home.jsx: un único <h1> en los componentes montados', () => {
  const home = read('src/pages/Home.jsx')
  const names = [...home.matchAll(/import\s+\w+\s+from\s+['"]\.\.\/components\/(\w+)['"]/g)].map((m) => m[1])
  assert.ok(names.includes('Hero'))
  const total = names.reduce((n, name) => n + (read(`src/components/${name}.jsx`).match(/<h1\b/g) ?? []).length, 0)
  assert.equal(total, 1)
})

// --- Contraste (design D9) -------------------------------------------------

const HERO_CONTRAST_PAIRS = [
  { fg: 'paper', bg: 'black', level: 'normal' },
  { fg: 'gray', bg: 'black', level: 'normal' },
  { fg: 'violet-light', bg: 'black', level: 'normal' },
  { fg: 'black', bg: 'violet', level: 'normal' },
  { fg: 'paper', bg: 'panel', level: 'normal' },
  { fg: 'gray', bg: 'panel', level: 'normal' },
  { fg: 'aqua', bg: 'panel', level: 'normal' },
  { fg: 'violet-light', bg: 'panel', level: 'normal' },
  { fg: 'orange', bg: 'black', level: 'ui' },
  { fg: 'gray-dim', bg: 'black', level: 'ui' },
]

test('contraste: pares de colores del hero cumplen su umbral', () => {
  assert.deepEqual(checkContrastPairs(EVA_COLORS, HERO_CONTRAST_PAIRS), [])
})

test('contraste: un par que no cumple se informa (triangulación)', () => {
  assert.equal(checkContrastPairs(EVA_COLORS, [{ fg: 'gray-dim', bg: 'black', level: 'normal' }]).length, 1)
})

function hexGridAlpha() {
  const fallback = read('src/index.css').match(/--eva-hex-color,\s*rgb\(\s*155\s+92\s+240\s*\/\s*([\d.]+)\s*\)/)
  assert.ok(fallback, 'no se encontró el fallback de --eva-hex-color')
  return Number(fallback[1])
}

test('contraste: texto sobre la grilla hex (alpha leído de index.css) >= 4.5', () => {
  const grilla = blendOver(EVA_COLORS.violet, EVA_COLORS.black, hexGridAlpha())
  for (const token of ['paper', 'gray', 'violet-light', 'orange', 'aqua']) {
    const ratio = contrastRatio(EVA_COLORS[token], grilla)
    assert.ok(ratio >= 4.5, `${token} sobre la grilla: ${ratio.toFixed(2)} < 4.5`)
  }
})

test('contraste: con alpha 0.6 el gris sobre la grilla falla (protege la opacidad)', () => {
  const grilla = blendOver(EVA_COLORS.violet, EVA_COLORS.black, 0.6)
  assert.ok(contrastRatio(EVA_COLORS.gray, grilla) < 4.5)
})

// --- Jerarquía de color por rol (jerarquia-color-violeta, D4) ---

test('Hero.jsx: eyebrow y apellido en primary-light, CTA y figura en primary con sombra secondary', () => {
  const faltan = [
    'tracking-[0.3em] text-eva-primary-light',
    'whitespace-nowrap text-eva-primary-light">',
    'border-2 border-eva-primary bg-eva-primary',
    'shadow-[6px_6px_0_0_var(--eva-secondary)]',
    'border-2 border-eva-primary bg-eva-panel shadow-[10px_10px_0_0_var(--eva-secondary)]',
    'hover:border-eva-secondary hover:text-eva-secondary',
    'text-eva-tertiary',
    'eva-stripes eva-stripes-primary h-3 w-full',
  ].filter((token) => !HERO.includes(token))
  assert.deepEqual(faltan, [])
})

test('Hero.jsx: la franja vertical de la figura sigue siendo secondary (eva-stripes sin modificador)', () => {
  const linea = HERO.split('\n').find((l) => l.includes('absolute -right-6 inset-y-4'))
  assert.ok(linea && !linea.includes('eva-stripes-primary'))
})

// --- Sin glifo del logotipo (change logo-eva: el hero lo descarto el usuario) ---

/**
 * Referencias al logotipo que el hero no debe tener.
 * @param {string} source
 * @returns {string[]}
 */
function heroLogoLeaks(source) {
  return [/LogoEva/, /data\/logo/, /eva-logo/].filter((p) => p.test(source)).map(String)
}

test('Hero no renderiza el glifo del logotipo', () => {
  assert.deepEqual(heroLogoLeaks(HERO), [])
})

test('heroLogoLeaks: detecta el import, el uso y las clases del logo (triangulación)', () => {
  assert.equal(heroLogoLeaks('import LogoEva from "./LogoEva"; <LogoEva variante="completo" />').length, 1)
  assert.equal(heroLogoLeaks('<g className="eva-logo-relleno" />').length, 1)
  assert.equal(heroLogoLeaks('import { LOGO_VARIANTES } from "../data/logo"').length, 1)
})

test('Hero.jsx: el contenido de la columna de texto no es relative (sin envoltorio del glifo)', () => {
  assert.ok(!HERO.includes('relative md:col-span-7'))
})

// --- Hueco del hero (change hero-escritura, D1) ---------------------------

/**
 * Problemas de layout que reabren el hueco bajo las acciones del hero.
 * @param {string} source
 * @returns {string[]}
 */
function heroLayoutProblems(source) {
  const problems = []
  const section = source.match(/<section\b[^>]*>/)?.[0] ?? ''
  if (/min-h-screen/.test(section)) problems.push('la sección fuerza min-h-screen')
  if (/(?<![\w-])md:mt-16(?![\w-])/.test(source)) problems.push('la columna derecha se desplaza con md:mt-16')
  if (/(?<![\w-])md:-mt-10(?![\w-])/.test(source)) problems.push('la ficha conserva el solape antiguo md:-mt-10')
  for (const token of ['md:-mt-24', 'lg:-mt-36']) {
    if (!source.includes(token)) problems.push(`falta ${token} en la ficha`)
  }
  if (!source.includes('aspect-[4/5]')) problems.push('el retrato perdió aspect-[4/5]')
  if (!/eva-panel relative z-10 mt-10 /.test(source)) problems.push('la ficha perdió mt-10 en móvil')
  return problems
}

test('Hero.jsx: sin min-h-screen ni md:mt-16 y con la ficha superpuesta al retrato', () => {
  assert.deepEqual(heroLayoutProblems(HERO), [])
})

test('heroLayoutProblems: rechaza el markup anterior y acepta el nuevo (triangulación)', () => {
  const anterior = `<section id="presentacion" className="relative flex min-h-screen flex-col"><div className="md:col-span-5 md:mt-16"><img className="aspect-[4/5]" /><div className="eva-panel relative z-10 mt-10 p-5 md:-ml-8 md:-mt-10">`
  const problemas = heroLayoutProblems(anterior)
  assert.equal(problemas.length, 5)
  assert.ok(problemas.some((p) => p.includes('min-h-screen')))
  assert.ok(problemas.some((p) => p.includes('md:mt-16')))
  const nuevo = `<section id="presentacion" className="relative"><div className="md:col-span-5"><img className="aspect-[4/5]" /><div className="eva-panel relative z-10 mt-10 p-5 md:-ml-8 md:-mt-24 lg:-mt-36">`
  assert.deepEqual(heroLayoutProblems(nuevo), [])
})

// --- Textos de la escritura (change hero-escritura, 4.1) -------------------

test('KICKER y DESCRIPCION: texto exacto que se mostraba en el hero', () => {
  assert.equal(KICKER, '01 // Presentación')
  assert.equal(
    DESCRIPCION,
    'Construyo experiencias full stack de punta a punta: APIs robustas con Java 17 y Spring Boot, interfaces reactivas con React y Tailwind CSS. Actualmente buscando mi primera oportunidad profesional.',
  )
})

test('KICKER, SUBTITULO y DESCRIPCION: no vacíos, sin espacios dobles ni saltos de línea', () => {
  for (const texto of [KICKER, SUBTITULO, DESCRIPCION]) {
    assert.ok(texto.trim().length > 0)
    assert.equal(texto, texto.trim())
    assert.ok(!/\s{2,}|\n/.test(texto), `espacios o saltos en "${texto.slice(0, 20)}"`)
  }
})

test('SUBTITULO: rol y especialidad del perfil separados por un punto medio', () => {
  assert.equal(SUBTITULO, 'Full Stack Developer · Java / React')
  assert.equal(SUBTITULO, `${PERFIL.rol} · ${PERFIL.especialidad}`)
})

// --- Texto escrito accesible y cursor (change hero-escritura, 5.1, 5.3, 5.4) -

/**
 * Problemas de un componente de texto escrito: copia accesible, capa visual
 * oculta a lectores de pantalla y reserva del tramo sin escribir.
 * @param {string} source
 * @returns {string[]}
 */
function textoEscritoProblems(source) {
  const problems = []
  if (!/className="sr-only"/.test(source)) problems.push('falta la copia sr-only con el texto real')
  if (!/aria-hidden="true"/.test(source)) problems.push('la capa visual no es aria-hidden')
  if (!/estadosDeCaracteres/.test(source)) problems.push('no usa estadosDeCaracteres')
  if (!/text-transparent/.test(source)) problems.push('el tramo reservado no usa text-transparent')
  if (/(?<![\w-])(?:invisible|hidden|opacity-0)(?![\w-])/.test(source)) problems.push('oculta con invisible/hidden/opacity-0')
  if (/\bstyle=/.test(source)) problems.push('usa style= (CSP)')
  if (/dangerouslySetInnerHTML/.test(source)) problems.push('usa dangerouslySetInnerHTML')
  if (!/direccion/.test(source)) problems.push('no acepta direccion')
  if (!/accesible/.test(source)) problems.push('no tiene modo decorativo/externo (accesible)')
  return problems
}

const TEXTO_ESCRITO = read('src/components/TextoEscrito.jsx')

test('TextoEscrito.jsx: copia sr-only, capa aria-hidden, reserva transparente y sin style', () => {
  assert.deepEqual(textoEscritoProblems(TEXTO_ESCRITO), [])
})

test('textoEscritoProblems: rechaza un componente con invisible o style inline (triangulación)', () => {
  const conInvisible = `<span className="sr-only">{texto}</span><span aria-hidden="true">{p.visible}<span className="invisible">{p.reservado}</span></span> estadosDeCaracteres direccion accesible`
  assert.deepEqual(textoEscritoProblems(conInvisible), [
    'el tramo reservado no usa text-transparent',
    'oculta con invisible/hidden/opacity-0',
  ])
  const conStyle = `<span className="sr-only">{texto}</span><span aria-hidden="true" style={{ width }}><b className="text-transparent" /></span> estadosDeCaracteres direccion accesible`
  assert.deepEqual(textoEscritoProblems(conStyle), ['usa style= (CSP)'])
  const sinCopia = `<span aria-hidden="true"><b className="text-transparent" /></span> estadosDeCaracteres direccion accesible`
  assert.deepEqual(textoEscritoProblems(sinCopia), ['falta la copia sr-only con el texto real'])
})

/**
 * Problemas del cursor de la escritura en `index.css`: bloque sólido sin parpadeo ni elementos que se desplacen.
 * @param {string} css
 * @returns {string[]}
 */
function cursorEscrituraProblems(css) {
  const base = ruleBody(css, '.eva-cursor-escritura')
  if (base === null) return ['falta la regla del cursor']
  const problems = []
  if (!/background-color:\s*var\(--eva-primary-light\)/.test(base)) problems.push('el cursor no usa eva-primary-light')
  if (/animation|position:\s*absolute/.test(base)) problems.push('el cursor tiene animation o se posiciona (suma CLS)')
  if (/@keyframes\s+eva-cursor-escritura/.test(css)) problems.push('hay keyframes de parpadeo del cursor')
  const reducido = ruleBody(css, '.eva-cursor-escritura', { within: '@media (prefers-reduced-motion: reduce)' })
  if (reducido === null || !/background-color:\s*transparent/.test(reducido)) problems.push('con movimiento reducido el cursor se muestra')
  return problems
}

const INDEX_CSS = read('src/index.css')

test('index.css: cursor de escritura sólido, sin animación, sin posicionarse y oculto con movimiento reducido', () => {
  assert.deepEqual(cursorEscrituraProblems(INDEX_CSS), [])
})

test('cursorEscrituraProblems: detecta parpadeo, elemento posicionado y falta de regla (triangulación)', () => {
  const parpadea = `.eva-cursor-escritura { position: absolute; background-color: red; animation: eva-cursor-escritura 1s infinite }
@keyframes eva-cursor-escritura { 50% { opacity: 0 } }`
  assert.deepEqual(cursorEscrituraProblems(parpadea), [
    'el cursor no usa eva-primary-light',
    'el cursor tiene animation o se posiciona (suma CLS)',
    'hay keyframes de parpadeo del cursor',
    'con movimiento reducido el cursor se muestra',
  ])
  assert.deepEqual(cursorEscrituraProblems('.otra { color: red }'), ['falta la regla del cursor'])
})

test('tailwind: eva-obturador anima solo clip-path con pasos y dura lo que el marco de la línea de tiempo', () => {
  const animation = tailwindConfig.theme.extend.animation['eva-obturador']
  assert.match(animation ?? '', /^evaObturador\s[\d.]+s steps\(\d+, end\) forwards$/)
  assert.equal(Number(animation.match(/([\d.]+)s/)[1]) * 1000, TIEMPOS.marco)
  const frames = tailwindConfig.theme.extend.keyframes.evaObturador
  assert.ok(frames, 'falta keyframes.evaObturador')
  assert.deepEqual([...new Set(Object.values(frames).flatMap((frame) => Object.keys(frame)))], ['clip-path'])
  assert.equal(frames['0%']['clip-path'], 'inset(0 0 0 0)')
  assert.equal(frames['100%']['clip-path'], 'inset(0 0 0 100%)')
})

test('tailwind: eva-boot y eva-obturador son las únicas animaciones y ninguna parpadea', () => {
  const animation = tailwindConfig.theme.extend.animation
  assert.deepEqual(Object.keys(animation).sort(), ['eva-boot', 'eva-obturador'])
  for (const valor of Object.values(animation)) assert.ok(!/infinite/.test(valor), `${valor} se repite`)
})

// --- Hook useEscrituraHero (change hero-escritura, 6.1) --------------------

/**
 * Problemas del ciclo de vida del hook de la entrada escrita.
 * @param {string} source
 * @returns {string[]}
 */
function hookEscrituraProblems(source) {
  const problems = []
  const codigo = source.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/.*$/gm, '')
  if (!/from\s+['"]\.\.\/utils\/motion['"]/.test(codigo) || !/REDUCED_MOTION_QUERY/.test(codigo) || !/prefersReducedMotion/.test(codigo)) {
    problems.push('no usa prefersReducedMotion/REDUCED_MOTION_QUERY de utils/motion')
  }
  if (!/from\s+['"]\.\.\/utils\/escritura['"]/.test(codigo)) problems.push('no usa los helpers de utils/escritura')
  if (!/requestAnimationFrame\(/.test(codigo)) problems.push('no usa requestAnimationFrame')
  if (!/cancelAnimationFrame\(/.test(codigo)) problems.push('no cancela el rAF en el cleanup')
  for (const evento of ['keydown', 'focusin', 'change']) {
    if (!new RegExp(String.raw`addEventListener\(\s*['"]${evento}['"]`).test(codigo)) problems.push(`no escucha ${evento}`)
    if (!new RegExp(String.raw`removeEventListener\(\s*['"]${evento}['"]`).test(codigo)) problems.push(`no remueve ${evento}`)
  }
  if (!/^let\s+\w*[Ee]jecutada\s*=\s*false/m.test(codigo)) problems.push('falta el flag de módulo de una sola ejecución')
  if (/setInterval|setTimeout|\bstyle\b/.test(codigo)) problems.push('usa timers o style')
  return problems
}

test('useEscrituraHero.js: rAF con cleanup, listeners removidos y flag de una sola ejecución', () => {
  assert.deepEqual(hookEscrituraProblems(read('src/hooks/useEscrituraHero.js')), [])
})

test('hookEscrituraProblems: rechaza un hook que no cancela el rAF ni limpia listeners (triangulación)', () => {
  const malo = `import { prefersReducedMotion, REDUCED_MOTION_QUERY } from '../utils/motion'
import { estadoEn } from '../utils/escritura'
let escrituraEjecutada = false
useEffect(() => { requestAnimationFrame(frame); window.addEventListener('keydown', f); setInterval(f, 10) }, [])`
  assert.deepEqual(hookEscrituraProblems(malo), [
    'no cancela el rAF en el cleanup',
    'no remueve keydown',
    'no escucha focusin',
    'no remueve focusin',
    'no escucha change',
    'no remueve change',
    'usa timers o style',
  ])
})
