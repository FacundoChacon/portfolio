/**
 * Guard estático de `Stack.jsx` (change `stack-neumorfico-oscuro`, design D6):
 * sin color de marca, sin foco ni rol falsos, con la semántica y el material
 * exigidos. Detector por tokens probado con fuentes de ejemplo.
 */
import assert from 'node:assert/strict'
import { existsSync, readFileSync } from 'node:fs'
import test from 'node:test'

import { findForbiddenTokens } from './lib/class-guard.mjs'

const STACK_SOURCE = readFileSync(new URL('../src/components/Stack.jsx', import.meta.url), 'utf8')

/** Reglas prohibidas en `Stack.jsx` (nombre legible + patrón). */
const FORBIDDEN_RULES = [
  { rule: '--tech', pattern: /--tech\b/ },
  { rule: 'tabIndex', pattern: /\btabIndex\b/ },
  { rule: 'role="button"', pattern: /role=["']button["']/ },
  { rule: 'cursor-pointer', pattern: /(?<![\w-])cursor-pointer(?![\w-])/ },
  { rule: 'truncate', pattern: /(?<![\w-])truncate(?![\w-])/ },
  { rule: 'accent-*', pattern: /(?<![\w-])(?:[\w-]+:)*(?:[\w]+-)?accent-[\w/[\]-]+/ },
  { rule: 'neon-*', pattern: /(?<![\w-])(?:[\w-]+:)*[\w]+-neon-[\w/[\]-]+/ },
  { rule: 'dark-*', pattern: /(?<![\w-])(?:[\w-]+:)*(?:bg|text|border|from|to|via|ring|shadow)-dark-[\w/[\]-]+/ },
  { rule: '*-glow-*', pattern: /(?<![\w-])(?:text|box|drop)-glow-[\w-]+/ },
  { rule: 'glitch', pattern: /glitch/i },
  { rule: 'rounded*', pattern: /(?<![\w-])(?:[\w-]+:)*rounded(?:-[\w[\]/-]+)?(?![\w-])/ },
  { rule: 'font-display', pattern: /(?<![\w-])(?:[\w-]+:)*font-display(?![\w-])/ },
  { rule: 'text-white', pattern: /(?<![\w-])(?:[\w-]+:)*text-white(?![\w-])/ },
  { rule: 'text-gray-*', pattern: /(?<![\w-])(?:[\w-]+:)*text-gray-\d+/ },
  { rule: 'hex literal', pattern: /#[0-9a-fA-F]{6}\b|#[0-9a-fA-F]{3}\b(?![\w-])/ },
  { rule: 'reveal legacy', pattern: /(?<![\w-])(?:reveal|reveal-right)(?![\w-])/ },
  { rule: 'pasá el cursor', pattern: /pas[aá] el cursor/i },
]

/** Fragmentos que `Stack.jsx` debe contener. */
const REQUIRED = [
  'eva-neu-surface',
  'eva-neu-module',
  'eva-reveal',
  'role="list"',
  'id="stack"',
  'aria-labelledby',
  'aria-hidden',
  'from "../data/stack"',
]

const forbiddenIn = (source) => findForbiddenTokens(source, FORBIDDEN_RULES).map((f) => f.rule)
const missingIn = (source) => REQUIRED.filter((fragment) => !source.includes(fragment))

test('detector: encuentra cada patrón prohibido', () => {
  assert.deepEqual(forbiddenIn('style={{ "--tech": c }} tabIndex={0}'), ['--tech', 'tabIndex'])
  assert.deepEqual(forbiddenIn('<div role="button" className="cursor-pointer truncate">'), [
    'role="button"',
    'cursor-pointer',
    'truncate',
  ])
  assert.deepEqual(forbiddenIn('className="text-accent-green hover:border-accent-cyan"'), ['accent-*', 'accent-*'])
  assert.deepEqual(forbiddenIn('className="bg-dark-card text-glow-cyan rounded-lg font-display text-white text-gray-400"'), [
    'dark-*',
    '*-glow-*',
    'rounded*',
    'font-display',
    'text-white',
    'text-gray-*',
  ])
  assert.deepEqual(forbiddenIn('color: "#f89820" reveal reveal-right'), ['hex literal', 'reveal legacy', 'reveal legacy'])
  assert.deepEqual(forbiddenIn('Tocá o pasá el cursor para verlas'), ['pasá el cursor'])
})

test('detector: acepta clases eva y no confunde prefijos', () => {
  const ok =
    '<section id="stack"><ul role="list" className="eva-reveal is-visible font-eva-display text-eva-gray text-eva-paper font-stretch-condensed">'
  assert.deepEqual(forbiddenIn(ok), [])
  assert.deepEqual(forbiddenIn('className="eva-neu-module bg-eva-black"'), [])
})

test('detector de requeridos: informa lo que falta', () => {
  assert.deepEqual(missingIn('<section id="stack">'), REQUIRED.filter((f) => f !== 'id="stack"'))
  assert.deepEqual(missingIn(REQUIRED.join(' ')), [])
})

test('Stack.jsx no usa clases, roles ni textos prohibidos', () => {
  assert.deepEqual(forbiddenIn(STACK_SOURCE), [])
})

test('Stack.jsx contiene la estructura y el material exigidos', () => {
  assert.deepEqual(missingIn(STACK_SOURCE), [])
})

test('Stack.jsx: el código //04 coincide con el de la barra (si existe siteNav)', async (t) => {
  assert.match(STACK_SOURCE, /\/\/04|"\/\/"\}?\s*04|04 \{"\/\/"\}/)
  const siteNav = new URL('../src/utils/siteNav.js', import.meta.url)
  if (!existsSync(siteNav)) return t.skip('src/utils/siteNav.js no existe todavía')
  const { NAV_LINKS, navCode } = await import(siteNav.href)
  const link = NAV_LINKS.find((l) => l.id === 'stack')
  assert.ok(link, 'NAV_LINKS no tiene el enlace stack')
  assert.equal(navCode(link.code), '//04')
})
