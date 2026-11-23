import assert from 'node:assert/strict'
import test from 'node:test'

import {
  PLATEAU_VH,
  TRANSITION_VH,
  pagePosition,
  pinHeightVh,
  pinRangeVh,
  progressForPage,
  progressForPosition,
  projectLabel,
  projectsMode,
  scrollProgress,
  scrollTopForPage,
  scrollTopForPosition,
  SETTLE_DIRECTION_THRESHOLD,
  SETTLE_IDLE_MS,
  settleTarget,
  settleTargetDirectional,
  smoothstep,
  smoothstepInverse,
} from '../src/utils/proyectosScroll.js'

const near = (a, b, eps = 1e-9) => Math.abs(a - b) < eps

test('pinRangeVh y pinHeightVh: tramo fijado de 355 vh para 5 proyectos (300–400)', () => {
  assert.equal(PLATEAU_VH, 15)
  assert.equal(TRANSITION_VH, 45)
  assert.equal(pinRangeVh(5), 255)
  assert.equal(pinHeightVh(5), 355)
  assert.ok(pinHeightVh(5) >= 300 && pinHeightVh(5) <= 400)
  assert.equal(pinHeightVh(0), 0)
  assert.equal(pinHeightVh(1), 0)
  assert.equal(pinHeightVh(2), 175)
})

test('scrollProgress: acotado y con range inválido', () => {
  assert.equal(scrollProgress({ scrollY: 100, top: 500, range: 1000 }), 0)
  assert.equal(scrollProgress({ scrollY: 2000, top: 500, range: 1000 }), 1)
  assert.equal(scrollProgress({ scrollY: 1000, top: 500, range: 1000 }), 0.5)
  assert.equal(scrollProgress({ scrollY: 1000, top: 500, range: 0 }), 0)
  assert.equal(scrollProgress({ scrollY: 1000, top: 500, range: -5 }), 0)
})

test('progressForPage con 5 paradas: centro de la meseta', () => {
  assert.ok(near(progressForPage(0, 5), 0.02941, 1e-5))
  assert.ok(near(progressForPage(2, 5), 0.5))
  assert.ok(near(progressForPage(4, 5), 0.97059, 1e-5))
  assert.ok(near(progressForPage(9, 5), progressForPage(4, 5)))
  assert.ok(near(progressForPage(-3, 5), progressForPage(0, 5)))
  assert.equal(progressForPage(3, 1), 0)
})

test('pagePosition con 5 paradas: mesetas enteras, extremos y clamp', () => {
  for (let k = 0; k < 5; k++) {
    assert.ok(near(pagePosition(progressForPage(k, 5), 5), k), `k=${k}`)
  }
  assert.equal(pagePosition(0, 5), 0)
  assert.equal(pagePosition(1, 5), 4)
  assert.equal(pagePosition(-1, 5), 0)
  assert.equal(pagePosition(2, 5), 4)
  assert.equal(pagePosition(0.7, 1), 0)
  assert.equal(pagePosition(0.7, 0), 0)
})

test('pagePosition con 5 paradas: monótona y dentro de [0, 4]', () => {
  let previo = -1
  for (let i = 0; i <= 1000; i++) {
    const pos = pagePosition(i / 1000, 5)
    assert.ok(pos >= previo, `retrocede en ${i / 1000}`)
    assert.ok(pos >= 0 && pos <= 4)
    previo = pos
  }
})

test('pagePosition: la meseta mide 15 vh y la transición suaviza (menor que lo lineal)', () => {
  // 20 vh de 255: dentro de la transición 0→1 (15..60 vh), t = 5/45
  const pos = pagePosition(20 / 255, 5)
  assert.ok(pos > 0 && pos < 5 / 45)
  assert.equal(pagePosition(15 / 255, 5), 0)
})

test('scrollTopForPage: redondea el centro de la meseta', () => {
  assert.equal(scrollTopForPage({ page: 2, pages: 5, top: 2000, range: 2295 }), 3148)
  assert.equal(scrollTopForPage({ page: 0, pages: 5, top: 2000, range: 2295 }), 2068)
})

test('settleTarget con 5 paradas: null en meseta y bordes, destino en transición', () => {
  for (let k = 0; k < 5; k++) assert.equal(settleTarget(progressForPage(k, 5), 5), null, `meseta ${k}`)
  assert.equal(settleTarget(0, 5), null)
  assert.equal(settleTarget(1, 5), null)
  // 0→1 transición: 15..60 vh → mitad = 37.5 vh
  assert.equal(settleTarget(30 / 255, 5), 0)
  assert.equal(settleTarget(45 / 255, 5), 1)
  // 3→4 transición: 195..240 vh
  assert.equal(settleTarget(200 / 255, 5), 3)
  assert.equal(settleTarget(230 / 255, 5), 4)
  assert.equal(settleTarget(0.3, 1), null)
  assert.equal(settleTarget(0.3, 0), null)
  assert.equal(settleTarget(-1, 5), null)
  assert.equal(settleTarget(2, 5), null)
})

test('settleTarget: asentar no vuelve a asentar (sin bucle)', () => {
  for (let i = 0; i <= 200; i++) {
    const target = settleTarget(i / 200, 5)
    if (target !== null) assert.equal(settleTarget(progressForPage(target, 5), 5), null)
  }
})

test('smoothstepInverse: extremos, medio y clamp', () => {
  assert.equal(smoothstepInverse(0), 0)
  assert.ok(near(smoothstepInverse(0.5), 0.5))
  assert.ok(near(smoothstepInverse(1), 1))
  assert.equal(smoothstepInverse(-0.5), 0)
  assert.equal(smoothstepInverse(1.5), 1)
  assert.equal(smoothstepInverse(NaN), 0)
})

test('smoothstepInverse(smoothstep(t)) ≈ t', () => {
  for (const t of [0.1, 0.25, 0.5, 0.75, 0.9]) {
    assert.ok(near(smoothstepInverse(smoothstep(t)), t, 1e-9), `t=${t}`)
  }
})

test('progressForPosition: entero = centro de meseta, extremos con clamp', () => {
  for (let k = 0; k < 5; k++) assert.ok(near(progressForPosition(k, 5), progressForPage(k, 5)), `k=${k}`)
  assert.ok(near(progressForPosition(-2, 5), progressForPage(0, 5)))
  assert.ok(near(progressForPosition(9, 5), progressForPage(4, 5)))
  assert.equal(progressForPosition(2, 1), 0)
})

test('progressForPosition: ida y vuelta con pagePosition', () => {
  for (const p of [0.3, 1.5, 3.9, 0.01, 2.75]) {
    assert.ok(near(pagePosition(progressForPosition(p, 5), 5), p, 1e-9), `p=${p}`)
  }
})

test('scrollTopForPosition: posición fraccional a scroll', () => {
  assert.equal(scrollTopForPosition({ position: 2, pages: 5, top: 2000, range: 2295 }), 3148)
  const y = scrollTopForPosition({ position: 1.5, pages: 5, top: 2000, range: 2295 })
  // 1.5 → mitad de la transición 1→2: (60 + 15 + 22.5)/255 vh
  assert.equal(y, Math.round(2000 + (97.5 / 255) * 2295))
  assert.equal(scrollTopForPosition({ position: 99, pages: 5, top: 2000, range: 2295 }), scrollTopForPage({ page: 4, pages: 5, top: 2000, range: 2295 }))
})

test('projectsMode: cada condición sola manda al carrusel; todo bien → reel', () => {
  const base = { webgl2: true, short: false, supportsClip: true, failed: false }
  assert.equal(projectsMode(base), 'reel')
  assert.equal(projectsMode({ ...base, webgl2: false }), 'carousel')
  assert.equal(projectsMode({ ...base, short: true }), 'carousel')
  assert.equal(projectsMode({ ...base, supportsClip: false }), 'carousel')
  assert.equal(projectsMode({ ...base, failed: true }), 'carousel')
  assert.equal(projectsMode({ webgl2: false, short: true, supportsClip: false, failed: true }), 'carousel')
})

test('projectLabel', () => {
  assert.equal(projectLabel(0, 5), 'Proyecto 1 de 5')
  assert.equal(projectLabel(3, 5), 'Proyecto 4 de 5')
})

// Progreso (de 5 paradas) en que la posición fraccional vale `position`.
const at = (position) => progressForPosition(position, 5)

test('settleTargetDirectional: constantes (umbral 0,05 de la transición y espera ~300 ms)', () => {
  assert.equal(SETTLE_DIRECTION_THRESHOLD, 0.05)
  assert.equal(SETTLE_IDLE_MS, 300)
})

test('settleTargetDirectional hacia adelante: sale de la meseta más que el umbral y avanza aunque no llegue a la mitad', () => {
  assert.equal(settleTargetDirectional(at(1.2), 5, 1), 2)
  assert.equal(settleTargetDirectional(at(1.4), 5, 1), 2)
  assert.equal(settleTargetDirectional(at(0.3), 5, 1), 1)
  assert.equal(settleTargetDirectional(at(3.9), 5, 1), 4)
})

test('settleTargetDirectional hacia atrás: retrocede si se alejó del proyecto de arriba más que el umbral', () => {
  assert.equal(settleTargetDirectional(at(1.8), 5, -1), 1)
  assert.equal(settleTargetDirectional(at(1.6), 5, -1), 1)
  assert.equal(settleTargetDirectional(at(3.7), 5, -1), 3)
})

test('settleTargetDirectional bajo el umbral: vuelve al proyecto actual (el de la meseta de la que casi no salió)', () => {
  assert.equal(settleTargetDirectional(at(1.001), 5, 1), 1)
  assert.equal(settleTargetDirectional(at(1.003), 5, 1), 1)
  assert.equal(settleTargetDirectional(at(1.997), 5, -1), 2)
  assert.equal(settleTargetDirectional(at(1.999), 5, -1), 2)
  // justo por encima del umbral ya sigue el movimiento
  assert.equal(settleTargetDirectional(at(1.01), 5, 1), 2)
  assert.equal(settleTargetDirectional(at(1.99), 5, -1), 1)
})

test('settleTargetDirectional sin dirección: igual que el más cercano (settleTarget)', () => {
  for (let i = 0; i <= 100; i++) assert.equal(settleTargetDirectional(i / 100, 5, 0), settleTarget(i / 100, 5))
})

test('settleTargetDirectional extremos: null en mesetas y bordes, destino siempre dentro de rango', () => {
  for (let k = 0; k < 5; k++) for (const d of [-1, 0, 1]) assert.equal(settleTargetDirectional(progressForPage(k, 5), 5, d), null)
  for (const d of [-1, 0, 1]) {
    assert.equal(settleTargetDirectional(0, 5, d), null)
    assert.equal(settleTargetDirectional(1, 5, d), null)
    assert.equal(settleTargetDirectional(0.3, 1, d), null)
    assert.equal(settleTargetDirectional(0.3, 0, d), null)
  }
  for (let i = 0; i <= 200; i++) for (const d of [-1, 0, 1]) {
    const t = settleTargetDirectional(i / 200, 5, d)
    if (t !== null) assert.ok(Number.isInteger(t) && t >= 0 && t <= 4)
  }
})

test('settleTargetDirectional: asentar no vuelve a asentar (sin bucle) en ninguna dirección', () => {
  for (let i = 0; i <= 200; i++) for (const d of [-1, 0, 1]) {
    const t = settleTargetDirectional(i / 200, 5, d)
    if (t !== null) assert.equal(settleTargetDirectional(progressForPage(t, 5), 5, d), null)
  }
})

test('settleTargetDirectional: scroll lento (muescas de 100 px a 900 px de alto) avanza proyecto por proyecto', () => {
  const vh = 9 // px por vh a 900 px de alto
  const range = (pinRangeVh(5) * vh)
  let k = 0
  for (let n = 0; n < 4; n++) {
    // desde el centro de la meseta de k, una muesca de 100 px hacia adelante
    const y = progressForPage(k, 5) * range + 100
    const t = settleTargetDirectional(y / range, 5, 1)
    assert.equal(t, k + 1)
    k = t
  }
  // y hacia atrás, desde el centro de la meseta de 4
  for (let n = 0; n < 4; n++) {
    const y = progressForPage(k, 5) * range - 100
    const t = settleTargetDirectional(y / range, 5, -1)
    assert.equal(t, k - 1)
    k = t
  }
})
