/**
 * Tests del change `logo-eva`: colores del logotipo (tokens), geometria unica, serializador,
 * componente, favicon e icono tactil. Estilo del repo: `node:test` + guards estaticos + funciones puras.
 */
import assert from 'node:assert/strict'
import { readdirSync, readFileSync, statSync } from 'node:fs'
import test from 'node:test'

import tailwindConfig from '../tailwind.config.js'
import {
  EVA_COLORS,
  EVA_LOGO_COLORS,
  EVA_ROLES,
  EVA_THEME_COLORS,
  brandBaseStyles,
  logoBaseStyles,
} from '../src/styles/eva-tokens.js'
import { LOGO_VARIANTES, logoSvg, trazoPath } from '../src/data/logo.js'
import { checkContrastPairs } from './lib/contrast.mjs'

// --- Colores del logotipo como tokens (design D2) ---------------------------

test('EVA_LOGO_COLORS: claves exactas edge y fill con hex #rrggbb', () => {
  assert.deepEqual(Object.keys(EVA_LOGO_COLORS).sort(), ['edge', 'fill'])
  for (const [key, hex] of Object.entries(EVA_LOGO_COLORS)) assert.match(hex, /^#[0-9A-Fa-f]{6}$/, key)
})

test('EVA_LOGO_COLORS: ninguna clave esta en EVA_COLORS, EVA_THEME_COLORS ni EVA_ROLES', () => {
  for (const key of Object.keys(EVA_LOGO_COLORS)) {
    assert.ok(!(key in EVA_COLORS), `${key} en EVA_COLORS`)
    assert.ok(!(key in EVA_THEME_COLORS), `${key} en EVA_THEME_COLORS`)
    assert.ok(!(key in EVA_ROLES), `${key} en EVA_ROLES`)
  }
})

test('EVA_LOGO_COLORS: valores aprobados en el boceto', () => {
  assert.deepEqual(EVA_LOGO_COLORS, { fill: '#FFC21A', edge: '#F0381E' })
})

/**
 * Errores de contraste del logo: relleno (normal) y filo (ui) contra black y panel.
 * @param {{ fill: string, edge: string }} colors
 * @returns {string[]}
 */
function logoContrastErrors(colors) {
  const all = { ...EVA_COLORS, 'logo:fill': colors.fill, 'logo:edge': colors.edge }
  const pairs = ['black', 'panel'].flatMap((bg) => [
    { fg: 'logo:fill', bg, level: 'normal' },
    { fg: 'logo:edge', bg, level: 'ui' },
  ])
  return checkContrastPairs(all, pairs)
}

test('logoContrastErrors: colores oscuros fallan nombrando token, fondo y contraste', () => {
  const errors = logoContrastErrors({ fill: '#6B4F00', edge: '#5A1408' })
  assert.equal(errors.length, 4)
  for (const token of ['logo:fill', 'logo:edge']) {
    for (const bg of ['black', 'panel']) {
      assert.ok(errors.some((e) => e.startsWith(`${token} sobre ${bg}: `) && /< (4\.5|3) /.test(e)), `${token}/${bg}`)
    }
  }
})

test('logoContrastErrors: los colores reales cumplen (relleno >= 4.5, filo >= 3)', () => {
  assert.deepEqual(logoContrastErrors(EVA_LOGO_COLORS), [])
})

test('logoBaseStyles: expone --eva-logo-fill y --eva-logo-edge en :root', () => {
  assert.deepEqual(logoBaseStyles(), { ':root': { '--eva-logo-fill': '#FFC21A', '--eva-logo-edge': '#F0381E' } })
})

test('logoBaseStyles: usa el mapa inyectado', () => {
  assert.deepEqual(logoBaseStyles({ fill: '#111111', edge: '#222222' }), {
    ':root': { '--eva-logo-fill': '#111111', '--eva-logo-edge': '#222222' },
  })
})

test('tailwind.config.js: un plugin registra logoBaseStyles() y otro sigue con brandBaseStyles()', () => {
  const calls = []
  for (const plugin of tailwindConfig.plugins) {
    const fn = typeof plugin === 'function' ? plugin : plugin.handler
    fn({ addBase: (styles) => calls.push(JSON.stringify(styles)) })
  }
  assert.ok(calls.includes(JSON.stringify(logoBaseStyles())), 'falta logoBaseStyles()')
  assert.ok(calls.includes(JSON.stringify(brandBaseStyles())), 'falta brandBaseStyles()')
})

// --- Guard de hex del logo (design D2) --------------------------------------

const ROOT = new URL('../', import.meta.url)
const read = (path) => readFileSync(new URL(path, ROOT), 'utf8')

/** Archivos `.js/.jsx/.css` bajo `dir` (relativo a la raiz del repo). */
function sourceFiles(dir) {
  return readdirSync(new URL(dir, ROOT)).flatMap((name) => {
    const path = `${dir}${name}`
    if (statSync(new URL(path, ROOT)).isDirectory()) return sourceFiles(`${path}/`)
    return /\.(js|jsx|css)$/.test(name) ? [path] : []
  })
}

/**
 * Archivos que contienen un hex del logo (sin distinguir mayusculas) fuera de la fuente unica.
 * @param {{ path: string, source: string }[]} files
 * @returns {string[]} errores que nombran el archivo
 */
function logoHexLeaks(files) {
  const hexes = Object.values(EVA_LOGO_COLORS).map((hex) => hex.toLowerCase())
  return files
    .filter(({ path }) => path !== 'src/styles/eva-tokens.js')
    .flatMap(({ path, source }) =>
      hexes.filter((hex) => source.toLowerCase().includes(hex)).map((hex) => `${path}: hex del logo ${hex} fuera de eva-tokens.js`),
    )
}

test('logoHexLeaks: los hex del logo solo viven en src/styles/eva-tokens.js', () => {
  const files = [...sourceFiles('src/'), 'index.html'].map((path) => ({ path, source: read(path) }))
  assert.ok(files.some(({ path }) => path === 'src/styles/eva-tokens.js'), 'el barrido no vio eva-tokens.js')
  assert.deepEqual(logoHexLeaks(files), [])
})

test('logoHexLeaks: un hex del logo en NavBrand.jsx (en cualquier caso) falla nombrando el archivo', () => {
  const sucio = [
    { path: 'src/components/NavBrand.jsx', source: '<path fill="#ffc21a" />' },
    { path: 'src/components/Hero.jsx', source: 'stroke="#F0381E"' },
    { path: 'src/styles/eva-tokens.js', source: "fill: '#FFC21A'" },
  ]
  const errores = logoHexLeaks(sucio)
  assert.equal(errores.length, 2)
  assert.ok(errores[0].startsWith('src/components/NavBrand.jsx'))
  assert.ok(errores[1].startsWith('src/components/Hero.jsx'))
})

// --- Geometria unica (design D1) --------------------------------------------

const IDS_COMPLETO = [
  'triangulo-lateral', 'triangulo-derecho', 'triangulo-interior', 'lomo', 'reloj-superior',
  'reloj-diagonal', 'reloj-base', 'chico-superior', 'chico-vertical', 'chico-inferior', 'anillo',
]

/** `[x, y, ancho, alto]` de un viewBox `"x y w h"`. */
const boxOf = (viewBox) => viewBox.split(' ').map(Number)

/** Puntos de un trazo que tienen que caer dentro del viewBox. */
function pointsOf(trazo) {
  return trazo.radio === undefined ? [trazo.desde, trazo.hasta] : [trazo.centro, trazo.centroInterior]
}

/**
 * Trazos con algun punto fuera del viewBox de la variante.
 * @param {{ viewBox: string, trazos: object[] }} variante
 * @returns {string[]}
 */
function outOfBoxErrors(variante) {
  const [x0, y0, w, h] = boxOf(variante.viewBox)
  return variante.trazos
    .filter((t) => pointsOf(t).some(([x, y]) => x < x0 || x > x0 + w || y < y0 || y > y0 + h))
    .map((t) => `${t.id}: punto fuera del viewBox ${variante.viewBox}`)
}

test('LOGO_VARIANTES: completo tiene los 11 ids de D1 en orden de pintado y viewBox 0 0 112 243', () => {
  assert.equal(LOGO_VARIANTES.completo.viewBox, '0 0 112 243')
  assert.deepEqual(LOGO_VARIANTES.completo.trazos.map((t) => t.id), IDS_COMPLETO)
})

test('LOGO_VARIANTES: simple tiene como maximo 5 trazos, todos triangulo-* o anillo, viewBox 0 0 32 32', () => {
  const { simple } = LOGO_VARIANTES
  assert.equal(simple.viewBox, '0 0 32 32')
  assert.ok(simple.trazos.length <= 5)
  assert.deepEqual(simple.trazos.map((t) => t.id), ['triangulo-lateral', 'triangulo-derecho', 'triangulo-base', 'anillo'])
  for (const { id } of simple.trazos) assert.match(id, /^(triangulo-|anillo$)/)
})

test('LOGO_VARIANTES: sombra y filo positivos; los puntos y centros caen dentro del viewBox', () => {
  for (const [nombre, variante] of Object.entries(LOGO_VARIANTES)) {
    assert.ok(variante.sombra > 0 && variante.filo > 0, nombre)
    assert.deepEqual(outOfBoxErrors(variante), [], nombre)
  }
})

test('outOfBoxErrors: un punto fuera del viewBox falla nombrando el id', () => {
  const rota = structuredClone(LOGO_VARIANTES.simple)
  rota.trazos[1].hasta = [40, 10]
  assert.deepEqual(outOfBoxErrors(rota), ['triangulo-derecho: punto fuera del viewBox 0 0 32 32'])
  const anilloFuera = structuredClone(LOGO_VARIANTES.completo)
  anilloFuera.trazos.at(-1).centro = [-1, 5]
  assert.deepEqual(outOfBoxErrors(anilloFuera), ['anillo: punto fuera del viewBox 0 0 112 243'])
})

// --- Aletas continuas (design D1, D8) ---------------------------------------

const DEG = 180 / Math.PI
const clonar = (variante) => structuredClone(variante)
const largo = (t) => Math.hypot(t.hasta[0] - t.desde[0], t.hasta[1] - t.desde[1])
const ZONAS_CON_ALETA = [
  'triangulo-lateral', 'triangulo-derecho', 'triangulo-interior', 'lomo', 'reloj-diagonal', 'reloj-base', 'chico-vertical',
]
const SIN_ALETA = ['reloj-superior', 'chico-superior', 'chico-inferior']

/**
 * Reglas de las aletas sobre los parametros de la variante.
 * @param {{ trazos: object[] }} variante
 * @param {'completo'|'simple'} nombre
 * @returns {string[]} errores que nombran el id
 */
function finErrors(variante, nombre = 'completo') {
  const errors = []
  for (const t of variante.trazos) {
    const aletas = t.aletas ?? []
    if (nombre === 'simple' && aletas.length > 0) errors.push(`${t.id}: la variante simple no lleva aletas`)
    if (aletas.length > 1) errors.push(`${t.id}: ${aletas.length} aletas (maximo 1, sin sierra)`)
    if (t.radio === undefined) {
      if (SIN_ALETA.includes(t.id) && aletas.length > 0) errors.push(`${t.id}: no lleva aleta`)
      for (const a of aletas) {
        if (a.inicio < 0) errors.push(`${t.id}: inicio < 0`)
        if (a.inicio + a.rampa + a.meseta > 1) errors.push(`${t.id}: la aleta se sale de la barra (inicio + rampa + meseta > 1)`)
        if (!(a.meseta > a.rampa)) errors.push(`${t.id}: meseta (${a.meseta}) no es mayor que la rampa (${a.rampa}): aleta en pico`)
        const angulo = Math.atan(a.alto / (a.rampa * largo(t))) * DEG
        if (angulo > 25) errors.push(`${t.id}: rampa empinada (${angulo.toFixed(1)} grados > 25)`)
        if (a.alto < 0.3 * t.ancho || a.alto > 0.7 * t.ancho) errors.push(`${t.id}: alto ${a.alto} fuera de 0.3-0.7 x ancho ${t.ancho}`)
      }
    } else {
      const grosor = t.radio - t.radioInterior
      for (const a of aletas) {
        if (a.lado !== 'exterior') errors.push(`${t.id}: la aleta del aro es exterior`)
        if (a.rampa < 25 || a.rampa > 35) errors.push(`${t.id}: rampa ${a.rampa} fuera de 25-35 grados`)
        if (a.meseta < 90 || a.meseta > 120) errors.push(`${t.id}: meseta ${a.meseta} fuera de 90-120 grados`)
        const angulo = Math.atan(a.alto / (t.radio * ((a.rampa * Math.PI) / 180))) * DEG
        if (angulo > 25) errors.push(`${t.id}: rampa empinada (${angulo.toFixed(1)} grados > 25)`)
        if (a.alto < 0.3 * grosor || a.alto > 0.7 * grosor) errors.push(`${t.id}: alto ${a.alto} fuera de 0.3-0.7 x grosor ${grosor.toFixed(1)}`)
      }
    }
  }
  if (nombre === 'completo') {
    for (const id of ZONAS_CON_ALETA) {
      if ((variante.trazos.find((t) => t.id === id)?.aletas ?? []).length !== 1) errors.push(`${id}: falta su aleta de zona`)
    }
    if ((variante.trazos.find((t) => t.id === 'anillo')?.aletas ?? []).length !== 1) errors.push('anillo: falta su aleta')
  }
  return errors
}

const trazoDe = (variante, id) => variante.trazos.find((t) => t.id === id)

test('finErrors: las variantes reales cumplen todas las reglas de aletas', () => {
  assert.deepEqual(finErrors(LOGO_VARIANTES.completo, 'completo'), [])
  assert.deepEqual(finErrors(LOGO_VARIANTES.simple, 'simple'), [])
})

test('finErrors: una sierra (tres aletas en lomo) falla nombrando lomo', () => {
  const v = clonar(LOGO_VARIANTES.completo)
  const [a] = trazoDe(v, 'lomo').aletas
  trazoDe(v, 'lomo').aletas = [a, { ...a, inicio: 0.45 }, { ...a, inicio: 0.7, meseta: 0.2 }]
  assert.ok(finErrors(v).some((e) => e.startsWith('lomo:') && e.includes('3 aletas')))
})

test('finErrors: una aleta en pico (meseta 0) falla nombrando el id', () => {
  const v = clonar(LOGO_VARIANTES.completo)
  trazoDe(v, 'reloj-base').aletas[0].meseta = 0
  assert.ok(finErrors(v).some((e) => e.startsWith('reloj-base:') && e.includes('pico')))
})

test('finErrors: una rampa de 60 grados falla; una aleta alta (alto = ancho) falla', () => {
  const v = clonar(LOGO_VARIANTES.completo)
  const t = trazoDe(v, 'triangulo-lateral')
  t.aletas[0].alto = Math.tan((60 / DEG)) * t.aletas[0].rampa * largo(t)
  assert.ok(finErrors(v).some((e) => e.startsWith('triangulo-lateral:') && e.includes('empinada')))
  const alta = clonar(LOGO_VARIANTES.completo)
  const l = trazoDe(alta, 'lomo')
  l.aletas[0].alto = l.ancho
  assert.ok(finErrors(alta).some((e) => e.startsWith('lomo:') && e.includes('fuera de 0.3-0.7')))
})

test('finErrors: una aleta en chico-superior o en la variante simple falla', () => {
  const v = clonar(LOGO_VARIANTES.completo)
  trazoDe(v, 'chico-superior').aletas = [{ lado: 1, inicio: 0.2, rampa: 0.12, meseta: 0.4, alto: 2.3 }]
  assert.ok(finErrors(v).some((e) => e === 'chico-superior: no lleva aleta'))
  const s = clonar(LOGO_VARIANTES.simple)
  trazoDe(s, 'triangulo-base').aletas = [{ lado: 1, inicio: 0.1, rampa: 0.2, meseta: 0.4, alto: 1.2 }]
  assert.ok(finErrors(s, 'simple').some((e) => e.startsWith('triangulo-base:') && e.includes('simple')))
})

test('finErrors: una zona sin su aleta falla nombrando la zona', () => {
  const v = clonar(LOGO_VARIANTES.completo)
  trazoDe(v, 'chico-vertical').aletas = []
  assert.deepEqual(finErrors(v), ['chico-vertical: falta su aleta de zona'])
})

test('finErrors: aro con dos aletas (sierra) o con alto = 1.2 x grosor falla nombrando anillo', () => {
  const sierra = clonar(LOGO_VARIANTES.completo)
  const anillo = trazoDe(sierra, 'anillo')
  anillo.aletas = [anillo.aletas[0], { ...anillo.aletas[0], inicio: 300 }]
  assert.ok(finErrors(sierra).some((e) => e.startsWith('anillo:') && e.includes('2 aletas')))
  const gorda = clonar(LOGO_VARIANTES.completo)
  const g = trazoDe(gorda, 'anillo')
  g.aletas[0].alto = 1.2 * (g.radio - g.radioInterior)
  assert.ok(finErrors(gorda).some((e) => e.startsWith('anillo:') && e.includes('fuera de 0.3-0.7')))
})

// --- Uniones sin costuras (design D1, D8) -----------------------------------

const distancia = (a, b) => Math.hypot(a[0] - b[0], a[1] - b[1])

/** Distancia de un punto al segmento `a -> b`. */
function distanciaASegmento(p, a, b) {
  const dx = b[0] - a[0]
  const dy = b[1] - a[1]
  const t = Math.max(0, Math.min(1, ((p[0] - a[0]) * dx + (p[1] - a[1]) * dy) / (dx * dx + dy * dy)))
  return distancia(p, [a[0] + t * dx, a[1] + t * dy])
}

/**
 * Reglas de uniones sobre los parametros de la variante.
 * @param {{ trazos: object[] }} variante
 * @returns {string[]} errores que nombran el id
 */
function unionErrors(variante) {
  const errors = []
  const porId = Object.fromEntries(variante.trazos.map((t) => [t.id, t]))
  for (const t of variante.trazos.filter((x) => x.radio === undefined)) {
    for (const [extremo, corteKey] of [['desde', 'corteDesde'], ['hasta', 'corteHasta']]) {
      const corte = t[corteKey]
      const punto = t[extremo]
      if (!corte) {
        errors.push(`${t.id}: extremo ${extremo} sin corte`)
        continue
      }
      const otra = porId[corte.con]
      if (!otra || otra.radio !== undefined) {
        errors.push(`${t.id}: ${corteKey} apunta a ${corte.con}, que no es una barra existente`)
        continue
      }
      if (corte.tipo === 'inglete') {
        if (![otra.desde, otra.hasta].some((p) => distancia(p, punto) <= 0.05)) {
          errors.push(`${t.id}: inglete con ${otra.id} pero no comparten el vertice (${extremo})`)
        }
        const reciproco = [otra.corteDesde, otra.corteHasta].some((c) => c?.tipo === 'inglete' && c.con === t.id)
        if (!reciproco) errors.push(`${t.id}: ${otra.id} no se refiere al inglete de vuelta`)
      } else if (distanciaASegmento(punto, otra.desde, otra.hasta) > 0.05) {
        errors.push(`${t.id}: el extremo ${extremo} de la T cae fuera del eje de ${otra.id}`)
      }
    }
    const dx = Math.abs(t.hasta[0] - t.desde[0])
    const dy = Math.abs(t.hasta[1] - t.desde[1])
    const desvio = Math.min(Math.atan2(dx, dy), Math.atan2(dy, dx)) * DEG // respecto del eje mas cercano
    if (desvio < 4 && dx !== 0 && dy !== 0) errors.push(`${t.id}: a ${desvio.toFixed(1)} grados de un eje y no exactamente recta`)
  }
  return errors
}

test('unionErrors: las variantes reales no tienen errores de union', () => {
  assert.deepEqual(unionErrors(LOGO_VARIANTES.completo), [])
  assert.deepEqual(unionErrors(LOGO_VARIANTES.simple), [])
})

test('unionErrors: una barra que sobresale 3 unidades de su vertice falla nombrando el id', () => {
  const v = clonar(LOGO_VARIANTES.simple)
  trazoDe(v, 'triangulo-derecho').hasta = [22.9 + 3 * 0.5, 17.5 + 3 * 0.86]
  const errores = unionErrors(v)
  assert.ok(errores.some((e) => e.startsWith('triangulo-derecho:') && e.includes('no comparten el vertice')))
})

test('unionErrors: una T cuyo extremo queda fuera del eje de la anfitriona falla nombrando el id', () => {
  const v = clonar(LOGO_VARIANTES.completo)
  trazoDe(v, 'triangulo-interior').hasta = [87.8 + 3, 112.3]
  assert.ok(unionErrors(v).some((e) => e.startsWith('triangulo-interior:') && e.includes('fuera del eje de lomo')))
})

test('unionErrors: un lateral a 1 grado de la vertical falla; un corte a una barra inexistente falla', () => {
  const v = clonar(LOGO_VARIANTES.simple)
  const lateral = trazoDe(v, 'triangulo-lateral')
  lateral.hasta = [lateral.desde[0] + Math.tan(1 / DEG) * 21.3, 26.9]
  assert.ok(unionErrors(v).some((e) => e.startsWith('triangulo-lateral:') && e.includes('1.0 grados')))
  const huerfana = clonar(LOGO_VARIANTES.completo)
  trazoDe(huerfana, 'lomo').corteHasta = { tipo: 'inglete', con: 'no-existe' }
  assert.ok(unionErrors(huerfana).some((e) => e.startsWith('lomo:') && e.includes('no-existe')))
})

test('unionErrors: un extremo sin corte y un inglete sin reciprocidad fallan', () => {
  const libre = clonar(LOGO_VARIANTES.completo)
  delete trazoDe(libre, 'chico-inferior').corteHasta
  assert.ok(unionErrors(libre).includes('chico-inferior: extremo hasta sin corte'))
  const unilateral = clonar(LOGO_VARIANTES.completo)
  trazoDe(unilateral, 'chico-superior').corteHasta = { tipo: 'inglete', con: 'chico-inferior' }
  assert.ok(unionErrors(unilateral).some((e) => e.startsWith('chico-superior:')))
})

// --- Trazado de cada trazo (design D1, D8) ----------------------------------

const porIdDe = (variante) => Object.fromEntries(variante.trazos.map((t) => [t.id, t]))

/** Vertices `[x, y]` de un `d` de barra (solo `M L Z`). */
function verticesDe(d) {
  assert.match(d, /^M[-\d. L]+Z$/, `solo M, L y Z: ${d}`)
  return d
    .slice(1, -1)
    .split('L')
    .map((par) => par.trim().split(' ').map(Number))
}

/** Aristas consecutivas (cerrando el poligono) de una lista de vertices. */
const aristasDe = (pts) => pts.map((p, i) => [p, pts[(i + 1) % pts.length]])

test('trazoPath: una barra con aleta da 8 vertices, solo M L Z, y un cierre perpendicular al eje', () => {
  const v = LOGO_VARIANTES.completo
  for (const id of ZONAS_CON_ALETA) {
    const t = trazoDe(v, id)
    const d = trazoPath(t, porIdDe(v))
    const pts = verticesDe(d)
    assert.equal(pts.length, 8, `${id}: vertices`)
    const alto = t.aletas[0].alto
    const eje = [(t.hasta[0] - t.desde[0]) / largo(t), (t.hasta[1] - t.desde[1]) / largo(t)]
    const cierres = aristasDe(pts).filter(([a, b]) => {
      const len = distancia(a, b)
      return Math.abs(len - alto) <= 0.25 && Math.abs(((b[0] - a[0]) * eje[0] + (b[1] - a[1]) * eje[1]) / len) < 0.05
    })
    assert.equal(cierres.length, 1, `${id}: un unico cierre perpendicular de alto ${alto}`)
  }
})

test('trazoPath: una barra sin aleta da 4 vertices', () => {
  const v = LOGO_VARIANTES.completo
  for (const id of SIN_ALETA) assert.equal(verticesDe(trazoPath(trazoDe(v, id), porIdDe(v))).length, 4, id)
})

test('trazoPath: fixture en L con esquinas conocidas (inglete de dos barras de ancho 2)', () => {
  const L = {
    trazos: [
      { id: 'a', desde: [0, 0], hasta: [10, 0], ancho: 2, corteDesde: { tipo: 'inglete', con: 'b' }, aletas: [] },
      { id: 'b', desde: [0, 0], hasta: [0, 10], ancho: 2, corteDesde: { tipo: 'inglete', con: 'a' }, aletas: [] },
    ],
  }
  const porId = porIdDe(L)
  assert.equal(trazoPath(porId.a, porId), 'M1 1L10 1L10 -1L-1 -1Z')
  assert.equal(trazoPath(porId.b, porId), 'M-1 -1L-1 10L1 10L1 1Z')
})

test('trazoPath: los dos poligonos de un inglete de igual ancho comparten los dos puntos del corte', () => {
  const L = {
    trazos: [
      { id: 'a', desde: [0, 0], hasta: [10, 0], ancho: 2, corteDesde: { tipo: 'inglete', con: 'b' }, aletas: [] },
      { id: 'b', desde: [0, 0], hasta: [0, 10], ancho: 2, corteDesde: { tipo: 'inglete', con: 'a' }, aletas: [] },
    ],
  }
  const porId = porIdDe(L)
  const a = verticesDe(trazoPath(porId.a, porId)).map(String)
  const b = verticesDe(trazoPath(porId.b, porId)).map(String)
  assert.deepEqual(a.filter((p) => b.includes(p)).sort(), ['-1,-1', '1,1'])
})

test('trazoPath: en los ingletes reales, el corte de ambas barras cae sobre la misma bisectriz del vertice', () => {
  const v = LOGO_VARIANTES.completo
  const porId = porIdDe(v)
  const cruz = (a, b, c) => (b[0] - a[0]) * (c[1] - a[1]) - (b[1] - a[1]) * (c[0] - a[0])
  const verificados = new Set()
  for (const t of v.trazos.filter((x) => x.radio === undefined)) {
    for (const [punto, corte] of [[t.desde, t.corteDesde], [t.hasta, t.corteHasta]]) {
      const par = [t.id, corte.con].sort().join('|')
      if (corte.tipo !== 'inglete' || verificados.has(par)) continue
      verificados.add(par)
      // el corte de cada barra es la arista del poligono que pasa por el vertice compartido
      const corteDe = (id) => aristasDe(verticesDe(trazoPath(porId[id], porId))).find(([a, b]) => distanciaASegmento(punto, a, b) <= 0.12)
      const [p1, p2] = corteDe(t.id)
      const [q1, q2] = corteDe(corte.con)
      const norma = distancia(p1, p2)
      assert.ok(Math.abs(cruz(p1, p2, q1)) / norma <= 0.15, `${par}: q1 fuera de la bisectriz`)
      assert.ok(Math.abs(cruz(p1, p2, q2)) / norma <= 0.15, `${par}: q2 fuera de la bisectriz`)
    }
  }
  assert.equal(verificados.size, 8, 'ingletes del completo: 8 pares')
})

// Anillo: `M L A L A Z` + circulo interior; la meseta es concentrica de radio `radio + alto`.

/** Comandos de un `d` en orden (solo letras). */
const comandosDe = (d) => d.replace(/[^A-Za-z]/g, '')

/**
 * Errores de concentricidad de la meseta de un anillo con aleta.
 * @param {string} d
 * @param {{ centro: number[], radio: number, aletas: { alto: number }[] }} anillo
 * @returns {string[]}
 */
function mesetaErrors(d, anillo) {
  const esperado = anillo.radio + anillo.aletas[0].alto
  const exterior = d.slice(0, d.indexOf('Z'))
  const match = /A([\d.]+) ([\d.]+) 0 [01] 1 ([-\d.]+) ([-\d.]+)/.exec(exterior)
  if (!match) return ['anillo: no hay arco de meseta']
  const [, rx, ry, x, y] = match
  const errors = []
  if (Math.abs(Number(rx) - esperado) > 0.1 || Math.abs(Number(ry) - esperado) > 0.1) {
    errors.push(`anillo: radio de la meseta ${rx} != ${esperado}`)
  }
  const fin = distancia([Number(x), Number(y)], anillo.centro)
  if (Math.abs(fin - esperado) > 0.1) errors.push(`anillo: el extremo de la meseta esta a ${fin.toFixed(2)} != ${esperado}`)
  return errors
}

test('trazoPath: el anillo con aleta da M L A L A Z + el circulo interior, con meseta concentrica', () => {
  const v = LOGO_VARIANTES.completo
  const anillo = trazoDe(v, 'anillo')
  const d = trazoPath(anillo, porIdDe(v))
  assert.equal(comandosDe(d), 'MLALAZMaaZ')
  assert.deepEqual(mesetaErrors(d, anillo), [])
})

test('trazoPath: el anillo sin aleta da dos circulos (M a a Z x2)', () => {
  const v = LOGO_VARIANTES.simple
  assert.equal(comandosDe(trazoPath(trazoDe(v, 'anillo'), porIdDe(v))), 'MaaZMaaZ')
})

test('mesetaErrors: una meseta no concentrica falla (radio distinto o extremo fuera de radio + alto)', () => {
  const v = LOGO_VARIANTES.completo
  const anillo = trazoDe(v, 'anillo')
  const d = trazoPath(anillo, porIdDe(v))
  const radioMalo = d.replace(/A19\.5 19\.5/, 'A18 18')
  assert.notEqual(radioMalo, d)
  assert.ok(mesetaErrors(radioMalo, anillo).some((e) => e.includes('radio de la meseta')))
  const extremoMalo = d.replace(/(A19\.5 19\.5 0 [01] 1 )([-\d.]+) ([-\d.]+)/, '$1$2 0')
  assert.ok(mesetaErrors(extremoMalo, anillo).some((e) => e.includes('extremo')))
})

// --- Serializador (design D3) -----------------------------------------------

const SVG_COMPLETO = logoSvg({ variante: 'completo', colores: EVA_LOGO_COLORS })

/** Grupos `<g ...>...</g>` de un SVG: `{ attrs, paths: [{ attrs, d }] }`. */
function gruposDe(svg) {
  return [...svg.matchAll(/<g([^>]*)>([\s\S]*?)<\/g>/g)].map(([, attrs, cuerpo]) => ({
    attrs,
    paths: [...cuerpo.matchAll(/<path([^>]*?)\sd="([^"]*)"\/>/g)].map(([, a, d]) => ({ attrs: a, d })),
  }))
}

/**
 * Errores de la tecnica de tres capas (sombra, filo, relleno) de un SVG de `logoSvg`.
 * @param {string} svg
 * @param {{ colores: { fill: string, edge: string }, variante: { sombra: number, filo: number } }} esperado
 * @returns {string[]}
 */
function capasErrors(svg, { colores, variante }) {
  const errors = []
  const grupos = gruposDe(svg)
  if (grupos.length !== 3) return [`se esperaban 3 grupos y hay ${grupos.length}`]
  const [sombra, filo, relleno] = grupos
  const sw = Math.round(variante.filo * 2 * 100) / 100
  for (const [nombre, g] of [['sombra', sombra], ['filo', filo]]) {
    for (const attr of [`fill="${colores.edge}"`, `stroke="${colores.edge}"`, `stroke-width="${sw}"`, 'stroke-linejoin="miter"', 'stroke-miterlimit="2"']) {
      if (!g.attrs.includes(attr)) errors.push(`${nombre}: falta ${attr}`)
    }
  }
  if (!sombra.attrs.includes(`transform="translate(${variante.sombra} ${variante.sombra})"`)) errors.push('sombra: falta translate')
  if (filo.attrs.includes('transform')) errors.push('filo: no lleva transform')
  if (!relleno.attrs.includes(`fill="${colores.fill}"`)) errors.push('relleno: falta fill')
  if (relleno.attrs.includes('stroke')) errors.push('relleno: lleva stroke (costura interna)')
  for (const [nombre, g] of [['sombra', sombra], ['filo', filo], ['relleno', relleno]]) {
    if (g.paths.length !== 2) errors.push(`${nombre}: ${g.paths.length} paths (barras + anillo = 2)`)
    else if (!g.paths[1].attrs.includes('fill-rule="evenodd"') || g.paths[0].attrs.includes('evenodd')) errors.push(`${nombre}: el anillo va en su path evenodd`)
  }
  return errors
}

const esperadoCompleto = { colores: EVA_LOGO_COLORS, variante: LOGO_VARIANTES.completo }

test('logoSvg: svg con xmlns y viewBox, tres capas en orden con un path de barras y uno de anillo', () => {
  assert.match(SVG_COMPLETO, /^<svg xmlns="http:\/\/www\.w3\.org\/2000\/svg" viewBox="0 0 112 243">/)
  assert.deepEqual(capasErrors(SVG_COMPLETO, esperadoCompleto), [])
})

test('logoSvg: las tres capas comparten exactamente el mismo d de barras y de anillo', () => {
  const [sombra, filo, relleno] = gruposDe(SVG_COMPLETO)
  assert.deepEqual(filo.paths, sombra.paths)
  assert.deepEqual(relleno.paths.map((p) => p.d), sombra.paths.map((p) => p.d))
  const porId = porIdDe(LOGO_VARIANTES.completo)
  const barras = LOGO_VARIANTES.completo.trazos.filter((t) => t.radio === undefined).map((t) => trazoPath(t, porId)).join('')
  assert.equal(sombra.paths[0].d, barras)
  assert.equal(sombra.paths[1].d, trazoPath(trazoDe(LOGO_VARIANTES.completo, 'anillo'), porId))
})

test('capasErrors: un relleno con stroke o un path por barra falla (costura interna)', () => {
  const conStroke = SVG_COMPLETO.replace(/<g fill="#FFC21A">/, '<g fill="#FFC21A" stroke="#F0381E">')
  assert.notEqual(conStroke, SVG_COMPLETO)
  assert.ok(capasErrors(conStroke, esperadoCompleto).includes('relleno: lleva stroke (costura interna)'))
  const [, , relleno] = gruposDe(SVG_COMPLETO)
  const porBarra = relleno.paths[0].d.split('Z').filter(Boolean).map((d) => `    <path d="${d}Z"/>`).join('\n')
  const partido = SVG_COMPLETO.replace(/(<g fill="#FFC21A">\n)\s*<path d="[^"]*"\/>/, `$1${porBarra}`)
  assert.notEqual(partido, SVG_COMPLETO)
  assert.ok(capasErrors(partido, esperadoCompleto).some((e) => e.startsWith('relleno:') && e.includes('paths')))
})

test('logoSvg: el rect de fondo aparece solo si se pasa `fondo`', () => {
  assert.ok(!SVG_COMPLETO.includes('<rect'))
  const conFondo = logoSvg({ variante: 'simple', colores: EVA_LOGO_COLORS, fondo: EVA_COLORS.black })
  assert.equal(conFondo.split('<rect').length - 1, 1)
  assert.ok(conFondo.includes(`<rect width="32" height="32" rx="4" fill="${EVA_COLORS.black}"/>`))
  assert.ok(conFondo.indexOf('<rect') < conFondo.indexOf('<g '), 'el fondo va debajo de las capas')
})

test('logoSvg: sin <image, gradient, filter, <animate ni style=', () => {
  for (const svg of [SVG_COMPLETO, logoSvg({ variante: 'simple', colores: EVA_LOGO_COLORS, fondo: '#050505' })]) {
    for (const prohibido of ['<image', 'gradient', 'filter', '<animate', 'style=']) assert.ok(!svg.includes(prohibido), prohibido)
  }
})

test('logoSvg: conDimensiones agrega width y height del viewBox', () => {
  assert.ok(!SVG_COMPLETO.includes(' width='))
  assert.match(logoSvg({ variante: 'completo', colores: EVA_LOGO_COLORS, conDimensiones: true }), /viewBox="0 0 112 243" width="112" height="243">/)
})

test('logoSvg: con colores falsos y variante simple usa esos hex y no los reales', () => {
  const colores = { fill: '#111111', edge: '#222222' }
  const svg = logoSvg({ variante: 'simple', colores })
  assert.ok(svg.includes('#111111') && svg.includes('#222222'))
  for (const real of Object.values(EVA_LOGO_COLORS)) assert.ok(!svg.toLowerCase().includes(real.toLowerCase()), real)
  assert.deepEqual(capasErrors(svg, { colores, variante: LOGO_VARIANTES.simple }), [])
  assert.match(svg, /viewBox="0 0 32 32"/)
})

test('logoSvg: una variante inexistente lanza un error que la nombra', () => {
  assert.throws(() => logoSvg({ variante: 'nope', colores: EVA_LOGO_COLORS }), (e) => e.message.includes('nope'))
})
