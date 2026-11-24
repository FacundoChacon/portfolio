import assert from 'node:assert/strict'
import test from 'node:test'

import {
  AMB_AMP,
  AMP_MAX,
  DT_MAX,
  ENERGIA_REPOSO,
  IMPULSO_MAX,
  NIVEL_LLENADO,
  INTERVALO_AMBIENTAL_MS,
  SUBPASO,
  aplicarImpulsos,
  acumularImpulso,
  capasDeSuperficie,
  crearSuperficie,
  debeDibujar,
  dprAcotado,
  energia,
  impulsoDeToque,
  impulsoDelPuntero,
  intervaloCuadro,
  ondaAmbiental,
  paso,
  remuestrear,
  resortesParaAncho,
  shouldAnimate,
} from '../src/utils/lcl.js'

const maxAbs = (arr) => arr.reduce((m, x) => Math.max(m, Math.abs(x)), 0)

// 3.1
test('resortesParaAncho: proporcional al ancho con mínimo y máximo', () => {
  assert.equal(resortesParaAncho(300), 25)
  assert.equal(resortesParaAncho(1200), 100)
  assert.equal(resortesParaAncho(100), 24)
  assert.equal(resortesParaAncho(4000), 160)
  assert.equal(resortesParaAncho(NaN), 24)
})

test('dprAcotado: entre 1 y 1.5', () => {
  assert.equal(dprAcotado(undefined), 1)
  assert.equal(dprAcotado(0), 1)
  assert.equal(dprAcotado(1), 1)
  assert.equal(dprAcotado(1.25), 1.25)
  assert.equal(dprAcotado(2), 1.5)
  assert.equal(dprAcotado(3), 1.5)
})

// 3.2
test('crearSuperficie y paso: la superficie en reposo sigue en reposo', () => {
  const sup = crearSuperficie(40)
  assert.equal(sup.h.length, 40)
  assert.equal(energia(sup), 0)
  for (let i = 0; i < 100; i++) paso(sup, 1 / 60)
  assert.equal(maxAbs(sup.h), 0)
  assert.equal(maxAbs(sup.v), 0)
})

test('paso: dt grande se acota a DT_MAX (5 s equivale a 0.05 s)', () => {
  const a = crearSuperficie(30)
  const b = crearSuperficie(30)
  a.h[15] = 0.2
  b.h[15] = 0.2
  paso(a, 5)
  paso(b, DT_MAX)
  assert.deepEqual(Array.from(a.h), Array.from(b.h))
  assert.deepEqual(Array.from(a.v), Array.from(b.v))
  assert.ok(a.h[15] !== 0.2, 'la simulación avanzó')
})

test('paso: subpasos fijos acumulados (dt chico repetido = un dt grande)', () => {
  const a = crearSuperficie(30)
  const b = crearSuperficie(30)
  a.h[10] = 0.1
  b.h[10] = 0.1
  for (let i = 0; i < 12; i++) paso(a, SUBPASO / 2)
  for (let i = 0; i < 3; i++) paso(b, SUBPASO * 2)
  assert.deepEqual(Array.from(a.h), Array.from(b.h))
  paso(a, -1)
  paso(a, NaN)
  assert.ok(Array.from(a.h).every(Number.isFinite))
})

// 3.3
test('acumularImpulso/aplicarImpulsos: reparto simétrico alrededor del centro', () => {
  const sup = crearSuperficie(21)
  const pend = new Float64Array(21)
  acumularImpulso(pend, 0.5, 0.2)
  aplicarImpulsos(sup, pend)
  assert.ok(sup.v[10] > 0)
  assert.ok(sup.v[9] > 0 && sup.v[11] > 0)
  assert.equal(sup.v[9], sup.v[11])
  assert.equal(sup.v[8], sup.v[12])
  assert.ok(sup.v[10] > sup.v[9] && sup.v[9] > sup.v[8])
  assert.equal(sup.v[0], 0)
  assert.equal(sup.v[20], 0)
  assert.equal(maxAbs(pend), 0, 'el buffer queda vacío')
})

test('acumularImpulso: dos eventos en un cuadro se suman y se acotan a IMPULSO_MAX', () => {
  const uno = new Float64Array(21)
  const dos = new Float64Array(21)
  acumularImpulso(uno, 0.5, 0.06)
  acumularImpulso(dos, 0.5, 0.06)
  acumularImpulso(dos, 0.5, 0.06)
  assert.ok(Math.abs(dos[10] - 2 * uno[10]) < 1e-12)
  for (let i = 0; i < 50; i++) acumularImpulso(dos, 0.5, 0.1)
  assert.equal(dos[10], IMPULSO_MAX)
  assert.ok(maxAbs(dos) <= IMPULSO_MAX)
})

test('acumularImpulso: x01 fuera de [0, 1] o inválido se ignora', () => {
  for (const x of [-0.01, 1.01, NaN, undefined, Infinity]) {
    const pend = new Float64Array(21)
    acumularImpulso(pend, x, 1)
    assert.equal(maxAbs(pend), 0, String(x))
  }
  const borde = new Float64Array(21)
  acumularImpulso(borde, 0, 1)
  assert.ok(borde[0] > 0 && borde[1] > 0)
})

// 3.4
test('propagación: un impulso central llega a resortes a distancia 5', () => {
  const sup = crearSuperficie(41)
  const pend = new Float64Array(41)
  acumularImpulso(pend, 0.5, 0.25)
  aplicarImpulsos(sup, pend)
  for (let i = 0; i < 60; i++) paso(sup, 1 / 60)
  assert.ok(Math.abs(sup.h[20 + 5]) > 1e-5, `h[25] = ${sup.h[25]}`)
  assert.ok(Math.abs(sup.h[20 - 5]) > 1e-5)
  assert.ok(Math.abs(sup.h[25] - sup.h[15]) < 1e-9, 'simétrica')
})

test('amortiguación: la energía cae bajo ENERGIA_REPOSO en menos de 6 s simulados', () => {
  const sup = crearSuperficie(100)
  const pend = new Float64Array(100)
  acumularImpulso(pend, 0.3, 0.3)
  aplicarImpulsos(sup, pend)
  assert.ok(energia(sup) > ENERGIA_REPOSO)
  let t = 0
  while (energia(sup) >= ENERGIA_REPOSO && t < 12) {
    paso(sup, 1 / 60)
    t += 1 / 60
  }
  assert.ok(t < 6, `tardó ${t.toFixed(2)} s`)
  assert.ok(Array.from(sup.h).every(Number.isFinite))
})

test('bordes reflectantes: una onda cerca del borde no produce NaN ni escapa', () => {
  const sup = crearSuperficie(30)
  const pend = new Float64Array(30)
  acumularImpulso(pend, 0, 0.3)
  aplicarImpulsos(sup, pend)
  for (let i = 0; i < 600; i++) paso(sup, 1 / 60)
  assert.ok(Array.from(sup.h).every(Number.isFinite))
  assert.ok(maxAbs(sup.h) <= AMP_MAX)
})

// 3.5
test('estabilidad: 10 000 cuadros con dt grande e impulsos máximos alternados', () => {
  const sup = crearSuperficie(60)
  const pend = new Float64Array(60)
  for (let i = 0; i < 10000; i++) {
    acumularImpulso(pend, (i % 7) / 6, i % 2 ? 100 : -100)
    aplicarImpulsos(sup, pend)
    paso(sup, DT_MAX)
    assert.ok(maxAbs(sup.h) <= AMP_MAX + 1e-12, `cuadro ${i}: ${maxAbs(sup.h)}`)
  }
  assert.ok(Array.from(sup.h).every(Number.isFinite) && Array.from(sup.v).every(Number.isFinite))
})

test('determinismo: dos corridas con la misma secuencia son idénticas', () => {
  const correr = () => {
    const sup = crearSuperficie(50)
    const pend = new Float64Array(50)
    for (let i = 0; i < 300; i++) {
      if (i % 25 === 0) acumularImpulso(pend, ((i * 37) % 100) / 100, 0.8)
      aplicarImpulsos(sup, pend)
      paso(sup, 1 / 60)
    }
    return Array.from(sup.h)
  }
  assert.deepEqual(correr(), correr())
})

// 3.6
test('impulsoDelPuntero: 0 sin movimiento, crece con la velocidad y está acotado', () => {
  assert.equal(impulsoDelPuntero({ dx: 0, dy: 0, dtMs: 16 }), 0)
  const lento = impulsoDelPuntero({ dx: 4, dy: 0, dtMs: 16 })
  const rapido = impulsoDelPuntero({ dx: 40, dy: 0, dtMs: 16 })
  assert.ok(lento > 0 && rapido > lento)
  const brusco = impulsoDelPuntero({ dx: 5000, dy: 5000, dtMs: 1 })
  assert.ok(brusco <= IMPULSO_MAX && brusco >= rapido)
  assert.equal(brusco, impulsoDelPuntero({ dx: 90000, dy: 0, dtMs: 1 }))
})

test('impulsoDelPuntero: dtMs 0 o inválido no divide por cero', () => {
  assert.ok(Number.isFinite(impulsoDelPuntero({ dx: 10, dy: 0, dtMs: 0 })))
  assert.ok(Number.isFinite(impulsoDelPuntero({ dx: 10, dy: 0, dtMs: NaN })))
  assert.equal(impulsoDelPuntero({ dx: NaN, dy: 0, dtMs: 16 }), 0)
})

test('impulsoDeToque: fijo, positivo y dentro del máximo', () => {
  assert.ok(impulsoDeToque() > 0 && impulsoDeToque() <= IMPULSO_MAX)
  assert.equal(impulsoDeToque(), impulsoDeToque())
})

// 3.7 ambiente
test('ondaAmbiental: determinista, acotada por AMB_AMP y lenta', () => {
  assert.ok(AMB_AMP > 0 && AMB_AMP < AMP_MAX / 4)
  // la respiración no aumenta: ≤ lo de antes (0.05 del tanque de 1/3 del panel = 1.67% del panel)
  assert.ok(AMB_AMP <= 0.05 / 3 + 1e-3, `AMB_AMP ${AMB_AMP}`)
  assert.equal(ondaAmbiental(0.3, 2.5, 0), ondaAmbiental(0.3, 2.5, 0))
  let max = 0
  for (let t = 0; t < 120; t += 0.37) {
    for (let x = 0; x <= 1; x += 0.05) {
      for (const capa of [0, 1, 2]) max = Math.max(max, Math.abs(ondaAmbiental(x, t, capa)))
    }
  }
  assert.ok(max <= AMB_AMP + 1e-12 && max > AMB_AMP * 0.5, `máx ${max}`)
  // lenta: en 100 ms casi no cambia
  assert.ok(Math.abs(ondaAmbiental(0.4, 1.1, 0) - ondaAmbiental(0.4, 1.0, 0)) < AMB_AMP * 0.12)
})

test('ondaAmbiental: cambia con el tiempo, con la posición y entre capas', () => {
  assert.notEqual(ondaAmbiental(0.4, 1, 0), ondaAmbiental(0.4, 4, 0))
  assert.notEqual(ondaAmbiental(0.1, 1, 0), ondaAmbiental(0.7, 1, 0))
  assert.notEqual(ondaAmbiental(0.4, 1, 0), ondaAmbiental(0.4, 1, 1))
  assert.notEqual(ondaAmbiental(0.4, 1, 1), ondaAmbiental(0.4, 1, 2))
})

// 3.8 ciclo de vida
test('shouldAnimate: solo visible, pestaña visible y sin movimiento reducido', () => {
  const base = { visible: true, hidden: false, reduced: false }
  assert.equal(shouldAnimate(base), true)
  assert.equal(shouldAnimate({ ...base, visible: false }), false)
  assert.equal(shouldAnimate({ ...base, hidden: true }), false)
  assert.equal(shouldAnimate({ ...base, reduced: true }), false)
  assert.equal(shouldAnimate({ visible: false, hidden: true, reduced: true }), false)
  // la energía ya no decide si hay bucle
  assert.equal(shouldAnimate({ ...base, energy: 0 }), true)
})

test('intervaloCuadro / debeDibujar: ~30 fps en reposo, todos los cuadros excitado', () => {
  assert.ok(Math.abs(INTERVALO_AMBIENTAL_MS - 1000 / 30) < 1e-9)
  assert.equal(intervaloCuadro({ energy: 0 }), INTERVALO_AMBIENTAL_MS)
  assert.equal(intervaloCuadro({ energy: ENERGIA_REPOSO }), INTERVALO_AMBIENTAL_MS)
  assert.equal(intervaloCuadro({ energy: ENERGIA_REPOSO * 2 }), 0)

  assert.equal(debeDibujar({ now: 100, ultimo: null, energy: 0 }), true)
  assert.equal(debeDibujar({ now: 110, ultimo: 100, energy: 0 }), false)
  assert.equal(debeDibujar({ now: 116.7, ultimo: 100, energy: 0 }), false)
  assert.equal(debeDibujar({ now: 133.4, ultimo: 100, energy: 0 }), true) // 2 cuadros a 60 Hz
  assert.equal(debeDibujar({ now: 133.0, ultimo: 100, energy: 0 }), true) // jitter dentro de 1 ms
  assert.equal(debeDibujar({ now: 100.5, ultimo: 100, energy: ENERGIA_REPOSO * 5 }), true)
})

// 3.9 capas
test('capasDeSuperficie: 3 capas; en reposo NO son planas y cambian con t', () => {
  const sup = crearSuperficie(50)
  const a = capasDeSuperficie(sup, 1)
  const b = capasDeSuperficie(sup, 5)
  assert.equal(a.length, 3)
  for (const capa of a) assert.equal(capa.length, 50)
  for (let k = 0; k < 3; k++) {
    assert.ok(maxAbs(a[k]) > 0, `capa ${k} plana`)
    assert.notDeepEqual(Array.from(a[k]), Array.from(b[k]))
  }
  assert.notDeepEqual(Array.from(a[0]), Array.from(a[1]))
})

test('capasDeSuperficie: determinista con t fijo', () => {
  const sup = crearSuperficie(50)
  sup.h[20] = 0.1
  assert.deepEqual(capasDeSuperficie(sup, 3).map((c) => Array.from(c)), capasDeSuperficie(sup, 3).map((c) => Array.from(c)))
})

test('capasDeSuperficie: secundarias = simulación ×0.6 y ×0.35 más su ambiental', () => {
  const sup = crearSuperficie(40)
  sup.h.fill(0.05)
  const t = 2
  const capas = capasDeSuperficie(sup, t)
  const x = (i) => i / 39
  for (const i of [0, 7, 20, 39]) {
    assert.ok(Math.abs(capas[0][i] - (0.05 + ondaAmbiental(x(i), t, 0))) < 1e-12)
    assert.ok(Math.abs(capas[1][i] - (0.03 + ondaAmbiental(x(i), t, 1))) < 1e-12)
    assert.ok(Math.abs(capas[2][i] - (0.0175 + ondaAmbiental(x(i), t, 2))) < 1e-12)
  }
})

test('capasDeSuperficie: toda capa respeta AMP_MAX aun con la simulación al tope', () => {
  const sup = crearSuperficie(40)
  sup.h.fill(AMP_MAX)
  for (let t = 0; t < 60; t += 1.3) {
    for (const capa of capasDeSuperficie(sup, t)) assert.ok(maxAbs(capa) <= AMP_MAX + 1e-12)
  }
  sup.h.fill(-AMP_MAX)
  for (const capa of capasDeSuperficie(sup, 7)) assert.ok(maxAbs(capa) <= AMP_MAX + 1e-12)
})

test('capasDeSuperficie: reutiliza el arreglo de salida si se pasa', () => {
  const sup = crearSuperficie(20)
  const out = capasDeSuperficie(sup, 1)
  const again = capasDeSuperficie(sup, 2, out)
  assert.equal(again, out)
})

// remuestreo al redimensionar
test('remuestrear: conserva la forma al cambiar la cantidad de resortes', () => {
  const sup = crearSuperficie(11)
  for (let i = 0; i < 11; i++) sup.h[i] = i / 10
  const nueva = remuestrear(sup, 21)
  assert.equal(nueva.h.length, 21)
  assert.ok(Math.abs(nueva.h[0] - 0) < 1e-12 && Math.abs(nueva.h[20] - 1) < 1e-12)
  assert.ok(Math.abs(nueva.h[10] - 0.5) < 1e-12)
  assert.equal(remuestrear(sup, 11), sup)
})

// ───────── nivel de llenado y tope de amplitud (fracciones del alto del panel) ─────────

test('NIVEL_LLENADO: el líquido llega a 2/3 del alto del panel', () => {
  assert.equal(NIVEL_LLENADO, 2 / 3)
})

test('AMP_MAX: ninguna cresta pasa del 10% del alto del panel ni llega a la barra superior', () => {
  assert.ok(AMP_MAX <= 0.1 && AMP_MAX >= 0.08, `AMP_MAX ${AMP_MAX}`)
  const cimaMasAlta = 1 - NIVEL_LLENADO - AMP_MAX // fracción del alto medida desde arriba
  assert.ok(cimaMasAlta >= 0.2, `la cresta máxima llega a ${(cimaMasAlta * 100).toFixed(1)}% desde arriba: invade la barra`)
})

test('puntero muy sutil: un barrido rápido no pasa de la mitad del tope y el sacudón sostenido respeta el tope', () => {
  const n = 100
  const sup = crearSuperficie(n)
  const pend = new Float64Array(n)
  let pico = 0
  for (let i = 0; i < 120; i++) {
    acumularImpulso(pend, i / 119, impulsoDelPuntero({ dx: 40, dy: 0, dtMs: 8 })) // 5 px/ms: muy rápido
    aplicarImpulsos(sup, pend)
    paso(sup, 1 / 60)
    pico = Math.max(pico, maxAbs(sup.h))
  }
  assert.ok(pico > 0, 'el barrido genera onda')
  assert.ok(pico < AMP_MAX * 0.5, `pico ${pico} (tope ${AMP_MAX})`)
  for (let i = 0; i < 600; i++) {
    acumularImpulso(pend, 0.5 + 0.1 * Math.sin(i), IMPULSO_MAX)
    aplicarImpulsos(sup, pend)
    paso(sup, 1 / 60)
    assert.ok(maxAbs(sup.h) <= AMP_MAX + 1e-12)
  }
})

test('impulso del puntero: cota baja (≤ 0.3) y toque suave', () => {
  assert.ok(IMPULSO_MAX <= 0.3)
  assert.ok(impulsoDeToque() <= IMPULSO_MAX * 0.7)
  assert.ok(impulsoDelPuntero({ dx: 25, dy: 0, dtMs: 10 }) <= 0.2 + 1e-9) // 2.5 px/ms ≈ 40% del impulso anterior (0.5 panel-u)
})
