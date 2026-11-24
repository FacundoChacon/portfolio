import assert from 'node:assert/strict'
import test from 'node:test'

import {
  N_BURBUJAS,
  WOBBLE,
  crearBurbujas,
  crearRng,
  pasoBurbujas,
  xBurbuja,
} from '../src/utils/lclBurbujas.js'

const instantanea = (b) => ({
  x: Array.from(b.x),
  y: Array.from(b.y),
  r: Array.from(b.r),
  vel: Array.from(b.vel),
  fase: Array.from(b.fase),
})

test('crearRng: determinista por semilla, distinto entre semillas y en [0, 1)', () => {
  const a = crearRng(42)
  const b = crearRng(42)
  const c = crearRng(43)
  const sa = Array.from({ length: 20 }, () => a())
  assert.deepEqual(sa, Array.from({ length: 20 }, () => b()))
  assert.notDeepEqual(sa, Array.from({ length: 20 }, () => c()))
  assert.ok(sa.every((v) => v >= 0 && v < 1))
  assert.ok(new Set(sa).size > 15, 'no es constante')
})

test('N_BURBUJAS: pocas (8 a 14)', () => {
  assert.ok(N_BURBUJAS >= 8 && N_BURBUJAS <= 14)
})

test('crearBurbujas: pool fijo, posiciones iniciales repartidas y válidas', () => {
  const b = crearBurbujas(N_BURBUJAS, crearRng(7))
  assert.equal(b.x.length, N_BURBUJAS)
  assert.ok(Array.from(b.y).every((y) => y >= 0 && y < 1))
  assert.ok(Array.from(b.x).every((x) => x >= 0 && x <= 1))
  assert.ok(new Set(Array.from(b.y)).size > N_BURBUJAS / 2, 'alturas repartidas')
})

test('determinismo: misma semilla y misma secuencia de dt → mismo estado', () => {
  const correr = (semilla) => {
    const b = crearBurbujas(N_BURBUJAS, crearRng(semilla))
    for (let i = 0; i < 600; i++) pasoBurbujas(b, 1 / 30)
    return instantanea(b)
  }
  assert.deepEqual(correr(1), correr(1))
  assert.notDeepEqual(correr(1), correr(2))
})

test('el pool nunca crece y una burbuja que llega a la superficie se recicla abajo', () => {
  const b = crearBurbujas(N_BURBUJAS, crearRng(3))
  let recicladas = 0
  for (let i = 0; i < 3000; i++) {
    const antes = Array.from(b.y)
    pasoBurbujas(b, 1 / 30)
    assert.equal(b.y.length, N_BURBUJAS)
    for (let k = 0; k < N_BURBUJAS; k++) {
      assert.ok(b.y[k] >= 0 && b.y[k] < 1, `y fuera de rango: ${b.y[k]}`)
      if (b.y[k] < antes[k]) {
        recicladas++
        assert.ok(b.y[k] < 0.05, 'renace abajo')
      }
    }
  }
  assert.ok(recicladas > N_BURBUJAS, `solo ${recicladas} reciclajes`)
})

test('sube de a poco: sin saltos aun con dt grande (acotado)', () => {
  const b = crearBurbujas(N_BURBUJAS, crearRng(9))
  b.y.fill(0.1)
  pasoBurbujas(b, 60)
  assert.ok(Array.from(b.y).every((y) => y < 0.5), 'dt acotado: no atraviesa el tanque de golpe')
})

test('xBurbuja: siempre dentro del tanque, con vaivén lateral pequeño', () => {
  const b = crearBurbujas(N_BURBUJAS, crearRng(5))
  const rangos = new Map()
  for (let i = 0; i < 2000; i++) {
    pasoBurbujas(b, 1 / 30)
    for (let k = 0; k < N_BURBUJAS; k++) {
      const x = xBurbuja(b, k)
      assert.ok(x >= 0 && x <= 1, `x = ${x}`)
      assert.ok(Math.abs(x - b.x[k]) <= WOBBLE + 1e-12)
    }
  }
  b.x[0] = 0
  b.fase[0] = (3 * Math.PI) / 2 // seno = −1: empuja hacia afuera
  assert.equal(xBurbuja(b, 0), 0)
  b.x[0] = 1
  b.fase[0] = Math.PI / 2
  assert.equal(xBurbuja(b, 0), 1)
  assert.ok(rangos)
})

test('pasoBurbujas: dt inválido o negativo no mueve nada ni produce NaN', () => {
  const b = crearBurbujas(N_BURBUJAS, crearRng(5))
  const antes = instantanea(b)
  pasoBurbujas(b, NaN)
  pasoBurbujas(b, -1)
  assert.deepEqual(instantanea(b), antes)
})
