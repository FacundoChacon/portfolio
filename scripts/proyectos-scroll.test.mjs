import assert from 'node:assert/strict'
import test from 'node:test'

import {
  PLATEAU_VH,
  TRANSITION_VH,
  ctaPlacement,
  currentPage,
  layoutMode,
  pageCount,
  pageOfItem,
  pagePosition,
  pageStride,
  pinHeightVh,
  pinRangeVh,
  progressForPage,
  projectLabel,
  scrollProgress,
  scrollTopForPage,
  settleTarget,
  trackItemCount,
  trackOffset,
} from '../src/utils/proyectosScroll.js'

test('pageCount: cociente hacia arriba de a tres', () => {
  const casos = [[0, 0], [1, 1], [3, 1], [4, 2], [5, 2], [6, 2], [7, 3]]
  for (const [items, esperado] of casos) assert.equal(pageCount(items), esperado, `items=${items}`)
})

test('pageCount: entradas inválidas dan 0 y perPage < 1 lanza RangeError', () => {
  for (const malo of [-1, 2.5, NaN, Infinity]) assert.equal(pageCount(malo), 0, String(malo))
  assert.equal(pageCount(5, 2), 3)
  assert.throws(() => pageCount(5, 0), RangeError)
})

test('ctaPlacement y trackItemCount: el cierre rellena el hueco o va después', () => {
  const placement = [[0, 'track'], [3, 'after'], [5, 'track'], [6, 'after'], [7, 'track']]
  for (const [n, esperado] of placement) assert.equal(ctaPlacement(n), esperado, `n=${n}`)
  const items = [[0, 1], [5, 6], [6, 6], [7, 8]]
  for (const [n, esperado] of items) assert.equal(trackItemCount(n), esperado, `n=${n}`)
})

test('integración: 5 y 6 proyectos dan 2 páginas', () => {
  assert.equal(pageCount(trackItemCount(5)), 2)
  assert.equal(pageCount(trackItemCount(6)), 2)
})

test('pinRangeVh y pinHeightVh: tramo fijado entre 200 y 250 vh para 2 páginas', () => {
  assert.equal(PLATEAU_VH, 25)
  assert.equal(TRANSITION_VH, 75)
  assert.equal(pinRangeVh(2), 125)
  assert.equal(pinRangeVh(3), 225)
  assert.equal(pinHeightVh(0), 0)
  assert.equal(pinHeightVh(1), 0)
  assert.equal(pinHeightVh(2), 225)
  assert.equal(pinHeightVh(3), 325)
  assert.ok(pinHeightVh(2) >= 200 && pinHeightVh(2) <= 250)
})

test('scrollProgress: acotado y con range inválido', () => {
  assert.equal(scrollProgress({ scrollY: 100, top: 500, range: 1000 }), 0)
  assert.equal(scrollProgress({ scrollY: 2000, top: 500, range: 1000 }), 1)
  assert.equal(scrollProgress({ scrollY: 1000, top: 500, range: 1000 }), 0.5)
  assert.equal(scrollProgress({ scrollY: 1000, top: 500, range: 0 }), 0)
  assert.equal(scrollProgress({ scrollY: 1000, top: 500, range: -5 }), 0)
})

test('pagePosition P=2: mesetas, mitad y clamp', () => {
  const casos = [[0, 0], [0.1, 0], [0.2, 0], [0.5, 0.5], [0.8, 1], [1, 1], [-0.5, 0], [1.5, 1]]
  for (const [progreso, esperado] of casos) {
    assert.ok(Math.abs(pagePosition(progreso, 2) - esperado) < 1e-9, `p=${progreso}`)
  }
})

test('pagePosition P=2: smoothstep llega a la meseta suave (menor que lo lineal)', () => {
  const pos = pagePosition(0.35, 2)
  assert.ok(pos > 0 && pos < 0.5)
  assert.ok(pos < (0.35 - 0.2) / 0.6, 'debe ir por debajo de la recta al inicio de la transición')
})

test('pagePosition P=3: meseta central y barrido monótono', () => {
  assert.ok(Math.abs(pagePosition(0.5, 3) - 1) < 1e-9)
  let previo = -1
  for (let i = 0; i <= 100; i++) {
    const pos = pagePosition(i / 100, 3)
    assert.ok(pos >= previo, `retrocede en ${i / 100}`)
    assert.ok(pos >= 0 && pos <= 2)
    previo = pos
  }
  assert.equal(pagePosition(1, 3), 2)
})

test('pagePosition: con una página o menos es 0', () => {
  assert.equal(pagePosition(0.7, 1), 0)
  assert.equal(pagePosition(0.7, 0), 0)
})

test('pageStride y trackOffset: sin -0', () => {
  assert.equal(pageStride(1152, 24), 1176)
  assert.equal(pageStride(1000, 0), 1000)
  assert.ok(Object.is(trackOffset(0, 1176), 0))
  assert.equal(trackOffset(1, 1176), -1176)
  assert.equal(trackOffset(0.5, 1000), -500)
})

test('progressForPage: centro de la meseta y clamp de la página', () => {
  assert.ok(Math.abs(progressForPage(0, 2) - 0.1) < 1e-9)
  assert.ok(Math.abs(progressForPage(1, 2) - 0.9) < 1e-9)
  assert.ok(Math.abs(progressForPage(1, 3) - 0.5) < 1e-9)
  assert.ok(Math.abs(progressForPage(9, 2) - 0.9) < 1e-9)
  assert.ok(Math.abs(progressForPage(-3, 2) - 0.1) < 1e-9)
})

test('scrollTopForPage: redondea el centro de la meseta', () => {
  assert.equal(scrollTopForPage({ page: 1, pages: 2, top: 2000, range: 1125 }), 3013)
  assert.equal(scrollTopForPage({ page: 0, pages: 2, top: 2000, range: 1125 }), 2113)
})

test('pagePosition(progressForPage(k)) devuelve k', () => {
  for (const pages of [2, 3, 4]) {
    for (let k = 0; k < pages; k++) {
      assert.ok(Math.abs(pagePosition(progressForPage(k, pages), pages) - k) < 1e-9, `P=${pages} k=${k}`)
    }
  }
})

test('pageOfItem y currentPage', () => {
  const items = [[0, 0], [2, 0], [3, 1], [5, 1], [6, 2]]
  for (const [i, esperado] of items) assert.equal(pageOfItem(i), esperado, `i=${i}`)
  assert.equal(currentPage(0.49), 0)
  assert.equal(currentPage(0.51), 1)
})

test('settleTarget: null en meseta y bordes, destino en transición', () => {
  for (const p of [0, 0.1, 0.9, 1]) assert.equal(settleTarget(p, 2), null, `p=${p}`)
  assert.equal(settleTarget(0.3, 2), 0)
  assert.equal(settleTarget(0.7, 2), 1)
  assert.equal(settleTarget(0.3, 1), null)
  assert.equal(settleTarget(0.3, 0), null)
  assert.equal(settleTarget(-1, 2), null)
  assert.equal(settleTarget(2, 2), null)
})

test('settleTarget: asentar no vuelve a asentar (sin bucle)', () => {
  for (const pages of [2, 3]) {
    for (let i = 0; i <= 100; i++) {
      const target = settleTarget(i / 100, pages)
      if (target !== null) assert.equal(settleTarget(progressForPage(target, pages), pages), null)
    }
  }
})

test('layoutMode: pin, row y carrusel por cada condición', () => {
  const base = { pages: 2, narrow: false, coarse: false, short: false, reducedMotion: false, supportsClip: true }
  assert.equal(layoutMode(base), 'pin')
  assert.equal(layoutMode({ ...base, pages: 1 }), 'row')
  assert.equal(layoutMode({ ...base, pages: 0 }), 'row')
  for (const clave of ['narrow', 'coarse', 'short', 'reducedMotion']) {
    assert.equal(layoutMode({ ...base, [clave]: true }), 'carousel', clave)
  }
  assert.equal(layoutMode({ ...base, supportsClip: false }), 'carousel')
  assert.equal(layoutMode({ ...base, pages: 1, narrow: true }), 'carousel')
})

test('projectLabel', () => {
  assert.equal(projectLabel(0, 5), 'Proyecto 1 de 5')
  assert.equal(projectLabel(3, 5), 'Proyecto 4 de 5')
})
