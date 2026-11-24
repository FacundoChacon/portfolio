import assert from 'node:assert/strict'
import test from 'node:test'

import {
  ESCALA,
  ROT_X_MAX,
  ROT_Y_MAX,
  TZ,
  clamp,
  estadoActivo,
  estadoEnfoque,
  estadoReposo,
  propiedadesCss,
  tiltDesdePuntero,
} from '../src/utils/foil.js'

const rect = { left: 400, top: 200, width: 360, height: 470 }
const vp = { vw: 1440, vh: 1000 }
const cerca = (a, b, eps = 1e-9) => Math.abs(a - b) < eps

test('clamp acota a ambos lados y conserva lo de adentro', () => {
  assert.equal(clamp(5, -1, 1), 1)
  assert.equal(clamp(-5, -1, 1), -1)
  assert.equal(clamp(0.25, -1, 1), 0.25)
})

test('constantes del efecto: 13°, 9°, 46 px y 1.05', () => {
  assert.deepEqual([ROT_Y_MAX, ROT_X_MAX, TZ, ESCALA], [13, 9, 46, 1.05])
})

test('tiltDesdePuntero: puntero en el centro de la card y de la ventana → sin giro horizontal', () => {
  // centro de la card = (580, 435); pantalla 1440×1000 → centro (720, 500)
  const t = tiltDesdePuntero({ px: 580, py: 435, rect, ...vp })
  assert.ok(cerca(t.ry, (13 * (580 - 580)) / 720))
  assert.ok(cerca(t.rx, 0))
  assert.ok(cerca(t.mxf, 0.5))
})

test('tiltDesdePuntero: se normaliza por el viewport, no por la card', () => {
  // 360 px a la derecha del centro de la card: sx = 360 / 720 = 0.5 → ry = 6.5°
  const t = tiltDesdePuntero({ px: 940, py: 435, rect, ...vp })
  assert.ok(cerca(t.ry, 6.5))
  // 250 px abajo del centro: sy = 250 / 500 = 0.5 → rx = −4.5°
  const u = tiltDesdePuntero({ px: 580, py: 685, rect, ...vp })
  assert.ok(cerca(u.rx, -4.5))
})

test('tiltDesdePuntero: extremos del viewport dan los giros máximos y se acotan', () => {
  const max = tiltDesdePuntero({ px: 580 + 720, py: 435 + 500, rect, ...vp })
  assert.ok(cerca(max.ry, 13) && cerca(max.rx, -9))
  const fuera = tiltDesdePuntero({ px: 5000, py: -5000, rect, ...vp })
  assert.ok(cerca(fuera.ry, 13) && cerca(fuera.rx, 9))
  const izq = tiltDesdePuntero({ px: -900, py: 435, rect, ...vp })
  assert.ok(cerca(izq.ry, -13))
})

test('tiltDesdePuntero: mxf es local a la card y se acota a [0, 1]', () => {
  assert.ok(cerca(tiltDesdePuntero({ px: 400, py: 300, rect, ...vp }).mxf, 0))
  assert.ok(cerca(tiltDesdePuntero({ px: 760, py: 300, rect, ...vp }).mxf, 1))
  assert.ok(cerca(tiltDesdePuntero({ px: 490, py: 300, rect, ...vp }).mxf, 0.25))
  assert.equal(tiltDesdePuntero({ px: 100, py: 300, rect, ...vp }).mxf, 0)
  assert.equal(tiltDesdePuntero({ px: 9999, py: 300, rect, ...vp }).mxf, 1)
})

test('tiltDesdePuntero: entradas inválidas no producen NaN', () => {
  for (const malo of [
    { px: NaN, py: 0, rect, ...vp },
    { px: 10, py: 10, rect: { left: 0, top: 0, width: 0, height: 0 }, ...vp },
    { px: 10, py: 10, rect, vw: 0, vh: 0 },
  ]) {
    const t = tiltDesdePuntero(malo)
    assert.ok(Object.values(t).every(Number.isFinite), JSON.stringify(t))
  }
})

test('estados: reposo, activo y enfoque de teclado (levantada, sin giro)', () => {
  assert.deepEqual(estadoReposo(), { rx: 0, ry: 0, tz: 0, s: 1, hover: 0, mxf: 0.5 })
  assert.deepEqual(estadoActivo({ rx: -3, ry: 8, mxf: 0.2 }), { rx: -3, ry: 8, tz: 46, s: 1.05, hover: 1, mxf: 0.2 })
  assert.deepEqual(estadoEnfoque(), { rx: 0, ry: 0, tz: 46, s: 1.05, hover: 1, mxf: 0.5 })
})

test('propiedadesCss: variables con unidades para setProperty', () => {
  assert.deepEqual(propiedadesCss({ rx: -4.5, ry: 6.5, tz: 46, s: 1.05, hover: 1, mxf: 0.25 }), {
    '--rx': '-4.5deg',
    '--ry': '6.5deg',
    '--tz': '46px',
    '--s': '1.05',
    '--hover': '1',
    '--mxf': '0.25',
  })
  assert.equal(propiedadesCss(estadoReposo())['--hover'], '0')
})
