/**
 * Jerarquía de color violeta > naranja > verde agua (change `jerarquia-color-violeta`).
 * Unitarios del módulo puro `lib/color-roles.mjs` (positivos, negativos y
 * triangulación con fixtures) y test de archivos sobre `src/`.
 */
import assert from 'node:assert/strict'
import { readdirSync, readFileSync, statSync } from 'node:fs'
import test from 'node:test'

import { EVA_COLORS } from '../src/styles/eva-tokens.js'
import {
  COMPONENT_CLASSES,
  MIN_PRIMARY_OVER_SECONDARY,
  countRoleUses,
  findAccentColorNames,
  findStatusOutsideConfigurador,
} from './lib/color-roles.mjs'
import { ruleBody } from './lib/css-rules.mjs'

// --- findAccentColorNames ---------------------------------------------------

const names = (source) => findAccentColorNames(source).map((hit) => hit.match)

test('findAccentColorNames: detecta nombres de color de acento con cualquier prefijo o variante', () => {
  const positivos = [
    'hover:border-eva-orange',
    'shadow-[4px_4px_0_0_var(--eva-orange)]',
    'theme(colors.eva.orange)',
    'text-eva-green',
    'bg-eva-red',
    'md:text-eva-violet-light',
    'bg-eva-aqua/10',
    'text-eva-sky',
    'border-eva-red-light',
    'text-eva-purple',
    'eva-stripes-red',
    'color: #8A4FD8;',
    'color: #3dff7a;',
    'color: #E8202A;',
  ]
  for (const source of positivos) assert.ok(names(source).length >= 1, `no detectó: ${source}`)
})

test('findAccentColorNames: no marca roles, materiales ni estados', () => {
  const negativos = [
    'text-eva-primary-light',
    'bg-eva-primary/10',
    'eva-panel',
    'eva-panel-label eva-panel-label-success',
    'eva-stripes-error',
    'text-eva-success',
    'border-eva-error',
    'shadow-[6px_6px_0_0_var(--eva-secondary)]',
    'theme(colors.eva.tertiary)',
    'text-eva-gray-dim',
    'var(--eva-focus)',
  ]
  for (const source of negativos) assert.deepEqual(names(source), [], source)
})

test('findAccentColorNames: informa el token exacto de cada hallazgo', () => {
  assert.deepEqual(names('<a className="p-2 hover:border-eva-orange text-eva-green">'), ['eva-orange', 'eva-green'])
})

// --- countRoleUses ----------------------------------------------------------

const count = (source) => countRoleUses(source)

test('countRoleUses: cuenta tokens en reposo por rol y suma primary-light a primary', () => {
  const source = `<a className="border-eva-primary text-eva-primary-light bg-eva-primary/10 shadow-[6px_6px_0_0_var(--eva-secondary)] text-eva-tertiary">`
  assert.deepEqual(count(source), { primary: 3, secondary: 1, tertiary: 1 })
})

test('countRoleUses: las variantes de estado no cuentan, las de breakpoint sí', () => {
  const soloEstados = `<a className="hover:border-eva-secondary focus:text-eva-secondary focus-visible:bg-eva-secondary focus-within:border-eva-secondary group-hover:text-eva-secondary group-focus-visible:bg-eva-secondary active:bg-eva-secondary disabled:text-eva-secondary motion-safe:hover:bg-eva-secondary">`
  assert.deepEqual(count(soloEstados), { primary: 0, secondary: 0, tertiary: 0 })
  assert.deepEqual(count(`<a className="md:text-eva-secondary motion-safe:bg-eva-primary">`), {
    primary: 1,
    secondary: 1,
    tertiary: 0,
  })
})

test('countRoleUses: focus, success y error no cuentan (funcionales o semánticos)', () => {
  const source = `<a className="text-eva-success bg-eva-error border-eva-error" style="outline: var(--eva-focus)">`
  assert.deepEqual(count(source), { primary: 0, secondary: 0, tertiary: 0 })
})

test('countRoleUses: cuenta var(--eva-rol) y theme(colors.eva.rol) dentro de valores arbitrarios', () => {
  const source = `"shadow-[6px_6px_0_0_theme(colors.eva.secondary)] shadow-[inset_0_0_0_1px_var(--eva-primary)]"`
  assert.deepEqual(count(source), { primary: 1, secondary: 1, tertiary: 0 })
})

test('countRoleUses: las clases de componente aportan el rol de su material', () => {
  assert.equal(COMPONENT_CLASSES['eva-panel'], 'primary')
  assert.deepEqual(count(`<div className="eva-panel p-4 eva-hex-grid">`), { primary: 2, secondary: 0, tertiary: 0 })
  assert.deepEqual(count(`<div className="eva-glass">`), { primary: 1, secondary: 0, tertiary: 0 })
  assert.deepEqual(count(`<div className="eva-stripes h-1">`), { primary: 0, secondary: 1, tertiary: 0 })
  assert.deepEqual(count(`<div className="eva-stripes eva-stripes-primary h-3">`), { primary: 1, secondary: 0, tertiary: 0 })
})

test('countRoleUses: las variantes de estado de una clase de componente anulan la base', () => {
  assert.deepEqual(count(`<div className="eva-stripes eva-stripes-error absolute">`), { primary: 0, secondary: 0, tertiary: 0 })
  assert.deepEqual(count(`<span className="eva-panel-label eva-panel-label-success">`), { primary: 0, secondary: 0, tertiary: 0 })
  assert.deepEqual(count(`<span className="eva-panel-label eva-panel-label-error">`), { primary: 0, secondary: 0, tertiary: 0 })
  assert.deepEqual(count(`<span className="eva-panel-label">`), { primary: 1, secondary: 0, tertiary: 0 })
})

test('countRoleUses: ignora texto de JSX que no es una cadena de clases', () => {
  assert.deepEqual(count(`<p>El rol eva-primary no se cuenta fuera de comillas</p>`), { primary: 0, secondary: 0, tertiary: 0 })
})

// --- triangulación de la regla de jerarquía ---------------------------------

/** Evalúa la regla de D6: primary > secondary > tertiary >= 1 y primary >= 1.5 x secondary. */
function evaluateHierarchy({ primary, secondary, tertiary }) {
  const errors = []
  if (!(primary > secondary)) errors.push(`primario ${primary} no supera al secundario ${secondary}`)
  if (!(secondary > tertiary)) errors.push(`secundario ${secondary} no supera al terciario ${tertiary}`)
  if (tertiary < 1) errors.push('falta el terciario')
  if (primary < MIN_PRIMARY_OVER_SECONDARY * secondary) {
    errors.push(`primario ${primary} < ${MIN_PRIMARY_OVER_SECONDARY} x secundario ${secondary}`)
  }
  return errors
}

test('jerarquía: un fixture con más naranja que violeta falla', () => {
  const c = count(`<a className="border-eva-secondary text-eva-secondary bg-eva-secondary border-eva-primary text-eva-tertiary">`)
  assert.ok(evaluateHierarchy(c).length > 0, JSON.stringify(c))
})

test('jerarquía: un fixture con usos solo en hover no cuenta y falla', () => {
  const c = count(`<a className="hover:border-eva-primary hover:text-eva-primary border-eva-secondary text-eva-tertiary">`)
  assert.equal(c.primary, 0)
  assert.ok(evaluateHierarchy(c).length > 0)
})

test('jerarquía: un fixture sin terciario falla', () => {
  const c = count(`<a className="border-eva-primary text-eva-primary-light bg-eva-primary shadow-[1px_1px_0_0_var(--eva-secondary)]">`)
  assert.equal(c.tertiary, 0)
  assert.ok(evaluateHierarchy(c).some((e) => /terciario/.test(e)))
})

test('jerarquía: un empate parcial (menos de 1.5x) falla', () => {
  const c = { primary: 12, secondary: 10, tertiary: 3 }
  assert.ok(evaluateHierarchy(c).some((e) => /x secundario/.test(e)))
  assert.deepEqual(evaluateHierarchy({ primary: 15, secondary: 10, tertiary: 3 }), [])
})

// --- findStatusOutsideConfigurador ------------------------------------------

test('findStatusOutsideConfigurador: success y error solo viven en el configurador y en index.css', () => {
  const fuera = findStatusOutsideConfigurador([
    { path: 'src/components/Hero.jsx', source: '<p className="text-eva-success eva-stripes-error">' },
    { path: 'src/components/Contact.jsx', source: '<p className="border-eva-error eva-panel-label-success">' },
    { path: 'src/App.jsx', source: 'theme(colors.eva.error)' },
  ])
  assert.deepEqual(
    fuera.map((h) => `${h.path}:${h.match}`),
    [
      'src/components/Hero.jsx:eva-success',
      'src/components/Hero.jsx:eva-stripes-error',
      'src/components/Contact.jsx:eva-error',
      'src/components/Contact.jsx:eva-panel-label-success',
      'src/App.jsx:colors.eva.error',
    ],
  )
})

test('findStatusOutsideConfigurador: lo permitido y los roles de jerarquía no se marcan', () => {
  const fuera = findStatusOutsideConfigurador([
    { path: 'src/components/configurador/SuccessStep.jsx', source: 'text-eva-success bg-eva-success eva-panel-label-success' },
    { path: 'src/components/configurador/ErrorStep.jsx', source: 'eva-stripes-error text-eva-error' },
    { path: 'src/pages/Configurador.jsx', source: 'border-eva-error' },
    { path: 'src/index.css', source: '.eva-panel-label-error { background-color: var(--eva-error); }' },
    { path: 'src/components/Hero.jsx', source: 'text-eva-primary-light eva-stripes eva-panel' },
  ])
  assert.deepEqual(fuera, [])
})

// --- Archivos reales --------------------------------------------------------

const ROOT = new URL('../', import.meta.url)

function walk(dir) {
  const out = []
  for (const name of readdirSync(new URL(`${dir}/`, ROOT))) {
    const rel = `${dir}/${name}`
    if (statSync(new URL(rel, ROOT)).isDirectory()) out.push(...walk(rel))
    else if (/\.(js|jsx)$/.test(name)) out.push(rel)
  }
  return out
}

const load = (rel) => ({ path: rel, source: readFileSync(new URL(rel, ROOT), 'utf8') })
const COMPONENT_FILES = [...walk('src/components'), ...walk('src/pages'), 'src/App.jsx'].map(load)
const CSS = readFileSync(new URL('src/index.css', ROOT), 'utf8')

/** `src/index.css` sin el bloque `:root`, donde se definen las variables de los roles. */
function cssSinRoot(css) {
  const start = css.indexOf(':root {')
  const open = css.indexOf('{', start)
  let depth = 0
  for (let i = open; i < css.length; i += 1) {
    if (css[i] === '{') depth += 1
    if (css[i] === '}') {
      depth -= 1
      if (depth === 0) return css.slice(0, start) + css.slice(i + 1)
    }
  }
  return css
}

test('src: ningún componente, página ni App usa nombres de color de acento (solo roles)', () => {
  const hallazgos = [...COMPONENT_FILES, { path: 'src/index.css', source: cssSinRoot(CSS) }].flatMap(
    ({ path, source }) => findAccentColorNames(source).map((h) => `${path}: ${h.match}`),
  )
  assert.deepEqual(hallazgos, [])
})

test('src: los roles de estado (success, error) solo aparecen en el configurador y en index.css', () => {
  const fuera = findStatusOutsideConfigurador([...COMPONENT_FILES, { path: 'src/index.css', source: CSS }])
  assert.deepEqual(fuera.map((h) => `${h.path}: ${h.match}`), [])
})

test('jerarquía real: primary > secondary > tertiary >= 1 y primary >= 1.5 x secondary', () => {
  const total = { primary: 0, secondary: 0, tertiary: 0 }
  const porArchivo = {}
  for (const { path, source } of COMPONENT_FILES) {
    const c = countRoleUses(source)
    porArchivo[path] = c
    for (const role of Object.keys(total)) total[role] += c[role]
  }
  const resumen = `primario ${total.primary}, secundario ${total.secondary}, terciario ${total.tertiary}`
  assert.ok(total.tertiary >= 1, `falta el terciario: ${resumen}`)
  assert.ok(total.secondary > total.tertiary, `secundario no supera al terciario: ${resumen}`)
  assert.ok(total.primary > total.secondary, `primario no supera al secundario: ${resumen}`)
  assert.ok(total.primary >= MIN_PRIMARY_OVER_SECONDARY * total.secondary, `primario < ${MIN_PRIMARY_OVER_SECONDARY}x secundario: ${resumen}`)
})

test('tabla de clases de componente: la regla de cada clase nombra el rol o el literal rgb que le toca', () => {
  const violet = EVA_COLORS.violet.slice(1)
  const rgb = [0, 2, 4].map((i) => parseInt(violet.slice(i, i + 2), 16)).join(' ')
  const nombraRol = (body, role) =>
    new RegExp(`--eva-${role}\\)`).test(body) || (role === 'primary' && body.includes(`rgb(${rgb} /`))
  const reglas = {
    'eva-panel': ruleBody(CSS, '.eva-panel'),
    'eva-glass': ruleBody(CSS, '.eva-glass'),
    'eva-panel-label': ruleBody(CSS, '.eva-panel-label'),
    'eva-hex-grid': ruleBody(CSS, '.eva-hex-grid::before'),
    'eva-stripes-primary': ruleBody(CSS, '.eva-stripes-primary'),
    'eva-stripes': ruleBody(CSS, '.eva-stripes'),
  }
  for (const [clase, role] of Object.entries(COMPONENT_CLASSES)) {
    const body = reglas[clase]
    assert.ok(body, `no existe la regla de .${clase} en index.css`)
    assert.ok(nombraRol(body, role), `.${clase} debería nombrar ${role}: ${body.trim().slice(0, 80)}`)
  }
  assert.deepEqual(Object.keys(COMPONENT_CLASSES).sort(), Object.keys(reglas).sort())
})
