/**
 * Tests del rediseño eva del configurador (change `configurador-estilo-eva`):
 * estilos puros, contraste de estados y guard estático de toda la carpeta.
 */
import assert from 'node:assert/strict'
import { readFileSync, readdirSync } from 'node:fs'
import test from 'node:test'

import { EVA_COLORS } from '../src/styles/eva-tokens.js'
import { findForbiddenTokens, withoutMotionSafe } from './lib/class-guard.mjs'
import { blendOver, checkContrastPairs, contrastRatio } from './lib/contrast.mjs'
import {
  BOTON_EDITAR,
  BOTON_PRIMARIO,
  BOTON_SECUNDARIO,
  PANEL,
  claseCampo,
  claseIndicador,
  claseModulo,
  clasePaso,
  codigoModulo,
  estadoPaso,
} from '../src/components/configurador/estilos.js'

const ROOT = new URL('../', import.meta.url)
const DIR = new URL('src/components/configurador/', ROOT)
const read = (path) => readFileSync(new URL(path, ROOT), 'utf8')
const tokens = (cls) => cls.split(/\s+/).filter(Boolean)
const has = (cls, token) => tokens(cls).includes(token)

// --- Estilos puros (design D2) ---------------------------------------------

test('codigoModulo: prefijo y número de dos dígitos desde 1', () => {
  assert.equal(codigoModulo('TIPO', 0), 'TIPO-01')
  assert.equal(codigoModulo('EXT', 9), 'EXT-10')
  assert.equal(codigoModulo('TIPO', 3), 'TIPO-04')
})

test('estadoPaso: antes, igual y después del paso actual', () => {
  assert.equal(estadoPaso(0, 2), 'done')
  assert.equal(estadoPaso(1, 2), 'done')
  assert.equal(estadoPaso(2, 2), 'current')
  assert.equal(estadoPaso(0, 0), 'current')
  assert.equal(estadoPaso(3, 2), 'pending')
  assert.equal(estadoPaso(1, 0), 'pending')
})

test('claseModulo: el seleccionado suma borde naranja y sombra sólida desplazada', () => {
  const on = claseModulo(true)
  const off = claseModulo(false)
  assert.ok(has(on, 'border-eva-orange'))
  assert.ok(has(on, 'shadow-[6px_6px_0_0_var(--eva-orange)]'))
  assert.ok(on.includes('bg-eva-orange/10'))
  assert.ok(!has(off, 'border-eva-orange'))
  assert.ok(!tokens(off).some((t) => t.startsWith('shadow-[')))
  assert.ok(has(off, 'border-eva-gray-dim'))
})

test('claseIndicador: relleno con naranja solo si está seleccionado', () => {
  assert.ok(has(claseIndicador(true), 'bg-eva-orange'))
  assert.ok(has(claseIndicador(true), 'text-eva-black'))
  assert.ok(!has(claseIndicador(false), 'bg-eva-orange'))
  assert.ok(has(claseIndicador(false), 'border-eva-gray-dim'))
})

test('claseCampo: error usa borde rojo; sin error, foco naranja', () => {
  const err = claseCampo(true)
  const ok = claseCampo(false)
  assert.ok(has(err, 'border-eva-red'))
  assert.ok(has(err, 'focus:border-eva-red'))
  assert.ok(!has(err, 'focus:border-eva-orange'))
  assert.ok(has(ok, 'focus:border-eva-orange'))
  assert.ok(!has(ok, 'border-eva-red'))
  assert.ok(has(ok, 'border-eva-gray-dim'))
})

test('clasePaso: los tres estados son distintos y el actual va relleno', () => {
  const done = clasePaso('done')
  const current = clasePaso('current')
  const pending = clasePaso('pending')
  assert.equal(new Set([done, current, pending]).size, 3)
  assert.ok(has(current, 'bg-eva-orange'))
  assert.ok(has(done, 'text-eva-green'))
  assert.ok(has(pending, 'border-eva-gray-dim'))
  assert.throws(() => clasePaso('otro'))
})

test('botones: deshabilitado por fondo y borde, sin opacidad ni sombra', () => {
  for (const cls of [BOTON_PRIMARIO, BOTON_SECUNDARIO, BOTON_EDITAR]) {
    assert.ok(has(cls, 'disabled:bg-eva-line'))
    assert.ok(has(cls, 'disabled:text-eva-gray'))
    assert.ok(has(cls, 'disabled:shadow-none'))
    assert.ok(!cls.includes('opacity'))
    assert.ok(has(cls, 'border-2'))
  }
})

test('PANEL: panel eva opaco', () => {
  assert.ok(has(PANEL, 'eva-panel'))
  assert.ok(!PANEL.includes('glass'))
})

test('toda traslación del módulo de estilos va con motion-safe:', () => {
  const all = [
    BOTON_PRIMARIO,
    BOTON_SECUNDARIO,
    BOTON_EDITAR,
    PANEL,
    claseModulo(true),
    claseModulo(false),
    claseIndicador(true),
    claseCampo(false),
    clasePaso('current'),
  ].join(' ')
  const found = findForbiddenTokens(all, [
    { rule: 'translate sin motion-safe', pattern: withoutMotionSafe(String.raw`-?translate-[xy]-[\w./-]+`) },
  ])
  assert.deepEqual(found, [])
  assert.ok(all.includes('motion-safe:hover:-translate-y-0.5'), 'debe haber traslación en hover')
})

// --- Guard de estilo (design D8) -------------------------------------------

const utility = (src) => new RegExp(String.raw`(?<![\w.-])(?:[\w-]+:)*${src}(?![\w-])`)

/** Reglas del guard del configurador. */
const RULES = [
  { rule: 'accent-*', pattern: utility(String.raw`(?:[a-z]+-)?accent-[\w/.-]+`) },
  { rule: 'neon-*', pattern: utility(String.raw`(?:[a-z]+-)?neon-[\w/.-]+`) },
  { rule: 'muted-*', pattern: utility(String.raw`(?:[a-z]+-)?muted-[\w/.-]+`) },
  {
    rule: 'dark / dark-*',
    pattern: utility(String.raw`(?:bg|text|border|from|to|via|ring|divide|fill|stroke|shadow|outline)-dark(?:-[\w/.-]+)?`),
  },
  { rule: 'glow', pattern: utility(String.raw`(?:[\w-]*-)?glow(?:-[\w/.-]+)?`) },
  { rule: 'gradient-text/border', pattern: utility(String.raw`gradient-(?:text|border)`) },
  { rule: 'glass', pattern: utility(String.raw`glass(?:-hover)?`) },
  { rule: 'tag (clase vieja)', pattern: utility('tag') },
  { rule: 'section-title / cyber-grid', pattern: utility(String.raw`section-title|cyber-grid`) },
  { rule: 'font-display (Orbitron)', pattern: utility('font-display') },
  { rule: 'text-white', pattern: utility(String.raw`text-white(?:\/\d+)?`) },
  { rule: 'text-gray-N', pattern: utility(String.raw`text-gray-\d+(?:\/\d+)?`) },
  { rule: 'rounded', pattern: utility(String.raw`rounded(?:-[\w/.[\]-]+)?`) },
  { rule: 'blur / backdrop', pattern: utility(String.raw`(?:backdrop-[\w-]+|blur(?:-[\w]+)?)`) },
  { rule: 'disabled:opacity', pattern: /(?<![\w.-])(?:[\w-]+:)*disabled:(?:[\w-]+:)*opacity-[\w/.-]+/ },
  { rule: 'texto rojo/violeta/gray-dim', pattern: utility(String.raw`text-eva-(?:red|purple|gray-dim)(?:\/\d+)?`) },
  { rule: 'animate-*', pattern: utility(String.raw`animate-[\w-]+`) },
  { rule: 'traslación sin motion-safe', pattern: withoutMotionSafe(String.raw`-?translate-[xy]-[\w./-]+`) },
  { rule: 'hex literal', pattern: /-\[#[0-9a-fA-F]{3,8}\]|['"`]#[0-9a-fA-F]{6,8}['"`]/ },
]

const rulesOf = (source) => findForbiddenTokens(source, RULES).map((f) => f.rule)

test('guard: detecta cada estilo de la paleta anterior (con variantes)', () => {
  const casos = {
    'text-accent-green': 'accent-*',
    'hover:border-dark-border': 'dark / dark-*',
    'bg-dark': 'dark / dark-*',
    'text-dark': 'dark / dark-*',
    'box-glow-cyan': 'glow',
    'text-glow-pink': 'glow',
    'gradient-text': 'gradient-text/border',
    'glass p-4': 'glass',
    'glass-hover': 'glass',
    tag: 'tag (clase vieja)',
    'font-display': 'font-display (Orbitron)',
    'text-white': 'text-white',
    'text-gray-400': 'text-gray-N',
    'md:text-gray-300': 'text-gray-N',
    'rounded-md': 'rounded',
    'md:rounded-full': 'rounded',
    'disabled:opacity-50': 'disabled:opacity',
    'text-eva-red': 'texto rojo/violeta/gray-dim',
    'placeholder:text-eva-gray-dim': 'texto rojo/violeta/gray-dim',
    'hover:-translate-y-0.5': 'traslación sin motion-safe',
    'bg-[#00ffc3]': 'hex literal',
    'animate-pulse': 'animate-*',
    'backdrop-blur-sm': 'blur / backdrop',
    'text-neon-pink': 'neon-*',
    'bg-muted-800': 'muted-*',
  }
  for (const [cls, rule] of Object.entries(casos)) {
    const found = rulesOf(`<div className="mt-2 ${cls} p-1">`)
    assert.ok(found.includes(rule), `${cls} debería disparar ${rule}, dio ${JSON.stringify(found)}`)
  }
})

test('guard: no hay falsos positivos con tokens eva ni con texto del sitio', () => {
  const limpios = [
    'font-eva-display',
    'eva-nav-glass',
    'eva-tag',
    '{service.tag}',
    'motion-safe:hover:-translate-y-0.5',
    'href="#contenido"',
    'bg-eva-orange/10',
    'text-eva-gray',
    'border-eva-gray-dim',
    'disabled:bg-eva-line',
    'motion-safe:transition-[transform,box-shadow]',
    'eva-panel-label',
    'shadow-[6px_6px_0_0_var(--eva-orange)]',
  ]
  for (const cls of limpios) {
    assert.deepEqual(rulesOf(`<div className="${cls}">`), [], cls)
  }
})

// --- Archivos migrados (design D8, tareas 3.2 y 7.2) -----------------------

/** Requisitos de contrato (ARIA, honeypot, uso de estilos) por archivo. */
const REQUISITOS = {
  'estilos.js': [],
  'ServiceCards.jsx': ['aria-pressed', 'claseModulo', 'claseIndicador', 'codigoModulo', 'eva-tag'],
  'ExtrasCards.jsx': ['aria-pressed', 'claseModulo', 'claseIndicador', 'codigoModulo', 'border-l-4 border-eva-orange'],
  'FormStep.jsx': [
    'aria-invalid',
    'aria-describedby',
    'role="alert"',
    'HONEYPOT_FIELD',
    'tabIndex={-1}',
    'autoComplete="off"',
    'maxLength',
    'claseCampo',
    'ERR',
  ],
  'QuantityControl.jsx': [
    'aria-label="Restar una unidad"',
    'aria-label="Sumar una unidad"',
    'role="status"',
    'disabled:bg-eva-line',
  ],
  'WizardSteps.jsx': ['aria-current', 'estadoPaso', 'clasePaso'],
  'SummarySidebar.jsx': ['aria-label="Resumen de la solicitud"', 'eva-panel', 'eva-panel-label'],
  'ReviewStep.jsx': ['eva-panel', 'BOTON_EDITAR', 'BOTON_PRIMARIO', 'mailto:'],
  'SuccessStep.jsx': ['headingRef', 'tabIndex={-1}', 'eva-panel'],
  'ErrorStep.jsx': ['headingRef', 'tabIndex={-1}', 'eva-panel', 'eva-stripes-red', 'mailto:', 'whatsappUrl'],
}

const PAGINA = {
  'pages/Configurador.jsx': [
    'font-eva-display',
    'eva-hex-grid',
    'role="status"',
    'aria-live="polite"',
    'BOTON_PRIMARIO',
    'BOTON_SECUNDARIO',
    'NavBrand',
  ],
}

const archivosCarpeta = () => readdirSync(DIR).filter((n) => /\.(js|jsx)$/.test(n))

test('la carpeta del configurador tiene al menos 10 archivos .js/.jsx inspeccionados', () => {
  assert.ok(archivosCarpeta().length >= 10, archivosCarpeta().join(', '))
  for (const name of archivosCarpeta()) {
    assert.ok(name in REQUISITOS || name === 'serviceIcons.js', `archivo sin requisitos declarados: ${name}`)
  }
})

test('ningún archivo del configurador usa estilos de la paleta anterior', () => {
  const fuentes = [
    ...archivosCarpeta().map((n) => [`components/configurador/${n}`, read(`src/components/configurador/${n}`)]),
    ['pages/Configurador.jsx', read('src/pages/Configurador.jsx')],
  ]
  const hallazgos = fuentes.flatMap(([name, src]) =>
    findForbiddenTokens(src, RULES).map((f) => `${name}: ${f.match} (${f.rule})`),
  )
  assert.deepEqual(hallazgos, [])
})

test('cada archivo cumple sus requisitos de contrato', () => {
  const faltantes = []
  for (const [name, reqs] of Object.entries(REQUISITOS)) {
    const src = read(`src/components/configurador/${name}`)
    for (const req of reqs) if (!src.includes(req)) faltantes.push(`${name}: falta ${req}`)
  }
  for (const [name, reqs] of Object.entries(PAGINA)) {
    const src = read(`src/${name}`)
    for (const req of reqs) if (!src.includes(req)) faltantes.push(`${name}: falta ${req}`)
  }
  assert.deepEqual(faltantes, [])
})

test('la página no redefine el color de la grilla hexagonal', () => {
  assert.ok(!read('src/pages/Configurador.jsx').includes('--eva-hex-color'))
})

// --- Contraste (design D6) --------------------------------------------------

const CONFIGURADOR_CONTRAST_PAIRS = [
  ...['paper', 'gray', 'orange', 'green'].flatMap((fg) =>
    ['black', 'panel'].map((bg) => ({ fg, bg, level: 'normal' })),
  ),
  { fg: 'black', bg: 'orange', level: 'normal' },
  { fg: 'black', bg: 'red', level: 'normal' },
  { fg: 'gray', bg: 'line', level: 'normal' },
  { fg: 'gray-dim', bg: 'black', level: 'ui' },
  { fg: 'gray-dim', bg: 'panel', level: 'ui' },
  { fg: 'orange', bg: 'panel', level: 'ui' },
  { fg: 'orange', bg: 'black', level: 'ui' },
  { fg: 'red', bg: 'black', level: 'ui' },
  { fg: 'red', bg: 'panel', level: 'ui' },
  { fg: 'green', bg: 'black', level: 'ui' },
  { fg: 'green', bg: 'panel', level: 'ui' },
]

/**
 * Evalúa los textos sobre los fondos mezclados (tarjeta seleccionada y banda
 * hexagonal) contra 4.5:1.
 * @returns {string[]} errores legibles (par, fondo, valor)
 */
function evaluarMezclas({ alphaSeleccionado, alphaHex }) {
  const fondos = {
    'tarjeta seleccionada': blendOver(EVA_COLORS.orange, EVA_COLORS.panel, alphaSeleccionado),
    'banda hexagonal': blendOver(EVA_COLORS.orange, EVA_COLORS.black, alphaHex),
  }
  const errores = []
  for (const [nombre, bg] of Object.entries(fondos)) {
    for (const fg of ['paper', 'gray', 'orange']) {
      const ratio = contrastRatio(EVA_COLORS[fg], bg)
      if (ratio < 4.5) errores.push(`${fg} sobre ${nombre} (${bg}): ${Math.floor(ratio * 100) / 100} < 4.5`)
    }
  }
  return errores
}

function alphasReales() {
  const estilos = read('src/components/configurador/estilos.js')
  const sel = /bg-eva-orange\/(\d+)/.exec(estilos)
  assert.ok(sel, 'estilos.js debe tener bg-eva-orange/NN para el seleccionado')
  const css = read('src/index.css')
  const hex = /var\(--eva-hex-color,\s*rgb\(\s*255 122 26 \/\s*([\d.]+)\s*\)\)/.exec(css)
  assert.ok(hex, 'index.css debe tener el respaldo de --eva-hex-color')
  return { alphaSeleccionado: Number(sel[1]) / 100, alphaHex: Number(hex[1]) }
}

test('contraste: pares de texto y de componentes del configurador', () => {
  assert.deepEqual(checkContrastPairs(EVA_COLORS, CONFIGURADOR_CONTRAST_PAIRS), [])
})

test('contraste: textos sobre el fondo seleccionado y la banda hexagonal reales', () => {
  assert.deepEqual(evaluarMezclas(alphasReales()), [])
})

test('contraste: un tinte de 0.30 en el seleccionado se detecta (gray < 4.5)', () => {
  const errores = evaluarMezclas({ ...alphasReales(), alphaSeleccionado: 0.3 })
  assert.ok(errores.every((e) => e.includes('tarjeta seleccionada')))
  assert.ok(errores.some((e) => /^gray sobre tarjeta seleccionada \(#[0-9a-f]{6}\): 4\.2\d < 4\.5$/.test(e)))
})

test('contraste: una grilla hexagonal más intensa se detecta', () => {
  const errores = evaluarMezclas({ ...alphasReales(), alphaHex: 0.5 })
  assert.ok(errores.some((e) => e.includes('banda hexagonal')))
})
