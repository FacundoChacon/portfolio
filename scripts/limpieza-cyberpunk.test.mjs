/**
 * Guard global contra restos de la estética cyberpunk (change limpieza-cyberpunk).
 * Reglas puras en scripts/lib/legacy-guard.mjs; acá se prueban y se aplican a todo `src/`.
 */
import assert from 'node:assert/strict'
import { readdirSync, readFileSync } from 'node:fs'
import test from 'node:test'

import tailwindConfig from '../tailwind.config.js'
import { LEGACY_RULES, PENDIENTES, PERMITIDOS, scanLegacy } from './lib/legacy-guard.mjs'

const hit = (source, path = 'src/x.jsx') => scanLegacy([{ path, source }], { rules: LEGACY_RULES, permitidos: [], pendientes: [] })
const rulesOf = (source, path) => hit(source, path).map((h) => h.rule)

test('detecta tokens de la paleta anterior con variantes y opacidad', () => {
  for (const cls of ['text-accent-green', 'hover:border-dark-border', 'bg-dark-card/60', 'bg-dark', 'md:from-accent-pink', 'text-muted-foreground']) {
    assert.ok(rulesOf(`<div className="${cls}" />`).includes('paleta-anterior'), cls)
  }
})

test('detecta brillos, glitch y animaciones cyberpunk', () => {
  assert.ok(rulesOf('<p className="box-glow-cyan" />').includes('brillo'))
  assert.ok(rulesOf('<p className="text-glow-magenta" />').includes('brillo'))
  assert.ok(rulesOf('<GlitchText text="x" />').includes('glitch'))
  assert.ok(rulesOf('.animate-glitch-line { }', 'src/a.css').includes('glitch'))
  assert.ok(rulesOf('<i className="animate-scan" />').includes('animacion-cyberpunk'))
  assert.ok(rulesOf('@keyframes scan { }', 'src/a.css').includes('animacion-cyberpunk'))
  assert.ok(rulesOf('animation: flicker 2s;', 'src/a.css').includes('animacion-cyberpunk'))
})

test('detecta familias retiradas y font-display solo como clase de marcado', () => {
  assert.ok(rulesOf("font-family: 'Rajdhani';", 'src/a.css').includes('familia-retirada'))
  assert.ok(rulesOf('import "@fontsource/rajdhani/400.css"').includes('familia-retirada'))
  assert.ok(rulesOf("font-family: 'Orbitron';", 'src/a.css').includes('familia-retirada'))
  assert.ok(rulesOf('<h1 className="font-display text-xl" />').includes('clase-font-display'))
  assert.ok(rulesOf('<h1 className="md:font-display" />').includes('clase-font-display'))
  assert.deepEqual(rulesOf('@font-face { font-display: swap; }', 'src/a.css'), [])
})

test('detecta clases heredadas sueltas', () => {
  for (const cls of ['cyber-grid', 'gradient-text', 'gradient-border', 'duotone-wrap', 'section-title', 'section-desc', 'glass', 'glass-hover', 'reveal', 'reveal-left', 'tag']) {
    assert.ok(rulesOf(`<div className="${cls} p-6" />`).includes('clase-heredada'), cls)
    assert.ok(rulesOf(`<div className="p-6 ${cls}" />`).includes('clase-heredada'), `${cls} al final`)
  }
  assert.ok(rulesOf('.glass { color: red; }', 'src/a.css').includes('clase-heredada'))
  assert.ok(rulesOf('.reveal.visible { }', 'src/a.css').includes('clase-heredada'))
  assert.ok(rulesOf('.tag { }', 'src/a.css').includes('clase-heredada'))
})

test('detecta hex y rgba de la paleta anterior sin distinguir mayúsculas', () => {
  assert.deepEqual(hit('color: #00FFC3;', 'src/a.css').map((h) => h.match), ['#00FFC3'])
  for (const v of ['#ff6eff', '#00cc9a', '#cc3acc', '#030303', '#0a0a0a', '#111116', '#1a1a22', '#0B0B10', 'rgba(0, 255, 195, 0.2)', 'rgba(255,110,255,0.3)']) {
    assert.ok(rulesOf(`x: ${v};`, 'src/a.css').includes('hex-paleta-anterior'), v)
  }
})

test('no marca lo eva ni usos legítimos', () => {
  const ok = [
    '<p className="font-eva-display eva-nav-glass eva-glass" />',
    '<p className="eva-tag eva-reveal" />',
    'const { reveal } = useReveal(); {service.tag}',
    '<span>{x.tag}</span> const tag = 1',
    '@media (prefers-color-scheme: dark) { .eva-cursor-blink { } }',
    '<p className="text-white text-gray-400 bg-eva-black text-eva-paper" />',
  ]
  for (const source of ok) assert.deepEqual(hit(source), [], source)
  assert.deepEqual(hit('@font-face { font-display: swap; } .eva-glass { } .eva-reveal { }', 'src/a.css'), [])
})

test('scanLegacy descarta permitidos y pendientes exactos y nada más', () => {
  const files = [{ path: 'src/pdf.js', source: "color: '#00ffc3', other: '#ff6eff'" }]
  const permitidos = [{ path: 'src/pdf.js', rule: 'hex-paleta-anterior', match: '#00ffc3', motivo: 'm' }]
  const res = scanLegacy(files, { rules: LEGACY_RULES, permitidos, pendientes: [] })
  assert.deepEqual(res.map((h) => h.match), ['#ff6eff'])
  const otro = scanLegacy([{ path: 'src/otro.js', source: "'#00ffc3'" }], { rules: LEGACY_RULES, permitidos, pendientes: [] })
  assert.equal(otro.length, 1)
  const pend = scanLegacy(files, { rules: LEGACY_RULES, permitidos: [], pendientes: [{ ...permitidos[0], match: '#ff6eff' }] })
  assert.deepEqual(pend.map((h) => h.match), ['#00ffc3'])
})

test('scope: reglas de markup no se aplican a CSS', () => {
  assert.deepEqual(rulesOf('font-display: swap;', 'src/a.css'), [])
})

// --- Archivos reales ---

const root = new URL('../', import.meta.url)
const sourceFiles = () => [
  ...readdirSync(new URL('src/', root), { recursive: true })
    .map((p) => `src/${String(p).replaceAll('\\', '/')}`)
    .filter((p) => /\.(js|jsx|css)$/.test(p)),
  'index.html',
].map((path) => ({ path, source: readFileSync(new URL(path, root), 'utf8') }))

test('src/ e index.html no tienen restos de la estética anterior', () => {
  const found = scanLegacy(sourceFiles(), { rules: LEGACY_RULES, permitidos: PERMITIDOS, pendientes: PENDIENTES })
  assert.deepEqual(found.map((f) => `${f.path} · ${f.rule} · ${f.match}`), [])
})

test('cada permitido y pendiente sigue ocurriendo (sin excepciones obsoletas)', () => {
  const found = scanLegacy(sourceFiles(), { rules: LEGACY_RULES, permitidos: [], pendientes: [] })
  for (const e of [...PERMITIDOS, ...PENDIENTES]) {
    assert.ok(e.motivo && e.motivo.length > 10, `${e.path} ${e.match}: falta motivo`)
    assert.ok(found.some((f) => f.path === e.path && f.rule === e.rule && f.match === e.match), `excepción obsoleta: ${e.path} · ${e.rule} · ${e.match}`)
  }
})

test('PERMITIDOS solo contiene el PDF del presupuesto', () => {
  assert.deepEqual([...new Set(PERMITIDOS.map((e) => e.path))], ['src/utils/pdfDocument.js'])
  assert.deepEqual(PENDIENTES, [])
})

// --- Configuración de Tailwind y dependencias ---

const extend = tailwindConfig.theme.extend

test('tailwind.config: sin tokens ni animaciones cyberpunk', () => {
  assert.deepEqual(Object.keys(extend.colors), ['eva'])
  assert.deepEqual(Object.keys(extend.animation), ['eva-boot'])
  assert.deepEqual(Object.keys(extend.keyframes), ['evaBoot'])
  for (const name of ['flicker', 'fade-in', 'slide-up', 'pulse-slow']) assert.ok(!(name in extend.animation), name)
  for (const name of ['flicker', 'fadeIn', 'slideUp']) assert.ok(!(name in extend.keyframes), name)
})

test('package.json: sin los paquetes de fuentes retirados y con los vivos', () => {
  const pkg = JSON.parse(readFileSync(new URL('package.json', root), 'utf8'))
  const deps = { ...pkg.dependencies, ...pkg.devDependencies }
  assert.ok(!('@fontsource/rajdhani' in deps))
  assert.ok(!('@fontsource-variable/orbitron' in deps))
  assert.ok('@fontsource-variable/noto-serif-display' in deps)
  assert.ok('@fontsource-variable/jetbrains-mono' in deps)
})

test('detecta los hex de la paleta eva anterior (#8A4FD8, #3DFF7A, #E8202A) y no los de la actual', () => {
  for (const v of ['#8A4FD8', '#3dff7a', '#E8202A']) {
    assert.ok(rulesOf(`x: ${v};`, 'src/a.css').includes('hex-paleta-anterior'), v)
    assert.ok(rulesOf(`<i style={{ color: '${v}' }} />`).includes('hex-paleta-anterior'), v)
  }
  for (const v of ['#9B5CF0', '#B08AFF', '#74F8D4', '#7CC8FF', '#FF8A9A', '#FF7A1A']) {
    assert.deepEqual(rulesOf(`x: ${v};`, 'src/a.css'), [], v)
  }
})
