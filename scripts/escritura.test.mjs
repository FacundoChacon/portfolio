/**
 * Tests de los helpers puros de la entrada escrita del hero (change
 * `hero-escritura`, design D5). Sin DOM ni React: se importan en Node puro.
 */
import assert from 'node:assert/strict'
import test from 'node:test'

import { DESCRIPCION, FICHA, KICKER, PERFIL, SUBTITULO } from '../src/data/presentacion.js'
import {
  TIEMPOS,
  caracteresVisibles,
  crearLineaDeTiempo,
  debeAnimar,
  estadoEn,
  estadoFinal,
  estadoInicialSegunModo,
  estadosDeCaracteres,
  faseAlcanza,
  faseEn,
  mismoEstado,
} from '../src/utils/escritura.js'

// --- estadosDeCaracteres (4.2) ----------------------------------------------

const E = 'escrito'
const C = 'cursor'
const P = 'pendiente'

test('estadosDeCaracteres izq: 0, n y largo visibles; el cursor va sobre el próximo carácter', () => {
  assert.deepEqual(estadosDeCaracteres('Facundo', 0, 'izq'), [P, P, P, P, P, P, P])
  assert.deepEqual(estadosDeCaracteres('Facundo', 3, 'izq'), [E, E, E, C, P, P, P])
  assert.deepEqual(estadosDeCaracteres('Facundo', 7, 'izq'), [E, E, E, E, E, E, E])
})

test('estadosDeCaracteres der: los escritos son los del extremo derecho y el cursor queda a su izquierda', () => {
  assert.deepEqual(estadosDeCaracteres('Facundo', 0, 'der'), [P, P, P, P, P, P, P])
  assert.deepEqual(estadosDeCaracteres('Facundo', 3, 'der'), [P, P, P, C, E, E, E])
  assert.deepEqual(estadosDeCaracteres('Facundo', 7, 'der'), [E, E, E, E, E, E, E])
})

test('estadosDeCaracteres: una entrada por punto de código ("ó", "·" y emojis no se parten)', () => {
  assert.equal(estadosDeCaracteres('Chacón', 2, 'izq').length, 6)
  assert.deepEqual(estadosDeCaracteres('Chacón', 2, 'der'), [P, P, P, C, E, E])
  assert.equal(estadosDeCaracteres('Operativo · disponible', 5, 'izq').length, 22)
  assert.deepEqual(estadosDeCaracteres('a😀b', 2, 'izq'), [E, E, C])
  assert.deepEqual(estadosDeCaracteres('a😀b', 1, 'der'), [P, C, E])
})

test('estadosDeCaracteres: visibles fuera de rango, negativos o no enteros se recortan', () => {
  assert.deepEqual(estadosDeCaracteres('abc', -4, 'izq'), [P, P, P])
  assert.deepEqual(estadosDeCaracteres('abc', 99, 'der'), [E, E, E])
  assert.deepEqual(estadosDeCaracteres('abc', 1.9, 'izq'), [E, C, P])
  assert.deepEqual(estadosDeCaracteres('abc', Number.NaN, 'izq'), [P, P, P])
  assert.deepEqual(estadosDeCaracteres('', 3, 'izq'), [])
})

test('estadosDeCaracteres: el cursor aparece solo mientras se escribe (nunca antes ni después) y es único', () => {
  for (const texto of ['a', 'Chacón', 'Java 17 · Spring Boot · React']) {
    const largo = Array.from(texto).length
    for (const direccion of ['izq', 'der']) {
      for (let n = 0; n <= largo + 1; n += 1) {
        const estados = estadosDeCaracteres(texto, n, direccion)
        const cursores = estados.filter((e) => e === C).length
        assert.equal(cursores, n > 0 && n < largo ? 1 : 0, `${texto} ${direccion} ${n}`)
        assert.equal(estados.filter((e) => e === E).length, Math.min(n, largo))
      }
    }
  }
})

// --- Línea de tiempo (4.3) ----------------------------------------------------

const TEXTOS = {
  kicker: KICKER,
  nombre: PERFIL.nombre,
  apellido: PERFIL.apellido,
  subtitulo: SUBTITULO,
  descripcion: DESCRIPCION,
  ficha: FICHA,
}

const ALTERNATIVOS = {
  pausa: 50,
  kicker: 100,
  nombre: 200,
  apellido: 100,
  subtitulo: 100,
  descripcion: 400,
  acciones: 200,
  marco: 100,
  valor: 100,
  etiqueta: 50,
}

const IDS_FICHA = FICHA.flatMap(({ id }) => [`${id}-valor`, `${id}-etiqueta`])
const porId = (linea, id) => linea.segmentos.find((s) => s.id === id)

test('crearLineaDeTiempo: segmentos en orden de lectura (A) y de la ficha (C), valor antes que etiqueta', () => {
  const linea = crearLineaDeTiempo(TEXTOS)
  assert.deepEqual(
    linea.segmentos.map((s) => s.id),
    ['kicker', 'nombre', 'apellido', 'subtitulo', 'descripcion', ...IDS_FICHA],
  )
  assert.deepEqual(
    linea.segmentos.map((s) => s.direccion),
    ['izq', 'izq', 'izq', 'izq', 'izq', ...IDS_FICHA.map(() => 'der')],
  )
  assert.deepEqual(linea.segmentos.map((s) => s.largo).slice(0, 5), [
    Array.from(KICKER).length,
    Array.from(PERFIL.nombre).length,
    Array.from(PERFIL.apellido).length,
    Array.from(SUBTITULO).length,
    Array.from(DESCRIPCION).length,
  ])
})

test('crearLineaDeTiempo: constantes por defecto = tabla de D5, pausas de 30 ms en la fase A', () => {
  const linea = crearLineaDeTiempo(TEXTOS)
  const ventana = (id) => [porId(linea, id).inicio, porId(linea, id).fin]
  assert.deepEqual(ventana('kicker'), [0, 160])
  assert.deepEqual(ventana('nombre'), [190, 350])
  assert.deepEqual(ventana('apellido'), [350, 510])
  assert.deepEqual(ventana('subtitulo'), [540, 780])
  assert.deepEqual(ventana('descripcion'), [810, 1510])
  assert.deepEqual(linea.fases, {
    a: { inicio: 0, fin: 1510 },
    acciones: { inicio: 1510, fin: 1870 },
    b: { inicio: 1870, fin: 2170 },
    c: { inicio: 2170, fin: 3130 },
  })
  assert.equal(linea.total, 3130)
})

test('crearLineaDeTiempo: cumple las cotas de la spec con los valores por defecto', () => {
  const linea = crearLineaDeTiempo(TEXTOS)
  assert.ok(linea.total <= 3500, `total ${linea.total} ms > 3500`)
  assert.ok(porId(linea, 'descripcion').inicio <= 850, 'la descripción empieza tarde para el LCP móvil')
})

test('crearLineaDeTiempo: con constantes alternativas todo se recalcula (no depende de los valores por defecto)', () => {
  const linea = crearLineaDeTiempo(TEXTOS, ALTERNATIVOS)
  const ventana = (id) => [porId(linea, id).inicio, porId(linea, id).fin]
  assert.deepEqual(ventana('kicker'), [0, 100])
  assert.deepEqual(ventana('nombre'), [150, 350])
  assert.deepEqual(ventana('apellido'), [350, 450])
  assert.deepEqual(ventana('subtitulo'), [500, 600])
  assert.deepEqual(ventana('descripcion'), [650, 1050])
  assert.deepEqual(ventana('rol-valor'), [1350, 1450])
  assert.deepEqual(ventana('rol-etiqueta'), [1450, 1500])
  assert.deepEqual(ventana('estado-valor'), [1800, 1900])
  assert.deepEqual(ventana('estado-etiqueta'), [1900, 1950])
  assert.equal(linea.fases.acciones.inicio, 1050)
  assert.equal(linea.fases.b.inicio, 1250)
  assert.equal(linea.fases.c.inicio, 1350)
  assert.equal(linea.total, 1950)
  assert.notEqual(TIEMPOS.descripcion, ALTERNATIVOS.descripcion)
})

test('crearLineaDeTiempo: los segmentos nunca se superponen ni retroceden', () => {
  for (const tiempos of [TIEMPOS, ALTERNATIVOS]) {
    const { segmentos } = crearLineaDeTiempo(TEXTOS, tiempos)
    segmentos.forEach((s, i) => {
      assert.ok(s.fin > s.inicio)
      if (i > 0) assert.ok(s.inicio >= segmentos[i - 1].fin, `${s.id} empieza antes de que termine ${segmentos[i - 1].id}`)
    })
  }
})

test('caracteresVisibles: 0 antes del inicio, el largo después del fin y monótona entre medio', () => {
  const segmento = { inicio: 100, fin: 200, largo: 10 }
  assert.equal(caracteresVisibles(0, segmento), 0)
  assert.equal(caracteresVisibles(100, segmento), 0)
  assert.equal(caracteresVisibles(200, segmento), 10)
  assert.equal(caracteresVisibles(5000, segmento), 10)
  let anterior = 0
  for (let t = 100; t <= 200; t += 1) {
    const n = caracteresVisibles(t, segmento)
    assert.ok(n >= anterior && n <= 10, `t=${t}: ${n} tras ${anterior}`)
    anterior = n
  }
})

test('caracteresVisibles: el primer carácter aparece al arrancar y el avance es proporcional (otro segmento)', () => {
  const segmento = { inicio: 0, fin: 1000, largo: 4 }
  assert.equal(caracteresVisibles(1, segmento), 1)
  assert.equal(caracteresVisibles(500, segmento), 2)
  assert.equal(caracteresVisibles(501, segmento), 3)
  assert.equal(caracteresVisibles(999, segmento), 4)
  assert.equal(caracteresVisibles(50, { inicio: 0, fin: 100, largo: 0 }), 0)
})

// --- Fases y estado (4.4) -----------------------------------------------------

test('faseEn: bordes exactos de cada fase', () => {
  const linea = crearLineaDeTiempo(TEXTOS)
  const casos = [
    [-5, 'a'], [0, 'a'], [1509, 'a'], [1510, 'acciones'], [1869, 'acciones'], [1870, 'b'],
    [2169, 'b'], [2170, 'c'], [3129, 'c'], [3130, 'fin'], [99999, 'fin'],
  ]
  for (const [t, fase] of casos) assert.equal(faseEn(t, linea), fase, `t=${t}`)
})

test('faseEn: sigue las fases de una línea con constantes alternativas', () => {
  const linea = crearLineaDeTiempo(TEXTOS, ALTERNATIVOS)
  assert.equal(faseEn(1049, linea), 'a')
  assert.equal(faseEn(1050, linea), 'acciones')
  assert.equal(faseEn(1250, linea), 'b')
  assert.equal(faseEn(1350, linea), 'c')
  assert.equal(faseEn(1950, linea), 'fin')
})

test('faseAlcanza: compara por orden de fases', () => {
  assert.equal(faseAlcanza('c', 'acciones'), true)
  assert.equal(faseAlcanza('acciones', 'acciones'), true)
  assert.equal(faseAlcanza('a', 'acciones'), false)
  assert.equal(faseAlcanza('b', 'c'), false)
  assert.equal(faseAlcanza('fin', 'b'), true)
})

test('estadoEn: en la fase C cada fila revela primero el valor y después la etiqueta, en orden', () => {
  const linea = crearLineaDeTiempo(TEXTOS)
  const valor = porId(linea, 'rol-valor')
  const etiqueta = porId(linea, 'rol-etiqueta')
  const durante = estadoEn((valor.inicio + valor.fin) / 2, linea)
  assert.equal(durante.fase, 'c')
  assert.ok(durante.visibles['rol-valor'] > 0 && durante.visibles['rol-valor'] < valor.largo)
  assert.equal(durante.visibles['rol-etiqueta'], 0)
  assert.equal(durante.visibles['stack-valor'], 0)
  const entre = estadoEn(etiqueta.inicio + 1, linea)
  assert.equal(entre.visibles['rol-valor'], valor.largo)
  assert.ok(entre.visibles['rol-etiqueta'] > 0)
  assert.equal(entre.visibles['stack-valor'], 0)
  const orden = FICHA.map(({ id }) => porId(linea, `${id}-valor`).inicio)
  assert.deepEqual(orden, [...orden].sort((a, b) => a - b))
  assert.ok(porId(linea, 'stack-valor').inicio >= etiqueta.fin)
})

test('estadoEn: nada visible al inicio y todo el texto al final', () => {
  const linea = crearLineaDeTiempo(TEXTOS)
  const inicio = estadoEn(0, linea)
  assert.equal(inicio.fase, 'a')
  assert.ok(Object.values(inicio.visibles).every((n) => n === 0))
  const fin = estadoEn(linea.total, linea)
  assert.equal(fin.fase, 'fin')
  for (const s of linea.segmentos) assert.equal(fin.visibles[s.id], s.largo, s.id)
})

test('estadoEn: la descripción aún no escrita no tiene caracteres cuando termina el kicker', () => {
  const linea = crearLineaDeTiempo(TEXTOS)
  const estado = estadoEn(200, linea)
  assert.equal(estado.visibles.kicker, porId(linea, 'kicker').largo)
  assert.ok(estado.visibles.nombre > 0)
  assert.equal(estado.visibles.descripcion, 0)
})

test('mismoEstado: detecta cambios de fase, de un solo carácter o de claves', () => {
  const a = { fase: 'a', visibles: { kicker: 3, nombre: 0 } }
  assert.equal(mismoEstado(a, { fase: 'a', visibles: { kicker: 3, nombre: 0 } }), true)
  assert.equal(mismoEstado(a, { fase: 'a', visibles: { kicker: 4, nombre: 0 } }), false)
  assert.equal(mismoEstado(a, { fase: 'b', visibles: { kicker: 3, nombre: 0 } }), false)
  assert.equal(mismoEstado(a, { fase: 'a', visibles: { kicker: 3 } }), false)
  assert.equal(mismoEstado(a, { fase: 'a', visibles: { kicker: 3, otro: 0 } }), false)
  assert.equal(mismoEstado(a, a), true)
})

test('debeAnimar: falso con movimiento reducido o si ya se ejecutó', () => {
  assert.equal(debeAnimar({ reducedMotion: false, yaEjecutada: false }), true)
  assert.equal(debeAnimar({ reducedMotion: true, yaEjecutada: false }), false)
  assert.equal(debeAnimar({ reducedMotion: false, yaEjecutada: true }), false)
  assert.equal(debeAnimar({ reducedMotion: true, yaEjecutada: true }), false)
})

// --- Módulo puro (4.5) --------------------------------------------------------

test('escritura.js no depende de DOM, React ni timers', async () => {
  const { readFileSync } = await import('node:fs')
  const fuente = readFileSync(new URL('../src/utils/escritura.js', import.meta.url), 'utf8')
  const codigo = fuente.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/.*$/gm, '')
  assert.doesNotMatch(codigo, /\b(document|window|requestAnimationFrame|setTimeout|setInterval|performance)\b|from\s+['"]react/)
  assert.ok(!/^import /m.test(codigo), 'no importa nada: corre en Node puro')
})

test('estadoFinal: todo el texto escrito en fase fin', () => {
  const linea = crearLineaDeTiempo(TEXTOS)
  const final = estadoFinal(linea)
  assert.equal(final.fase, 'fin')
  assert.equal(final.visibles.descripcion, Array.from(DESCRIPCION).length)
  assert.equal(final.visibles['estado-valor'], Array.from('Operativo · disponible').length)
})

// --- estadoInicialSegunModo (change `compuerta-intro`, design D5) -------------

const SIN_FLAGS = { reducedMotion: false, yaEjecutada: false }

test('estadoInicialSegunModo: lista da el estado final (el hero espera tapado por la compuerta)', () => {
  const linea = crearLineaDeTiempo(TEXTOS)
  assert.deepEqual(estadoInicialSegunModo('lista', linea, SIN_FLAGS), estadoFinal(linea))
  assert.equal(estadoInicialSegunModo('lista', linea, SIN_FLAGS).fase, 'fin')
})

test('estadoInicialSegunModo: en-espera da estadoEn(0), aunque la escritura ya se haya ejecutado', () => {
  const linea = crearLineaDeTiempo(TEXTOS)
  assert.deepEqual(estadoInicialSegunModo('en-espera', linea, SIN_FLAGS), estadoEn(0, linea))
  assert.equal(estadoInicialSegunModo('en-espera', linea, SIN_FLAGS).fase, 'a')
  assert.deepEqual(estadoInicialSegunModo('en-espera', linea, { ...SIN_FLAGS, yaEjecutada: true }), estadoEn(0, linea))
})

test('estadoInicialSegunModo: libre da lo de siempre, estadoEn(0) si debeAnimar y estadoFinal si no', () => {
  const linea = crearLineaDeTiempo(TEXTOS)
  assert.deepEqual(estadoInicialSegunModo('libre', linea, SIN_FLAGS), estadoEn(0, linea))
  assert.deepEqual(estadoInicialSegunModo('libre', linea, { reducedMotion: false, yaEjecutada: true }), estadoFinal(linea))
  assert.deepEqual(estadoInicialSegunModo('libre', linea, { reducedMotion: true, yaEjecutada: false }), estadoFinal(linea))
})

test('estadoInicialSegunModo: con movimiento reducido todos los modos dan el estado final', () => {
  const linea = crearLineaDeTiempo(TEXTOS)
  for (const modo of ['lista', 'en-espera', 'libre']) {
    assert.deepEqual(estadoInicialSegunModo(modo, linea, { reducedMotion: true, yaEjecutada: false }), estadoFinal(linea), modo)
  }
})

test('estadoInicialSegunModo: un modo desconocido se trata como libre', () => {
  const linea = crearLineaDeTiempo(TEXTOS)
  assert.deepEqual(estadoInicialSegunModo('raro', linea, SIN_FLAGS), estadoEn(0, linea))
})
