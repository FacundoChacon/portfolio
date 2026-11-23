/**
 * Tests del helper de contraste WCAG 2.x y de la paleta `eva`.
 */
import assert from 'node:assert/strict'
import test from 'node:test'

import { checkContrastPairs, contrastRatio, relativeLuminance } from './lib/contrast.mjs'
import { EVA_COLORS, EVA_CONTRAST_PAIRS } from '../src/styles/eva-tokens.js'

test('relativeLuminance: blanco = 1 y negro = 0', () => {
  assert.equal(relativeLuminance('#FFFFFF'), 1)
  assert.equal(relativeLuminance('#000000'), 0)
})

test('relativeLuminance: acepta minúsculas y abreviado', () => {
  assert.equal(relativeLuminance('#fff'), 1)
  assert.equal(relativeLuminance('#ffffff'), 1)
})

test('contrastRatio: blanco sobre negro = 21 y mismo color = 1', () => {
  assert.equal(contrastRatio('#FFFFFF', '#000000'), 21)
  assert.equal(contrastRatio('#EDE6D6', '#EDE6D6'), 1)
})

test('contrastRatio: #EDE6D6 sobre #050505 es aprox. 16.39', () => {
  assert.equal(Math.floor(contrastRatio('#EDE6D6', '#050505') * 100) / 100, 16.39)
})

test('contrastRatio: es simétrico', () => {
  assert.equal(contrastRatio('#FF7A1A', '#100E0C'), contrastRatio('#100E0C', '#FF7A1A'))
})

test('checkContrastPairs: par normal bajo 4.5 nombra tokens, valor y umbral', () => {
  const colors = { a: '#E8202A', b: '#100E0C' }
  const errors = checkContrastPairs(colors, [{ fg: 'a', bg: 'b', level: 'normal' }])
  assert.equal(errors.length, 1)
  assert.match(errors[0], /a sobre b: 4\.28 < 4\.5 \(normal\)/)
})

test('checkContrastPairs: par large con 3.84 no da error', () => {
  const colors = { a: '#8A4FD8', b: '#100E0C' }
  assert.deepEqual(checkContrastPairs(colors, [{ fg: 'a', bg: 'b', level: 'large' }]), [])
})

test('checkContrastPairs: par ui exige 3 y falla por debajo', () => {
  const colors = { a: '#6B655B', b: '#2B2620' }
  const errors = checkContrastPairs(colors, [{ fg: 'a', bg: 'b', level: 'ui' }])
  assert.match(errors[0], /< 3 \(ui\)/)
})

test('checkContrastPairs: token inexistente da error', () => {
  const errors = checkContrastPairs({ a: '#000000' }, [{ fg: 'a', bg: 'zzz', level: 'normal' }])
  assert.equal(errors.length, 1)
  assert.match(errors[0], /zzz/)
})

test('paleta eva: todos los pares declarados cumplen su umbral', () => {
  assert.deepEqual(checkContrastPairs(EVA_COLORS, EVA_CONTRAST_PAIRS), [])
})

test('paleta eva: rojo y violeta como texto solo con nivel large o ui', () => {
  const restricted = EVA_CONTRAST_PAIRS.filter((p) => p.fg === 'red' || p.fg === 'purple')
  assert.ok(restricted.length >= 2)
  for (const pair of restricted) assert.notEqual(pair.level, 'normal', `${pair.fg} sobre ${pair.bg}`)
})

test('paleta eva: el foco (green) alcanza 3:1 sobre negro, panel y fondos actuales', () => {
  for (const bg of [EVA_COLORS.black, EVA_COLORS.panel, '#030303', '#111116']) {
    assert.ok(contrastRatio(EVA_COLORS.green, bg) >= 3, `green sobre ${bg}`)
  }
})

test('paleta eva: orange y paper sobre black/panel alcanzan 4.5', () => {
  for (const fg of ['orange', 'paper', 'gray', 'green']) {
    for (const bg of ['black', 'panel']) {
      assert.ok(contrastRatio(EVA_COLORS[fg], EVA_COLORS[bg]) >= 4.5, `${fg} sobre ${bg}`)
    }
  }
})
