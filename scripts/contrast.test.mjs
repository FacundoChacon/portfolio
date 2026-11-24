/**
 * Tests del helper de contraste WCAG 2.x y de la paleta `eva`.
 */
import assert from 'node:assert/strict'
import test from 'node:test'

import { checkContrastPairs, contrastRatio, relativeLuminance } from './lib/contrast.mjs'
import {
  EVA_COLORS,
  EVA_CONTRAST_PAIRS,
  EVA_ROLES,
  EVA_STATUS_ROLES,
  EVA_THEME_COLORS,
} from '../src/styles/eva-tokens.js'

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

test('paleta eva: orange, paper, gray y aqua sobre black/panel alcanzan 4.5', () => {
  for (const fg of ['orange', 'paper', 'gray', 'aqua']) {
    for (const bg of ['black', 'panel']) {
      assert.ok(contrastRatio(EVA_COLORS[fg], EVA_COLORS[bg]) >= 4.5, `${fg} sobre ${bg}`)
    }
  }
})

// --- jerarquia-color-violeta: paleta violeta / naranja / verde agua y roles ---

test('paleta eva: ya no existen los nombres retirados (purple, green, red)', () => {
  for (const retirado of ['purple', 'green', 'red']) {
    assert.ok(!(retirado in EVA_COLORS), `EVA_COLORS.${retirado} debía retirarse`)
    assert.ok(!(retirado in EVA_THEME_COLORS), `EVA_THEME_COLORS.${retirado} debía retirarse`)
    assert.ok(!EVA_CONTRAST_PAIRS.some((p) => p.fg === retirado || p.bg === retirado), retirado)
  }
  for (const hex of ['#8A4FD8', '#3DFF7A', '#E8202A']) {
    assert.ok(!Object.values(EVA_COLORS).includes(hex), `${hex} no debe quedar en la paleta`)
  }
})

const NEUTROS = ['black', 'panel', 'line']
const pairsOf = (fg, bg) => EVA_CONTRAST_PAIRS.some((p) => p.fg === fg && p.bg === bg)

test('paleta violeta: hex acordados de violet, violet-light, aqua, sky y red-light', () => {
  assert.equal(EVA_COLORS.violet, '#9B5CF0')
  assert.equal(EVA_COLORS['violet-light'], '#B08AFF')
  assert.equal(EVA_COLORS.orange, '#FF7A1A')
  assert.equal(EVA_COLORS.aqua, '#74F8D4')
  assert.equal(EVA_COLORS.sky, '#7CC8FF')
  assert.equal(EVA_COLORS['red-light'], '#FF8A9A')
})

test('paleta violeta: texto normal de violet-light, orange, aqua, sky y red-light sobre black/panel/line (D5)', () => {
  for (const fg of ['violet-light', 'orange', 'aqua', 'sky', 'red-light']) {
    for (const bg of NEUTROS) {
      const pair = EVA_CONTRAST_PAIRS.find((p) => p.fg === fg && p.bg === bg)
      assert.ok(pair && pair.level === 'normal', `falta el par normal ${fg} sobre ${bg}`)
      assert.ok(contrastRatio(EVA_COLORS[fg], EVA_COLORS[bg]) >= 4.5, `${fg} sobre ${bg}`)
    }
  }
})

test('paleta violeta: negro sobre violet, violet-light, orange, aqua, sky y red-light cumple 4.5', () => {
  for (const bg of ['violet', 'violet-light', 'orange', 'aqua', 'sky', 'red-light']) {
    assert.ok(pairsOf('black', bg), `falta el par negro sobre ${bg}`)
    assert.ok(contrastRatio(EVA_COLORS.black, EVA_COLORS[bg]) >= 4.5, `negro sobre ${bg}`)
  }
})

test('paleta violeta: violet sirve como UI/grande (3:1) sobre black, panel y line, nunca como texto normal', () => {
  for (const bg of NEUTROS) {
    const pair = EVA_CONTRAST_PAIRS.find((p) => p.fg === 'violet' && p.bg === bg)
    assert.ok(pair && pair.level !== 'normal', `violet sobre ${bg} no puede declararse normal`)
    assert.ok(contrastRatio(EVA_COLORS.violet, EVA_COLORS[bg]) >= 3, `violet sobre ${bg}`)
  }
})

test('paleta violeta: el foco (aqua) llega a 3:1 contra negro, panel, línea y el relleno violet', () => {
  for (const bg of ['black', 'panel', 'line', 'violet']) {
    assert.ok(contrastRatio(EVA_COLORS[EVA_ROLES.focus], EVA_COLORS[bg]) >= 3, `foco sobre ${bg}`)
  }
})

test('triangulación: violet como texto normal sobre line falla (3.69) y #5EF2C8 no alcanza 3:1 contra violet (2.89)', () => {
  const errors = checkContrastPairs(EVA_COLORS, [{ fg: 'violet', bg: 'line', level: 'normal' }])
  assert.match(errors[0], /violet sobre line: 3\.69 < 4\.5 \(normal\)/)
  const lejano = contrastRatio('#5EF2C8', EVA_COLORS.violet)
  assert.equal(Math.floor(lejano * 100) / 100, 2.89)
  assert.ok(lejano < 3)
})

test('triangulación: el rojo viejo #E8202A como texto normal sobre panel falla (4.28) y red-light pasa', () => {
  assert.equal(Math.floor(contrastRatio('#E8202A', EVA_COLORS.panel) * 100) / 100, 4.28)
  assert.ok(contrastRatio(EVA_COLORS['red-light'], EVA_COLORS.panel) >= 4.5)
})

test('roles: EVA_ROLES y EVA_STATUS_ROLES fijan la jerarquía', () => {
  assert.deepEqual(EVA_ROLES, {
    primary: 'violet',
    'primary-light': 'violet-light',
    secondary: 'orange',
    tertiary: 'aqua',
    focus: 'aqua',
  })
  assert.deepEqual(EVA_STATUS_ROLES, { success: 'sky', error: 'red-light' })
})

test('roles: cada rol cumple los pares que exige su uso (D2)', () => {
  for (const role of ['primary-light', 'secondary', 'tertiary']) {
    for (const bg of NEUTROS) {
      assert.ok(contrastRatio(EVA_COLORS[EVA_ROLES[role]], EVA_COLORS[bg]) >= 4.5, `${role} sobre ${bg}`)
    }
  }
  for (const role of ['primary', 'primary-light', 'secondary', 'tertiary']) {
    assert.ok(contrastRatio(EVA_COLORS.black, EVA_COLORS[EVA_ROLES[role]]) >= 4.5, `negro sobre ${role}`)
  }
  for (const role of ['success', 'error']) {
    for (const bg of NEUTROS) {
      assert.ok(contrastRatio(EVA_COLORS[EVA_STATUS_ROLES[role]], EVA_COLORS[bg]) >= 4.5, `${role} sobre ${bg}`)
    }
    assert.ok(contrastRatio(EVA_COLORS.black, EVA_COLORS[EVA_STATUS_ROLES[role]]) >= 4.5, `negro sobre ${role}`)
  }
})

test('roles: EVA_THEME_COLORS resuelve cada rol a su hex y conserva los neutros', () => {
  for (const [role, color] of Object.entries({ ...EVA_ROLES, ...EVA_STATUS_ROLES })) {
    assert.equal(EVA_THEME_COLORS[role], EVA_COLORS[color], role)
  }
  for (const neutro of ['black', 'panel', 'line', 'paper', 'gray', 'gray-dim']) {
    assert.equal(EVA_THEME_COLORS[neutro], EVA_COLORS[neutro])
  }
})
