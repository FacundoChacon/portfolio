/**
 * Guardas estáticas del panel de proyectos (design D2–D9): contraste de la card
 * sobre el líquido, marcado accesible, CSS de la ventana deslizante y ciclo de
 * vida del tanque. Sin DOM: leen el código fuente y `index.css`.
 */
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'

import { EVA_THEME_COLORS } from '../src/styles/eva-tokens.js'
import { blendOver, contrastRatio } from './lib/contrast.mjs'
import { parseRgbAlpha, ruleBody } from './lib/css-rules.mjs'

const ROOT = new URL('../', import.meta.url)
const read = (path) => readFileSync(new URL(path, ROOT), 'utf8')
const css = () => read('src/index.css')

// ───────── D9: contraste de la card sobre el líquido ─────────

const TEXTOS = {
  papel: EVA_THEME_COLORS.paper,
  gris: EVA_THEME_COLORS.gray,
  'violeta claro': EVA_THEME_COLORS['primary-light'],
  naranja: EVA_THEME_COLORS.secondary,
  'verde agua': EVA_THEME_COLORS.tertiary,
}

/**
 * Pares con contraste insuficiente de un fondo de card (`hex` + `alpha`) compuesto
 * sobre los peores casos del líquido: naranja sólido y papel sólido (cresta).
 * @returns {string[]}
 */
function erroresDeContrasteDeCard({ hex, alpha }) {
  const errores = []
  const liquido = EVA_THEME_COLORS.secondary
  const fondos = { 'naranja sólido': liquido, 'papel sólido (cresta)': EVA_THEME_COLORS.paper }
  for (const [fondoNombre, fondoHex] of Object.entries(fondos)) {
    const fondo = blendOver(hex, fondoHex, alpha)
    for (const [textoNombre, textoHex] of Object.entries(TEXTOS)) {
      const ratio = contrastRatio(textoHex, fondo)
      if (ratio < 4.5) errores.push(`${textoNombre} sobre card/${fondoNombre}: ${ratio.toFixed(2)} < 4.5`)
    }
  }
  const limite = contrastRatio(blendOver(hex, liquido, alpha), liquido)
  if (limite < 3) errores.push(`fondo de card contra el líquido: ${limite.toFixed(2)} < 3`)
  return errores
}

test('.proyecto-card: fondo semiopaco propio, sin backdrop-filter, con contraste suficiente sobre el LCL', () => {
  const cuerpo = ruleBody(css(), '.proyecto-card')
  assert.ok(cuerpo, 'falta la regla .proyecto-card en index.css')
  assert.doesNotMatch(cuerpo, /backdrop-filter/)
  const fondo = parseRgbAlpha(cuerpo, 'background-color')
  assert.ok(fondo, '.proyecto-card sin background-color rgb(r g b / a)')
  assert.ok(fondo.alpha >= 0.94, `alfa ${fondo.alpha}: no baja de 0.94 (design D9)`)
  assert.deepEqual(erroresDeContrasteDeCard(fondo), [])
})

test('contraste de la card: con alfa baja la verificación falla nombrando el par', () => {
  const errores = erroresDeContrasteDeCard({ hex: '#100e0c', alpha: 0.4 })
  assert.ok(errores.length > 0)
  assert.ok(errores.some((e) => /sobre card\/papel sólido/.test(e) && /< 4\.5/.test(e)), errores.join('\n'))
  // y con la opacidad de diseño no hay errores (triangulación)
  assert.deepEqual(erroresDeContrasteDeCard({ hex: '#100e0c', alpha: 0.94 }), [])
})

// ───────── D6: marcado de la card ─────────

test('ProyectoCard.jsx: card entera enlazada, repo y "Repo privado", sin cristal ni nombres de color', () => {
  const src = read('src/components/proyectos/ProyectoCard.jsx')
  assert.doesNotMatch(src, /backdrop-|eva-glass/)
  assert.doesNotMatch(src, /eva-(?:orange|purple|green|violet|aqua)/)
  assert.ok(src.includes('NEW_TAB_NOTE = "(abre el sitio en una pestaña nueva)"'))
  assert.match(src, /etiquetasVisibles\(/)
  assert.match(src, /accesoRepositorio\(/)
  assert.match(src, /projectLabel\(/)
  assert.match(src, /<button\b[^>]*type="button"[^>]*disabled|<button\b[^>]*disabled[^>]*type="button"/)
  assert.ok(src.includes('Repo privado'))
  assert.ok(src.includes('Repositorio'))
  assert.match(src, /line-clamp-3/)
  assert.match(src, /mt-auto/)
  assert.match(src, /sr-only/)
  assert.ok(src.includes('hover:border-eva-primary') && src.includes('focus-within:border-eva-primary'))
  assert.ok(src.includes('demo: "border-eva-secondary text-eva-secondary"'))
  assert.ok(src.includes('live: "border-eva-tertiary text-eva-tertiary"'))
  for (const tag of src.match(/<a\b[^>]*>/gs) ?? []) {
    if (/target="_blank"/.test(tag)) assert.match(tag, /rel="noopener noreferrer"/, tag)
  }
})

test('ProyectoCard.jsx: sin sombras naranjas desplazadas de la card anterior', () => {
  const src = read('src/components/proyectos/ProyectoCard.jsx')
  assert.doesNotMatch(src, /shadow-\[\d+px_\d+px_0_0_theme\(colors\.eva\.secondary\)\]/)
  assert.doesNotMatch(src, /hover:border-eva-secondary/)
})

// ───────── D2/D3: CSS de la ventana deslizante ─────────

const { CORTES } = await import('../src/utils/panelProyectos.js')

test('index.css: --por-vista con los cortes de CORTES (fuente única)', () => {
  const source = css()
  const cortes = [...source.matchAll(/@media \(min-width: (\d+(?:\.\d+)?)px\)\s*\{\s*\.proyectos\s*\{\s*--por-vista:\s*(\d)/g)].map((m) => [Number(m[1]), Number(m[2])])
  assert.deepEqual(cortes, [
    [CORTES.dos, 2],
    [CORTES.tres, 3],
  ])
  assert.match(ruleBody(source, '.proyectos') ?? '', /--por-vista:\s*1/)
})

test('index.css: ventana con overflow clip (y hidden de respaldo antes) y touch-action pan-y', () => {
  const cuerpo = ruleBody(css(), '.proyectos-ventana') ?? ''
  assert.ok(cuerpo, 'falta .proyectos-ventana')
  const hidden = cuerpo.indexOf('overflow: hidden')
  const clip = cuerpo.indexOf('overflow: clip')
  assert.ok(hidden >= 0 && clip > hidden, 'overflow: hidden antes de overflow: clip')
  assert.match(cuerpo, /touch-action:\s*pan-y/)
})

test('index.css: pista con translateX por --inicio y transición solo con no-preference', () => {
  const source = css()
  const pista = ruleBody(source, '.proyectos-pista') ?? ''
  assert.match(pista, /transform:\s*translateX\(/)
  assert.match(pista, /var\(--inicio[,)]/)
  assert.doesNotMatch(pista, /transition/)
  const anim = ruleBody(source, '.proyectos-pista', { within: '@media (prefers-reduced-motion: no-preference)' }) ?? ''
  assert.match(anim, /transition:\s*transform\b/)
  const li = ruleBody(source, '.proyectos-pista > li') ?? ''
  assert.match(li, /flex:\s*0 0 calc\(/)
  assert.match(li, /var\(--por-vista\)/)
})

test('index.css: flechas con borde primario y estado aria-disabled atenuado', () => {
  const source = css()
  assert.match(ruleBody(source, '.proyectos-flecha') ?? '', /border:\s*2px solid var\(--eva-primary\)/)
  assert.match(ruleBody(source, '.proyectos-flecha:hover') ?? '', /background-color:\s*var\(--eva-primary\)/)
  const off = ruleBody(source, '.proyectos-flecha[aria-disabled="true"]') ?? ''
  assert.match(off, /opacity:/)
  assert.match(off, /cursor:\s*not-allowed/)
})

// ───────── D1/D3/D4/D5: marcado y hook del panel ─────────

test('PanelProyectos.jsx: eva-glass solo en el panel, flechas accesibles con aria-disabled', () => {
  const src = read('src/components/proyectos/PanelProyectos.jsx')
  assert.doesNotMatch(src, /backdrop-/)
  assert.equal((src.match(/eva-glass/g) ?? []).length, 1)
  assert.ok(src.includes('aria-label="Proyecto anterior"') && src.includes('aria-label="Proyecto siguiente"'))
  assert.ok(src.includes('aria-controls="proyectos-lista"') && src.includes('id="proyectos-lista"'))
  assert.match(src, /aria-disabled=/)
  assert.doesNotMatch(src.replace(/aria-disabled/g, ''), /\bdisabled\b/)
  assert.match(src, /aria-live="polite"/)
  assert.match(src, /aria-atomic="true"/)
  assert.match(src, /<p[^>]*aria-hidden="true"[^>]*proyectos-indicador|proyectos-indicador[^>]*aria-hidden="true"/)
  assert.ok(src.includes('SYS // ARCHIVO DE PROYECTOS'))
  assert.match(src, /TanqueLCL/)
  assert.match(src, /hayNavegacion\(/)
  for (const tag of src.match(/<(li|article)\b[^>]*>/g) ?? []) assert.doesNotMatch(tag, /aria-hidden|inert/)
})

test('usePanelProyectos.js: lógica pura, foco, deslizar pasivo y sin historial', () => {
  const src = read('src/hooks/usePanelProyectos.js')
  for (const fn of ['mover', 'clampInicio', 'inicioParaMostrar', 'direccionDeslizar', 'puedeAvanzar', 'puedeRetroceder', 'anuncioVentana']) {
    assert.ok(src.includes(fn), `falta ${fn}`)
  }
  assert.match(src, /matchMedia\(/)
  assert.match(src, /CORTES/)
  assert.match(src, /focusin/)
  assert.match(src, /scrollLeft\s*=\s*0/)
  assert.match(src, /passive:\s*true/)
  assert.match(src, /pointerType\s*===\s*['"]touch['"]/)
  assert.doesNotMatch(src, /preventDefault|pushState|replaceState|setInterval/)
})

// ───────── D7/D8: tanque de LCL ─────────

test('index.css: tanque sobre todo el panel (nivel 2/3), debajo de la ventana, sin eventos de puntero, con respaldo estático', () => {
  const source = css()
  const tanque = ruleBody(source, '.lcl-tanque') ?? ''
  assert.match(tanque, /inset:\s*0/)
  assert.match(tanque, /height:\s*100%/)
  assert.match(tanque, /pointer-events:\s*none/)
  const zTanque = Number(/z-index:\s*(\d+)/.exec(tanque)?.[1])
  const zVentana = Number(/z-index:\s*(\d+)/.exec(ruleBody(source, '.proyectos-ventana') ?? '')?.[1])
  assert.ok(zTanque < zVentana, `z-index del tanque (${zTanque}) < ventana (${zVentana})`)
  assert.match(ruleBody(source, '.lcl-tanque canvas') ?? '', /pointer-events:\s*none/)
  const estatico = ruleBody(source, '.lcl-tanque[data-lcl="estatico"]') ?? ''
  assert.match(estatico, /linear-gradient\(/)
  assert.match(estatico, /inset:\s*33\.333% 0 0/) // el respaldo también llena 2/3
})

test('TanqueLCL.jsx: decorativo para tecnologías asistivas', () => {
  const src = read('src/components/proyectos/TanqueLCL.jsx')
  assert.match(src, /className="lcl-tanque"[^>]*aria-hidden="true"|aria-hidden="true"[^>]*className="lcl-tanque"/s)
  assert.match(src, /<canvas\b/)
  assert.doesNotMatch(src, /#FF7A1A/i)
})

test('useTanqueLCL.js: bucle único con ciclo de vida completo', () => {
  const src = read('src/hooks/useTanqueLCL.js')
  for (const fragmento of [
    'requestAnimationFrame',
    'cancelAnimationFrame',
    'IntersectionObserver',
    'visibilitychange',
    'ResizeObserver',
    'clearTimeout',
    'REDUCED_MOTION_QUERY',
    "addEventListener('change'",
    'shouldAnimate',
    'debeDibujar',
    'acumularImpulso',
    'aplicarImpulsos',
    'dprAcotado',
    "getContext('2d'",
    'EVA_THEME_COLORS.secondary',
    'last = null',
    'estatico',
  ]) {
    assert.ok(src.includes(fragmento), `falta ${fragmento}`)
  }
  assert.equal((src.match(/addEventListener\('pointermove'/g) ?? []).length, 1)
  assert.equal((src.match(/addEventListener\('pointerdown'/g) ?? []).length, 1)
  for (const m of src.matchAll(/addEventListener\('pointer(?:move|down)'[^)]*\)/g)) assert.match(m[0], /passive:\s*true/)
  assert.doesNotMatch(src, /preventDefault|Math\.random|setInterval|#FF7A1A/i)
  // limpieza
  for (const f of ['removeEventListener', 'disconnect()']) assert.ok(src.includes(f), `falta ${f}`)
})

// ───────── cristal propio del panel (.eva-glass-panel) ─────────

test('.eva-glass-panel: más transparente que .eva-glass, blur fuerte con saturate, brillo especular', () => {
  const source = css()
  const panel = ruleBody(source, '.eva-glass-panel') ?? ''
  assert.ok(panel, 'falta .eva-glass-panel')
  const fondo = parseRgbAlpha(panel, 'background-color')
  assert.ok(fondo && fondo.alpha >= 0.3 && fondo.alpha <= 0.5, `alfa del fondo ${fondo?.alpha}: debe estar entre 0.30 y 0.50`)
  const blur = /backdrop-filter:\s*blur\((\d+)px\)\s+saturate\(/.exec(panel)
  assert.ok(blur, 'backdrop-filter: blur(Npx) saturate(...)')
  assert.ok(Number(blur[1]) >= 14 && Number(blur[1]) <= 18, `blur ${blur[1]}px fuera de 14–18`)
  assert.match(panel, /border:\s*1px solid rgb\(155 92 240 \/ 0?\.\d+\)/)
  assert.match(panel, /background-image:[^;]*linear-gradient\(/, 'reflejo especular')
  assert.match(panel, /box-shadow:[^;]*inset/, 'brillo interior')
  // el cristal global no se toca: sigue al 0.8 (lo exigen About/Testimonios)
  assert.equal(parseRgbAlpha(ruleBody(source, '.eva-glass') ?? '', 'background-color')?.alpha, 0.8)
})

test('.eva-glass-panel: el respaldo opaco sin backdrop-filter va DESPUÉS de la regla base', () => {
  const source = css()
  const base = source.indexOf('.eva-glass-panel {')
  const respaldo = source.search(/@supports not[^{]*\{[^]*?\.eva-glass-panel\s*\{/)
  assert.ok(base >= 0 && respaldo > base, 'el @supports not debe seguir a la regla base')
  const dentro = ruleBody(source, '.eva-glass-panel', { within: '@supports not ((backdrop-filter: blur(1px)) or (-webkit-backdrop-filter: blur(1px)))' }) ?? ''
  assert.match(dentro, /background-color:\s*var\(--eva-panel\)/)
})

test('barra del panel: también de cristal (tinte y borde translúcidos)', () => {
  const barra = ruleBody(css(), '.proyectos-barra') ?? ''
  assert.ok(parseRgbAlpha(barra, 'background-color'), 'la barra necesita un tinte translúcido')
  assert.match(barra, /border:\s*1px solid rgb\(155 92 240/)
  assert.match(barra, /backdrop-filter:\s*blur\(/)
})

test('PanelProyectos.jsx: usa eva-glass-panel (no el cristal global)', () => {
  const src = read('src/components/proyectos/PanelProyectos.jsx')
  assert.ok(src.includes('eva-glass-panel'))
  assert.doesNotMatch(src.replace(/eva-glass-panel/g, ''), /eva-glass/)
})

test('contraste del texto de la barra sobre el cristal del panel, sobre la grilla (peor fondo)', () => {
  const panel = parseRgbAlpha(ruleBody(css(), '.eva-glass-panel') ?? '', 'background-color')
  const barra = parseRgbAlpha(ruleBody(css(), '.proyectos-barra') ?? '', 'background-color')
  const grilla = blendOver('#9b5cf0', EVA_THEME_COLORS.black, 0.14)
  const sobrePanel = blendOver(panel.hex, grilla, panel.alpha)
  const sobreBarra = blendOver(barra.hex, sobrePanel, barra.alpha)
  const errores = []
  for (const [nombre, hex] of [
    ['papel', EVA_THEME_COLORS.paper],
    ['violeta claro', EVA_THEME_COLORS['primary-light']],
  ]) {
    const r = contrastRatio(hex, sobreBarra)
    if (r < 4.5) errores.push(`${nombre} sobre la barra de cristal: ${r.toFixed(2)} < 4.5`)
  }
  assert.deepEqual(errores, [])
})

// ───────── líquido translúcido y burbujas ─────────

test('lclDibujo.js: capas translúcidas y burbujas', () => {
  const src = read('src/utils/lclDibujo.js')
  const alfas = [...src.matchAll(/ALFA_(?:CAPAS|SUPERFICIE|FONDO)\w*\s*=\s*([^\n]+)/g)].flatMap((m) => [...m[1].matchAll(/\d*\.\d+/g)].map((x) => Number(x[0])))
  assert.ok(alfas.length > 0 && alfas.every((a) => a <= 0.6), `alfas del líquido: ${alfas}`)
  assert.match(src, /dibujarBurbujas|arc\(/)
})

test('useTanqueLCL.js: pool de burbujas con PRNG de semilla fija, sin Math.random', () => {
  const src = read('src/hooks/useTanqueLCL.js')
  for (const f of ['crearBurbujas', 'crearRng', 'pasoBurbujas']) assert.ok(src.includes(f), `falta ${f}`)
  assert.doesNotMatch(src, /Math\.random/)
})
