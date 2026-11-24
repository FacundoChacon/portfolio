import assert from 'node:assert/strict'
import test from 'node:test'

import { PROYECTOS } from '../src/data/proyectos.js'
import {
  CORTES,
  accesoRepositorio,
  anuncioVentana,
  clampInicio,
  direccionDeslizar,
  etiquetaIndicador,
  etiquetasVisibles,
  hayNavegacion,
  inicioParaMostrar,
  maxInicio,
  mover,
  porVistaParaAncho,
  projectLabel,
  puedeAvanzar,
  puedeRetroceder,
  ventanaVisible,
} from '../src/utils/panelProyectos.js'

// 2.1 cortes por ancho
test('CORTES: 640 y 1024', () => {
  assert.deepEqual(CORTES, { dos: 640, tres: 1024 })
})

test('porVistaParaAncho: 1 / 2 / 3 con los cortes en 640 y 1024', () => {
  const casos = [
    [375, 1],
    [639.98, 1],
    [640, 2],
    [768, 2],
    [1023.98, 2],
    [1024, 3],
    [1440, 3],
  ]
  for (const [ancho, esperado] of casos) assert.equal(porVistaParaAncho(ancho), esperado, `ancho ${ancho}`)
})

test('porVistaParaAncho: ancho inválido → 1', () => {
  for (const malo of [0, -5, NaN, undefined, null, Infinity]) assert.equal(porVistaParaAncho(malo), 1, String(malo))
})

// 2.2 ventana sin vuelta
test('maxInicio: total − porVista, nunca negativo', () => {
  assert.equal(maxInicio(5, 3), 2)
  assert.equal(maxInicio(5, 1), 4)
  assert.equal(maxInicio(5, 2), 3)
  assert.equal(maxInicio(3, 3), 0)
  assert.equal(maxInicio(2, 3), 0)
})

test('clampInicio: acota al rango y reajusta al ensanchar', () => {
  assert.equal(clampInicio(4, 5, 3), 2) // 375 → 1440 con el 5 visible: 3-4-5
  assert.equal(clampInicio(-3, 5, 3), 0)
  assert.equal(clampInicio(1, 5, 3), 1)
  assert.equal(clampInicio(9, 2, 3), 0)
  assert.equal(clampInicio(Number.NaN, 5, 3), 0)
})

test('mover: de a uno y sin vuelta', () => {
  assert.equal(mover(0, +1, 5, 3), 1)
  assert.equal(mover(1, +1, 5, 3), 2)
  assert.equal(mover(2, +1, 5, 3), 2) // extremo final: no da la vuelta
  assert.equal(mover(0, -1, 5, 3), 0) // extremo inicial: no da la vuelta
  assert.equal(mover(2, -1, 5, 3), 1)
  assert.equal(mover(3, +1, 5, 1), 4)
  assert.equal(mover(4, +1, 5, 1), 4)
})

// 2.3 ventana visible y límites
test('ventanaVisible: siempre completa', () => {
  assert.deepEqual(ventanaVisible(5, 0, 3), [0, 1, 2])
  assert.deepEqual(ventanaVisible(5, 2, 3), [2, 3, 4])
  assert.deepEqual(ventanaVisible(5, 4, 3), [2, 3, 4])
  assert.deepEqual(ventanaVisible(2, 0, 3), [0, 1])
  assert.deepEqual(ventanaVisible(5, 3, 1), [3])
})

test('puedeAvanzar / puedeRetroceder en extremos y en el medio', () => {
  assert.equal(puedeRetroceder(0), false)
  assert.equal(puedeRetroceder(1), true)
  assert.equal(puedeAvanzar(0, 5, 3), true)
  assert.equal(puedeAvanzar(1, 5, 3), true)
  assert.equal(puedeAvanzar(2, 5, 3), false)
  assert.equal(puedeAvanzar(4, 5, 1), false)
})

test('hayNavegacion: solo si no todo entra', () => {
  assert.equal(hayNavegacion(5, 3), true)
  assert.equal(hayNavegacion(3, 3), false)
  assert.equal(hayNavegacion(2, 3), false)
  assert.equal(hayNavegacion(5, 1), true)
})

// 2.4 foco
test('inicioParaMostrar: corrimiento mínimo', () => {
  assert.equal(inicioParaMostrar(3, 0, 5, 3), 1)
  assert.equal(inicioParaMostrar(1, 2, 5, 3), 1)
  assert.equal(inicioParaMostrar(1, 0, 5, 3), 0) // ya visible
  assert.equal(inicioParaMostrar(4, 0, 5, 3), 2)
  assert.equal(inicioParaMostrar(3, 0, 5, 1), 3)
  assert.equal(inicioParaMostrar(0, 4, 5, 1), 0)
})

// 2.5 indicador y anuncio
test('etiquetaIndicador', () => {
  assert.equal(etiquetaIndicador(0, 3, 5), '01–03 / 05')
  assert.equal(etiquetaIndicador(1, 3, 5), '02–04 / 05')
  assert.equal(etiquetaIndicador(2, 1, 5), '03 / 05')
  assert.equal(etiquetaIndicador(0, 2, 12), '01–02 / 12')
})

test('anuncioVentana', () => {
  assert.equal(anuncioVentana(1, 3, 5), 'Proyectos 2 a 4 de 5')
  assert.equal(anuncioVentana(2, 1, 5), 'Proyecto 3 de 5')
  assert.equal(anuncioVentana(3, 2, 5), 'Proyectos 4 a 5 de 5')
})

test('projectLabel', () => {
  assert.equal(projectLabel(0, 5), 'Proyecto 1 de 5')
  assert.equal(projectLabel(3, 5), 'Proyecto 4 de 5')
})

// 2.6 deslizar
test('direccionDeslizar', () => {
  assert.equal(direccionDeslizar({ dx: -60, dy: 5 }), 1)
  assert.equal(direccionDeslizar({ dx: 60, dy: 5 }), -1)
  assert.equal(direccionDeslizar({ dx: -30, dy: 0 }), 0) // corto
  assert.equal(direccionDeslizar({ dx: -60, dy: 80 }), 0) // vertical
  assert.equal(direccionDeslizar({ dx: -40, dy: 0 }), 1) // umbral por defecto 40
  assert.equal(direccionDeslizar({ dx: -39, dy: 0 }), 0)
  assert.equal(direccionDeslizar({ dx: -60, dy: 0, umbral: 80 }), 0)
  assert.equal(direccionDeslizar({ dx: -60, dy: 60 }), 0) // |dx| ≤ |dy|
})

// 2.7 etiquetas y acceso al repositorio
test('etiquetasVisibles: 3 por defecto y resto', () => {
  const t = ['a', 'b', 'c', 'd', 'e', 'f']
  assert.deepEqual(etiquetasVisibles(t), { visibles: ['a', 'b', 'c'], resto: 3 })
  assert.deepEqual(etiquetasVisibles(['a', 'b', 'c']), { visibles: ['a', 'b', 'c'], resto: 0 })
  assert.deepEqual(etiquetasVisibles(['a', 'b', 'c', 'd']), { visibles: ['a', 'b', 'c'], resto: 1 })
  assert.deepEqual(etiquetasVisibles(t, 2), { visibles: ['a', 'b'], resto: 4 })
  assert.deepEqual(etiquetasVisibles([]), { visibles: [], resto: 0 })
})

test('accesoRepositorio con los datos reales', () => {
  const por = Object.fromEntries(PROYECTOS.map((p) => [p.title, accesoRepositorio(p)]))
  assert.deepEqual(por['Tienda-Electronica'], { tipo: 'enlace', href: 'https://github.com/FacundoChacon/Tienda-Electronica' })
  assert.deepEqual(por['Odontologia-Carolina'], { tipo: 'privado' })
  assert.deepEqual(por['3-Esquinas'], { tipo: 'privado' })
  assert.equal(por['Bodega'].tipo, 'enlace')
  assert.equal(accesoRepositorio({ repo: '' }).tipo, 'privado')
})
