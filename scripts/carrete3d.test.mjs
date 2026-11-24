/**
 * Matemática pura del carrete 3D (sin three ni DOM).
 * Los valores de referencia salen de design.md (D4) y de la especificación de animación.
 */
import assert from 'node:assert/strict'
import test from 'node:test'

import { PROYECTOS, STATUS_LABELS } from '../src/data/proyectos.js'
import {
  BEND_BASE,
  BEND_MAX,
  CAMERA,
  CARD_FRACTION,
  DAMPING_RATE,
  DEPTH_K,
  DT_MAX,
  LEAN_MAX,
  MAX_PHASE_SPEED,
  PITCH_FACTOR,
  PLANE,
  RADIUS_K,
  RIPPLE_AMP,
  ROT_X_STEP,
  THETA_STEP,
  Z_OFFSET,
  bendForVelocity,
  bendVertex,
  canvasLabel,
  cardTransform,
  cardWidthFraction,
  clampDt,
  coverUv,
  dampFactor,
  dampPhase,
  deformPlane,
  dragToPhase,
  isFacingCamera,
  keyToStop,
  leanForVelocity,
  nearestStop,
  projectedWidthFraction,
  reelFrame,
  roundedRectSdf,
  trackDims,
  wrapRelative,
} from '../src/utils/carrete3d.js'

const near = (a, b, eps = 1e-4) => Math.abs(a - b) < eps

test('constantes de la especificación', () => {
  assert.deepEqual(CAMERA, { fov: 65.7, z: 8.1, near: 0.1, far: 40 })
  assert.equal(PLANE.width, 2.38)
  assert.equal(PLANE.height, 1.5771)
  assert.equal(PLANE.segmentsX, 48)
  assert.equal(PLANE.segmentsY, 24)
  assert.equal(BEND_BASE, 0.3)
  assert.equal(BEND_MAX, 0.42)
  assert.equal(RIPPLE_AMP, 0.006)
  assert.equal(THETA_STEP, 0.73)
  assert.equal(PITCH_FACTOR, 0.52)
  assert.equal(Z_OFFSET, -0.28)
  assert.equal(ROT_X_STEP, -0.01)
  assert.equal(DAMPING_RATE, 13)
  assert.equal(DT_MAX, 0.05)
  assert.equal(MAX_PHASE_SPEED, 8)
  assert.deepEqual(CARD_FRACTION, { desktop: 0.37, phone: 0.77 })
})

// ───────── amortiguación ─────────

test('clampDt: acota a [0, 0.05] y no finito → 0', () => {
  assert.equal(clampDt(0.016), 0.016)
  assert.equal(clampDt(0.2), 0.05)
  assert.equal(clampDt(-1), 0)
  assert.equal(clampDt(NaN), 0)
  assert.equal(clampDt(Infinity), 0)
})

test('dampFactor: 1 − e^(−13·dt) con dt acotado', () => {
  assert.equal(dampFactor(0), 0)
  assert.ok(near(dampFactor(1 / 60), 0.1948, 1e-5))
  assert.ok(near(dampFactor(0.05), 0.47795, 1e-5))
  assert.equal(dampFactor(0.2), dampFactor(0.05))
  assert.equal(dampFactor(-1), 0)
})

test('dampPhase: converge hacia el objetivo sin pasarse', () => {
  let phase = 0
  for (let i = 0; i < 240; i++) {
    const next = dampPhase(phase, 2, 1 / 60)
    assert.ok(next >= phase && next <= 2)
    phase = next
  }
  assert.equal(phase, 2)
  assert.ok(near(dampPhase(0, 0.5, 1 / 60), 0.0974, 1e-4))
  assert.ok(near(dampPhase(3, 2.5, 1 / 60), 3 - 0.0974, 1e-4))
})

test('dampPhase: tope de velocidad (un salto de 4 proyectos no gira de golpe)', () => {
  assert.ok(near(dampPhase(0, 4, 0.05), MAX_PHASE_SPEED * 0.05, 1e-9))
  assert.ok(near(dampPhase(4, 0, 0.05), 4 - 0.4, 1e-9))
})

test('dampPhase: snap a menos de 1e-4 y dt = 0 no mueve', () => {
  assert.equal(dampPhase(1.99995, 2, 1 / 60), 2)
  assert.equal(dampPhase(1, 3, 0), 1)
})

test('dampPhase: movimiento reducido corta al entero más cercano', () => {
  assert.equal(dampPhase(0, 1.4, 1 / 60, { reduced: true }), 1)
  assert.equal(dampPhase(0, 1.6, 1 / 60, { reduced: true }), 2)
  assert.equal(dampPhase(3, 0, 1 / 60, { reduced: true }), 0)
})

// ───────── índice envuelto ─────────

test('wrapRelative N=5: fase 0 → 0, 1, 2, −2, −1', () => {
  const rel = [0, 1, 2, 3, 4].map((i) => wrapRelative(i, 0, 5))
  assert.deepEqual(rel, [0, 1, 2, -2, -1])
})

test('wrapRelative: fase 4 (índice 0 → 1), fase 2.5 (índice 0 → −2.5), fraccionales', () => {
  assert.equal(wrapRelative(0, 4, 5), 1)
  assert.equal(wrapRelative(0, 2.5, 5), -2.5)
  assert.ok(near(wrapRelative(1, 0.3, 5), 0.7))
  assert.ok(near(wrapRelative(4, 0.3, 5), -1.3))
  assert.ok(near(wrapRelative(0, 4.2, 5), 0.8))
})

test('wrapRelative: rango semiabierto [−N/2, N/2)', () => {
  for (let i = 0; i < 5; i++) {
    for (let p = -1; p <= 6; p += 0.25) {
      const r = wrapRelative(i, p, 5)
      assert.ok(r >= -2.5 && r < 2.5, `i=${i} p=${p} r=${r}`)
    }
  }
})

test('nearestStop: redondea y acota a [0, N−1]', () => {
  assert.equal(nearestStop(1.4, 5), 1)
  assert.equal(nearestStop(1.6, 5), 2)
  assert.equal(nearestStop(-3, 5), 0)
  assert.equal(nearestStop(9, 5), 4)
  assert.equal(nearestStop(3.5, 5), 4)
})

// ───────── curvado ─────────

test('bendVertex: valores de referencia', () => {
  const a = bendVertex(1.19, 0, 0.3)
  assert.ok(near(a.x, 1.17223, 1e-4) && near(a.z, -0.17717, 1e-4))
  const b = bendVertex(-0.595, 0, 0.3)
  assert.ok(near(b.x, -0.59277, 1e-4) && near(b.z, -0.04454, 1e-4))
  const c = bendVertex(1.19, 0, 0.42)
  assert.ok(near(c.x, 1.15532, 1e-4) && near(c.z, -0.24625, 1e-4))
})

test('bendVertex: centro sin cambio, z acumulada y bend 0 → identidad sin NaN', () => {
  assert.deepEqual(bendVertex(0, 0.5, 0.3), { x: 0, z: 0.5 })
  const d = bendVertex(1.19, 0.5, 0.3)
  assert.ok(near(d.z, 0.5 - 0.17717, 1e-4))
  assert.deepEqual(bendVertex(0.7, 0.2, 0), { x: 0.7, z: 0.2 })
  const e = bendVertex(0.7, 0.2, 1e-12)
  assert.ok(Number.isFinite(e.x) && Number.isFinite(e.z))
})

test('bendVertex: simétrico en x', () => {
  const p = bendVertex(0.8, 0, 0.3)
  const m = bendVertex(-0.8, 0, 0.3)
  assert.ok(near(p.x, -m.x, 1e-12) && near(p.z, m.z, 1e-12))
})

function flatGrid() {
  const { width, height, segmentsX, segmentsY } = PLANE
  const out = []
  for (let j = 0; j <= segmentsY; j++) {
    for (let i = 0; i <= segmentsX; i++) {
      out.push((i / segmentsX - 0.5) * width, (0.5 - j / segmentsY) * height, 0)
    }
  }
  return new Float32Array(out)
}

test('deformPlane: no muta la entrada y con rippleAmp = 0 coincide con bendVertex', () => {
  const flat = flatGrid()
  const copia = flat.slice()
  const out = new Float32Array(flat.length)
  deformPlane(flat, out, { bend: 0.3, time: 3, rippleAmp: 0, height: PLANE.height })
  assert.deepEqual(flat, copia)
  for (let i = 0; i < flat.length; i += 3) {
    const ref = bendVertex(flat[i], flat[i + 2], 0.3)
    assert.ok(near(out[i], ref.x, 1e-5), `x en ${i}`)
    assert.equal(out[i + 1], flat[i + 1])
    assert.ok(near(out[i + 2], ref.z, 1e-5), `z en ${i}`)
  }
})

test('deformPlane: la ondulación desvía z como mucho 0.006', () => {
  const flat = flatGrid()
  const base = new Float32Array(flat.length)
  const rip = new Float32Array(flat.length)
  deformPlane(flat, base, { bend: 0.3, time: 0, rippleAmp: 0, height: PLANE.height })
  deformPlane(flat, rip, { bend: 0.3, time: 5, rippleAmp: RIPPLE_AMP, height: PLANE.height })
  let max = 0
  for (let i = 2; i < flat.length; i += 3) max = Math.max(max, Math.abs(rip[i] - base[i]))
  assert.ok(max > 0.004 && max <= RIPPLE_AMP + 1e-6, `max=${max}`)
})

test('deformPlane: el tiempo cambia la fase de la ondulación', () => {
  const flat = flatGrid()
  const a = new Float32Array(flat.length)
  const b = new Float32Array(flat.length)
  deformPlane(flat, a, { bend: 0.3, time: 0, rippleAmp: RIPPLE_AMP, height: PLANE.height })
  deformPlane(flat, b, { bend: 0.3, time: 2, rippleAmp: RIPPLE_AMP, height: PLANE.height })
  assert.notDeepEqual(a, b)
})

// ───────── reacción a la velocidad ─────────

test('bendForVelocity: base, intermedio, tope y simetría', () => {
  assert.ok(near(bendForVelocity(0, false), 0.3, 1e-12))
  assert.ok(near(bendForVelocity(2, false), 0.36))
  assert.ok(near(bendForVelocity(4, false), 0.42))
  assert.ok(near(bendForVelocity(9, false), 0.42))
  assert.ok(near(bendForVelocity(-2, false), 0.36))
  assert.ok(near(bendForVelocity(-9, false), 0.42))
  assert.equal(bendForVelocity(9, true), 0.3)
})

test('leanForVelocity: signo, tope y reducido', () => {
  assert.equal(leanForVelocity(0, false), 0)
  assert.ok(near(leanForVelocity(2, false), 0.03))
  assert.ok(near(leanForVelocity(-2, false), -0.03))
  assert.equal(leanForVelocity(50, false), LEAN_MAX)
  assert.equal(leanForVelocity(-50, false), -LEAN_MAX)
  assert.equal(leanForVelocity(5, true), 0)
})

// ───────── dimensiones del carrete ─────────

test('cardWidthFraction: teléfono, escritorio e interpolación', () => {
  assert.equal(cardWidthFraction(375), 0.77)
  assert.equal(cardWidthFraction(480), 0.77)
  assert.equal(cardWidthFraction(1024), 0.37)
  assert.equal(cardWidthFraction(1440), 0.37)
  assert.ok(near(cardWidthFraction(752), 0.57, 1e-9))
})

test('trackDims y projectedWidthFraction: ≈ 37% en escritorio', () => {
  for (const vp of [
    { width: 1440, height: 830 },
    { width: 1280, height: 650 },
    { width: 1920, height: 1000 },
  ]) {
    const dims = trackDims(vp)
    assert.ok(dims.scale > 0)
    assert.ok(near(projectedWidthFraction(dims, vp), 0.37, 0.01), `${vp.width}: ${projectedWidthFraction(dims, vp)}`)
  }
})

test('trackDims y projectedWidthFraction: ≈ 77% en teléfono', () => {
  const vp = { width: 375, height: 742 }
  const dims = trackDims(vp)
  assert.ok(near(projectedWidthFraction(dims, vp), 0.77, 0.01), String(projectedWidthFraction(dims, vp)))
})

test('trackDims: radio y profundidad proporcionales a la escala; dimensiones inválidas → null', () => {
  const dims = trackDims({ width: 1440, height: 830 })
  assert.ok(near(dims.radius, RADIUS_K * dims.scale, 1e-9))
  assert.ok(near(dims.depth, DEPTH_K * dims.scale, 1e-9))
  assert.ok(near(dims.pitch, PITCH_FACTOR * dims.scale, 1e-9))
  assert.equal(trackDims({ width: 0, height: 800 }), null)
  assert.equal(trackDims({ width: 800, height: 0 }), null)
  assert.equal(trackDims({ width: -5, height: 800 }), null)
  assert.equal(trackDims({ width: NaN, height: 800 }), null)
})

// ───────── transformaciones por card ─────────

const DIMS = { scale: 1, radius: 3.6, depth: 1.6, pitch: 0.52 }

test('cardTransform: relative 0 → centro al frente', () => {
  const t = cardTransform(0, DIMS)
  assert.equal(t.x, 0)
  assert.equal(t.y, 0)
  assert.ok(near(t.z, 1.6 - 0.28, 1e-12))
  assert.equal(t.rotY, 0)
  assert.equal(t.rotX, 0)
  assert.equal(t.scale, 1)
})

test('cardTransform: ±1 → valores de referencia y simetría', () => {
  const r = cardTransform(1, DIMS)
  const l = cardTransform(-1, DIMS)
  assert.ok(near(r.x, 0.66687 * 3.6, 1e-3))
  assert.ok(near(r.y, 0.52, 1e-12))
  assert.ok(near(r.z, 0.74517 * 1.6 - 0.28, 1e-3))
  assert.ok(near(r.rotY, 0.3786, 1e-3))
  assert.ok(near(r.rotX, -0.01, 1e-12))
  assert.ok(near(l.x, -r.x, 1e-12) && near(l.y, -r.y, 1e-12) && near(l.z, r.z, 1e-12))
  assert.ok(near(l.rotY, -r.rotY, 1e-12) && near(l.rotX, 0.01, 1e-12))
})

test('cardTransform: ±2 y lean sumado a rotX', () => {
  const t = cardTransform(2, DIMS)
  assert.ok(near(t.x, Math.sin(1.46) * 3.6, 1e-9))
  assert.ok(near(t.y, 1.04, 1e-12))
  assert.ok(near(t.rotX, -0.02, 1e-12))
  assert.ok(near(cardTransform(1, DIMS, 0.03).rotX, 0.02, 1e-12))
  assert.ok(near(cardTransform(0, DIMS, -0.04).rotX, -0.04, 1e-12))
})

test('isFacingCamera: de frente sí, |relative| = 2.5 no', () => {
  for (const rel of [0, 1, -1, 2, -2]) assert.ok(isFacingCamera(cardTransform(rel, DIMS).rotY), `rel=${rel}`)
  for (const rel of [2.5, -2.5]) assert.ok(!isFacingCamera(cardTransform(rel, DIMS).rotY), `rel=${rel}`)
  assert.ok(cardTransform(2.5, DIMS).rotY > Math.PI / 2)
  assert.ok(!isFacingCamera(Math.PI))
})

// ───────── texturas y esquinas ─────────

const PLANE_ASPECT = PLANE.width / PLANE.height

test('coverUv: imágenes más anchas recortan los costados', () => {
  const a = coverUv(1000 / 474, PLANE_ASPECT)
  assert.ok(near(a.scale[0], 0.7153, 1e-3) && a.scale[1] === 1)
  assert.ok(near(a.offset[0], 0.1423, 1e-3) && a.offset[1] === 0)
  const b = coverUv(1000 / 468, PLANE_ASPECT)
  assert.ok(near(b.scale[0], 0.7063, 1e-3))
})

test('coverUv: imágenes más altas recortan arriba y abajo', () => {
  const c = coverUv(1000 / 703, PLANE_ASPECT)
  assert.equal(c.scale[0], 1)
  assert.ok(near(c.scale[1], 0.9426, 1e-3))
  assert.ok(near(c.offset[1], 0.0287, 1e-3))
})

test('coverUv: mismo aspecto → identidad; foco en los bordes', () => {
  assert.deepEqual(coverUv(PLANE_ASPECT, PLANE_ASPECT), { scale: [1, 1], offset: [0, 0] })
  const izq = coverUv(2, 1, 0)
  const der = coverUv(2, 1, 1)
  assert.equal(izq.offset[0], 0)
  assert.ok(near(der.offset[0], 0.5, 1e-12))
  assert.ok(near(der.offset[0] + der.scale[0], 1, 1e-12))
})

test('coverUv: el recorte nunca sale de [0, 1]', () => {
  for (const p of PROYECTOS) {
    for (const f of [0, 0.5, 1]) {
      const { scale, offset } = coverUv(p.imageWidth / p.imageHeight, PLANE_ASPECT, f, f)
      for (let k = 0; k < 2; k++) assert.ok(offset[k] >= -1e-12 && offset[k] + scale[k] <= 1 + 1e-12)
    }
  }
})

test('roundedRectSdf: dentro, borde, esquina y fuera', () => {
  const hx = 1
  const hy = 0.6
  const r = 0.2
  assert.ok(roundedRectSdf(0, 0, hx, hy, r) < 0)
  assert.ok(near(roundedRectSdf(0, 0, hx, hy, r), -hy, 1e-12))
  assert.ok(near(roundedRectSdf(hx, 0, hx, hy, r), 0, 1e-12))
  assert.ok(near(roundedRectSdf(0, hy, hx, hy, r), 0, 1e-12))
  assert.ok(roundedRectSdf(hx, hy, hx, hy, r) > 0)
  assert.ok(near(roundedRectSdf(hx, hy, hx, hy, r), r * Math.SQRT2 - r, 1e-12))
  assert.ok(roundedRectSdf(1.5, 0, hx, hy, r) > 0)
  assert.ok(near(roundedRectSdf(1.5, 0, hx, hy, r), 0.5, 1e-12))
  assert.ok(near(roundedRectSdf(-hx, 0, hx, hy, r), 0, 1e-12))
})

test('roundedRectSdf: r = 0 es un rectángulo común', () => {
  assert.ok(near(roundedRectSdf(1, 0.6, 1, 0.6, 0), 0, 1e-12))
  assert.ok(roundedRectSdf(1.1, 0.7, 1, 0.6, 0) > 0)
})

// ───────── cuadro completo ─────────

const COUNT = 5
const VP = { width: 1440, height: 830 }

test('reelFrame fase 0: 5 cards, las de relative 0 y ±1 visibles y la central al frente', () => {
  const dims = trackDims(VP)
  const f = reelFrame({ phase: 0, prevPhase: 0, dt: 1 / 60, count: COUNT, dims, time: 0, reduced: false })
  assert.equal(f.cards.length, 5)
  assert.deepEqual(f.cards.map((c) => c.relative), [0, 1, 2, -2, -1])
  for (const i of [0, 1, 4]) assert.ok(f.cards[i].visible, `card ${i}`)
  const frente = f.cards[0]
  for (const c of f.cards) assert.ok(frente.z >= c.z)
  assert.ok(f.cards[1].y > frente.y && f.cards[1].x > 0)
  assert.equal(f.velocity, 0)
  assert.equal(f.bend, BEND_BASE)
  assert.equal(f.rippleAmp, RIPPLE_AMP)
})

test('reelFrame: velocidad, flexión y lean con movimiento; dt = 0 → velocidad 0', () => {
  const dims = trackDims(VP)
  const f = reelFrame({ phase: 0.2, prevPhase: 0, dt: 0.05, count: COUNT, dims, time: 1, reduced: false })
  assert.ok(near(f.velocity, 4, 1e-9))
  assert.ok(near(f.bend, 0.42))
  assert.ok(f.cards[0].rotX > 0)
  const q = reelFrame({ phase: 0.2, prevPhase: 0, dt: 0, count: COUNT, dims, time: 1, reduced: false })
  assert.equal(q.velocity, 0)
})

test('reelFrame reducido: sin ondulación, flexión base y lean 0', () => {
  const dims = trackDims(VP)
  const f = reelFrame({ phase: 1, prevPhase: 0, dt: 0.05, count: COUNT, dims, time: 1, reduced: true })
  assert.equal(f.rippleAmp, 0)
  assert.equal(f.bend, 0.3)
  assert.equal(f.cards[0].rotX, ROT_X_STEP * f.cards[0].relative)
})

test('reelFrame: las cards que miran hacia atrás no son visibles (fase 2.5)', () => {
  const dims = trackDims(VP)
  const f = reelFrame({ phase: 2.5, prevPhase: 2.5, dt: 1 / 60, count: COUNT, dims, time: 0, reduced: false })
  const atras = f.cards.filter((c) => Math.abs(c.relative) === 2.5)
  assert.equal(atras.length, 1)
  assert.ok(!atras[0].visible)
})

// ───────── entradas ─────────

test('dragToPhase: izquierda avanza, derecha retrocede, un ancho de card = un proyecto', () => {
  const base = { startPhase: 2, dy: 0, pointerType: 'mouse', cardPx: 500, count: 5 }
  assert.ok(near(dragToPhase({ ...base, dx: -500 }), 3, 1e-12))
  assert.ok(near(dragToPhase({ ...base, dx: 250 }), 1.5, 1e-12))
  assert.ok(near(dragToPhase({ ...base, dx: -125 }), 2.25, 1e-12))
})

test('dragToPhase: abajo avanza con mouse (eje dominante) y se ignora con toque', () => {
  const base = { startPhase: 1, cardPx: 400, count: 5 }
  assert.ok(near(dragToPhase({ ...base, dx: 10, dy: 200, pointerType: 'mouse' }), 1.5, 1e-12))
  assert.ok(near(dragToPhase({ ...base, dx: 10, dy: -200, pointerType: 'pen' }), 0.5, 1e-12))
  assert.ok(near(dragToPhase({ ...base, dx: 300, dy: 20, pointerType: 'mouse' }), 1 - 0.75, 1e-12))
  assert.ok(near(dragToPhase({ ...base, dx: 0, dy: 400, pointerType: 'touch' }), 1, 1e-12))
  assert.ok(near(dragToPhase({ ...base, dx: -400, dy: 900, pointerType: 'touch' }), 2, 1e-12))
})

test('dragToPhase: clamp en 0 y N−1 y cardPx inválido', () => {
  assert.equal(dragToPhase({ startPhase: 0.2, dx: 5000, dy: 0, pointerType: 'mouse', cardPx: 500, count: 5 }), 0)
  assert.equal(dragToPhase({ startPhase: 3.5, dx: -5000, dy: 0, pointerType: 'mouse', cardPx: 500, count: 5 }), 4)
  assert.equal(dragToPhase({ startPhase: 2, dx: -100, dy: 0, pointerType: 'mouse', cardPx: 0, count: 5 }), 2)
})

test('keyToStop: flechas, Inicio y Fin', () => {
  assert.equal(keyToStop('ArrowRight', 1, 5), 2)
  assert.equal(keyToStop('ArrowDown', 1, 5), 2)
  assert.equal(keyToStop('ArrowLeft', 3, 5), 2)
  assert.equal(keyToStop('ArrowUp', 3, 5), 2)
  assert.equal(keyToStop('Home', 3, 5), 0)
  assert.equal(keyToStop('End', 1, 5), 4)
})

test('keyToStop: null en los extremos y con teclas ajenas', () => {
  assert.equal(keyToStop('ArrowUp', 0, 5), null)
  assert.equal(keyToStop('ArrowLeft', 0, 5), null)
  assert.equal(keyToStop('ArrowDown', 4, 5), null)
  assert.equal(keyToStop('ArrowRight', 4, 5), null)
  assert.equal(keyToStop('Tab', 2, 5), null)
  assert.equal(keyToStop('a', 2, 5), null)
  assert.equal(keyToStop('Home', 0, 5), null)
  assert.equal(keyToStop('End', 4, 5), null)
})

// ───────── texto accesible ─────────

test('STATUS_LABELS: los tres estados', () => {
  assert.deepEqual(STATUS_LABELS, { demo: 'Demo', live: 'En el mercado', inprogress: 'En curso' })
})

test('canvasLabel: título, estado, descripción y posición', () => {
  const primero = canvasLabel(PROYECTOS[0], 0, 5)
  assert.ok(primero.includes('Tienda-Electronica'))
  assert.ok(primero.includes('Demo'))
  assert.ok(primero.includes(PROYECTOS[0].description))
  assert.ok(primero.includes('proyecto 1 de 5'))
  const segundo = canvasLabel(PROYECTOS[1], 1, 5)
  assert.ok(segundo.includes('CIMMA-Dentistry') && segundo.includes('En el mercado') && segundo.includes('proyecto 2 de 5'))
  const ultimo = canvasLabel(PROYECTOS[4], 4, 5)
  assert.ok(ultimo.includes('3-Esquinas') && ultimo.includes('En curso') && ultimo.includes('proyecto 5 de 5'))
  assert.ok(primero.startsWith('Carrete de proyectos. Al frente: '))
})
