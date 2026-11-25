/**
 * Tests de la compuerta de entrada (change `compuerta-intro`): lógica pura de
 * `src/utils/compuerta.js` y guards estáticos del componente, el CSS y el hook.
 */
import assert from 'node:assert/strict'
import test from 'node:test'

import {
  CLAVE_SESION,
  TIEMPOS_COMPUERTA,
  bloqueaDesplazamiento,
  crearLineaCompuerta,
  debeMostrarCompuerta,
  decidirCompuerta,
  estadoHeroSegunCompuerta,
  faseCompuerta,
  leerSesion,
  marcarSesion,
  sesionDelNavegador,
  transicionCompuerta,
} from '../src/utils/compuerta.js'

/** Almacenamiento falso con la API mínima de `Storage`. */
function storageFalso({ getItem, setItem } = {}) {
  const datos = new Map()
  return {
    datos,
    getItem: getItem ?? ((clave) => (datos.has(clave) ? datos.get(clave) : null)),
    setItem: setItem ?? ((clave, valor) => void datos.set(clave, String(valor))),
  }
}

const ENTRADA_VALIDA = { reducedMotion: false, rutaDeEntrada: '/', hash: '' }
const lanza = (mensaje) => () => {
  throw new Error(mensaje)
}

// --- 2.1 Línea de tiempo y fases (design D7) -------------------------------

test('crearLineaCompuerta: fases con los tiempos por defecto y total de 2000 ms', () => {
  const linea = crearLineaCompuerta()
  assert.deepEqual(linea.armado, { inicio: 0, fin: 840 })
  assert.deepEqual(linea.lectura, { inicio: 840, fin: 1300 })
  assert.deepEqual(linea.retiro, { inicio: 1300, fin: 1500 })
  assert.deepEqual(linea.apertura, { inicio: 1500, fin: 2000 })
  assert.equal(linea.total, 2000)
  assert.ok(linea.total <= 2200, 'la spec exige una duración ≤ 2,2 s')
})

test('TIEMPOS_COMPUERTA: está congelado', () => {
  assert.ok(Object.isFrozen(TIEMPOS_COMPUERTA))
})

test('faseCompuerta: bordes exactos de cada fase (t−1, t, t+1) con los tiempos por defecto', () => {
  const linea = crearLineaCompuerta()
  const casos = [
    [0, 'armado'], [839, 'armado'],
    [840, 'lectura'], [1299, 'lectura'],
    [1300, 'retiro'], [1499, 'retiro'],
    [1500, 'apertura'], [1999, 'apertura'],
    [2000, 'abierta'], [2001, 'abierta'],
  ]
  for (const [t, fase] of casos) assert.equal(faseCompuerta(t, linea), fase, `t=${t}`)
})

test('faseCompuerta: t negativo da armado y un t enorme da abierta', () => {
  const linea = crearLineaCompuerta()
  assert.equal(faseCompuerta(-1, linea), 'armado')
  assert.equal(faseCompuerta(-5000, linea), 'armado')
  assert.equal(faseCompuerta(1e9, linea), 'abierta')
})

test('crearLineaCompuerta + faseCompuerta: triangula con tiempos alternativos (no dependen de los de por defecto)', () => {
  const linea = crearLineaCompuerta({ junta: 100, glifoInicio: 50, glifo: 100, textoInicio: 100, texto: 100, lectura: 300, retiro: 100, apertura: 400 })
  assert.deepEqual(linea.armado, { inicio: 0, fin: 200 })
  assert.deepEqual(linea.lectura, { inicio: 200, fin: 500 })
  assert.deepEqual(linea.retiro, { inicio: 500, fin: 600 })
  assert.deepEqual(linea.apertura, { inicio: 600, fin: 1000 })
  assert.equal(linea.total, 1000)
  assert.equal(faseCompuerta(199, linea), 'armado')
  assert.equal(faseCompuerta(200, linea), 'lectura')
  assert.equal(faseCompuerta(599, linea), 'retiro')
  assert.equal(faseCompuerta(600, linea), 'apertura')
  assert.equal(faseCompuerta(1000, linea), 'abierta')
})

test('crearLineaCompuerta: rechaza un total mayor a 2200 ms con un mensaje claro', () => {
  assert.throws(() => crearLineaCompuerta({ ...TIEMPOS_COMPUERTA, lectura: 700 }), /2200/)
  assert.doesNotThrow(() => crearLineaCompuerta({ ...TIEMPOS_COMPUERTA, lectura: 660 }), 'justo 2200 es válido')
})

test('crearLineaCompuerta: rechaza tramos que se solapan (duración negativa o no numérica)', () => {
  assert.throws(() => crearLineaCompuerta({ ...TIEMPOS_COMPUERTA, lectura: -10 }), /lectura/)
  assert.throws(() => crearLineaCompuerta({ ...TIEMPOS_COMPUERTA, apertura: Number.NaN }), /apertura/)
  assert.throws(() => crearLineaCompuerta({ ...TIEMPOS_COMPUERTA, retiro: 'rápido' }), /retiro/)
})

// --- 2.2 Cuándo se muestra (design D3) -------------------------------------

test('debeMostrarCompuerta: true solo con "/", sin ancla válida, sesión disponible y no vista, sin movimiento reducido', () => {
  assert.equal(debeMostrarCompuerta({ ...ENTRADA_VALIDA, sesion: { disponible: true, vista: false } }), true)
})

test('debeMostrarCompuerta: false con cada condición por separado', () => {
  const sesion = { disponible: true, vista: false }
  assert.equal(debeMostrarCompuerta({ ...ENTRADA_VALIDA, sesion, reducedMotion: true }), false, 'movimiento reducido')
  assert.equal(debeMostrarCompuerta({ ...ENTRADA_VALIDA, sesion, rutaDeEntrada: '/configurador' }), false, 'otra ruta')
  assert.equal(debeMostrarCompuerta({ ...ENTRADA_VALIDA, sesion, hash: '#proyectos' }), false, 'ancla válida')
  assert.equal(debeMostrarCompuerta({ ...ENTRADA_VALIDA, sesion: { disponible: false, vista: false } }), false, 'sin almacenamiento')
  assert.equal(debeMostrarCompuerta({ ...ENTRADA_VALIDA, sesion: { disponible: true, vista: true } }), false, 'ya vista')
})

test('debeMostrarCompuerta: un hash vacío o inválido cuenta como sin ancla (reutiliza resolveHashTarget)', () => {
  const sesion = { disponible: true, vista: false }
  for (const hash of ['#', '', '#%E0%A4%A', '#1abc']) {
    assert.equal(debeMostrarCompuerta({ ...ENTRADA_VALIDA, sesion, hash }), true, `hash ${JSON.stringify(hash)}`)
  }
  assert.equal(debeMostrarCompuerta({ ...ENTRADA_VALIDA, sesion, hash: '#contacto' }), false)
})

// --- 2.3 Sesión (design D4) -------------------------------------------------

test('leerSesion + marcarSesion: lee vacío, marca y después lee vista; la clave es facucode.compuerta', () => {
  const storage = storageFalso()
  assert.equal(CLAVE_SESION, 'facucode.compuerta')
  assert.deepEqual(leerSesion(storage), { disponible: true, vista: false })
  assert.equal(marcarSesion(storage), true)
  assert.equal(storage.datos.get('facucode.compuerta'), 'vista')
  assert.deepEqual(leerSesion(storage), { disponible: true, vista: true })
})

test('leerSesion: un valor ajeno en la clave no cuenta como vista', () => {
  const storage = storageFalso()
  storage.datos.set(CLAVE_SESION, 'otra-cosa')
  assert.deepEqual(leerSesion(storage), { disponible: true, vista: false })
})

test('leerSesion: si getItem lanza, disponible es false; undefined y null también', () => {
  assert.deepEqual(leerSesion(storageFalso({ getItem: lanza('SecurityError') })), { disponible: false, vista: false })
  assert.deepEqual(leerSesion(undefined), { disponible: false, vista: false })
  assert.deepEqual(leerSesion(null), { disponible: false, vista: false })
})

test('marcarSesion: si setItem lanza devuelve false sin lanzar; con undefined/null también', () => {
  assert.equal(marcarSesion(storageFalso({ setItem: lanza('QuotaExceededError') })), false)
  assert.equal(marcarSesion(undefined), false)
  assert.equal(marcarSesion(null), false)
})

test('sesionDelNavegador: un getter de sessionStorage que lanza SecurityError devuelve null sin lanzar', () => {
  const global = {}
  Object.defineProperty(global, 'sessionStorage', { get: lanza('SecurityError') })
  assert.equal(sesionDelNavegador(global), null)
  const normal = { sessionStorage: storageFalso() }
  assert.equal(sesionDelNavegador(normal), normal.sessionStorage)
  assert.equal(sesionDelNavegador({}), null)
})

test('decidirCompuerta: marca la sesión al decidir mostrarla y no la vuelve a mostrar', () => {
  const storage = storageFalso()
  assert.equal(decidirCompuerta(ENTRADA_VALIDA, storage), true)
  assert.equal(storage.datos.get(CLAVE_SESION), 'vista', 'marcada antes del primer cuadro')
  assert.equal(decidirCompuerta(ENTRADA_VALIDA, storage), false, 'segunda carga de la sesión')
})

test('decidirCompuerta: si marcar falla devuelve false; sin almacenamiento tampoco hay compuerta', () => {
  assert.equal(decidirCompuerta(ENTRADA_VALIDA, storageFalso({ setItem: lanza('QuotaExceededError') })), false)
  assert.equal(decidirCompuerta(ENTRADA_VALIDA, null), false)
  assert.equal(decidirCompuerta(ENTRADA_VALIDA, storageFalso({ getItem: lanza('x') })), false)
})

test('decidirCompuerta: entrar por ancla, otra ruta o movimiento reducido no gasta la vez de la sesión', () => {
  const entradas = [{ ...ENTRADA_VALIDA, hash: '#contacto' }, { ...ENTRADA_VALIDA, rutaDeEntrada: '/configurador' }, { ...ENTRADA_VALIDA, reducedMotion: true }]
  for (const entrada of entradas) {
    const storage = storageFalso()
    assert.equal(decidirCompuerta(entrada, storage), false)
    assert.equal(storage.datos.size, 0, 'no marcó la sesión')
    assert.equal(decidirCompuerta(ENTRADA_VALIDA, storage), true, 'la compuerta sigue disponible después')
  }
})

// --- 2.4 Reductor y modo del hero (design D2, D5, D9) -----------------------

test('transicionCompuerta: cuadro(t) avanza la fase según la línea', () => {
  let estado = { fase: 'armado' }
  estado = transicionCompuerta(estado, { tipo: 'cuadro', t: 900 })
  assert.equal(estado.fase, 'lectura')
  estado = transicionCompuerta(estado, { tipo: 'cuadro', t: 1400 })
  assert.equal(estado.fase, 'retiro')
  estado = transicionCompuerta(estado, { tipo: 'cuadro', t: 1600 })
  assert.equal(estado.fase, 'apertura')
  estado = transicionCompuerta(estado, { tipo: 'cuadro', t: 2000 })
  assert.equal(estado.fase, 'abierta')
})

test('transicionCompuerta: cuadro(t) nunca retrocede y usa la línea que recibe', () => {
  assert.equal(transicionCompuerta({ fase: 'apertura' }, { tipo: 'cuadro', t: 100 }).fase, 'apertura')
  const corta = crearLineaCompuerta({ junta: 10, glifoInicio: 0, glifo: 10, textoInicio: 0, texto: 10, lectura: 10, retiro: 10, apertura: 10 })
  assert.equal(transicionCompuerta({ fase: 'armado' }, { tipo: 'cuadro', t: 35, linea: corta }).fase, 'apertura')
  assert.equal(transicionCompuerta({ fase: 'armado' }, { tipo: 'cuadro', t: 35 }).fase, 'armado', 'con la línea por defecto sigue armado')
})

test('transicionCompuerta: saltar y movimiento-reducido pasan a abierta desde cualquier fase', () => {
  for (const fase of ['armado', 'lectura', 'retiro', 'apertura']) {
    assert.equal(transicionCompuerta({ fase }, { tipo: 'saltar' }).fase, 'abierta', `saltar desde ${fase}`)
    assert.equal(transicionCompuerta({ fase }, { tipo: 'movimiento-reducido' }).fase, 'abierta', `movimiento-reducido desde ${fase}`)
  }
})

test('transicionCompuerta: desde abierta no cambia nada (misma referencia) y una acción desconocida tampoco', () => {
  const abierta = { fase: 'abierta' }
  assert.equal(transicionCompuerta(abierta, { tipo: 'saltar' }), abierta)
  assert.equal(transicionCompuerta(abierta, { tipo: 'cuadro', t: 0 }), abierta)
  const armado = { fase: 'armado' }
  assert.equal(transicionCompuerta(armado, { tipo: 'inventada' }), armado)
})

test('estadoHeroSegunCompuerta: lista cerrada, en-espera durante la apertura y libre al abrirse o sin compuerta', () => {
  for (const fase of ['armado', 'lectura', 'retiro']) assert.equal(estadoHeroSegunCompuerta(fase), 'lista', fase)
  assert.equal(estadoHeroSegunCompuerta('apertura'), 'en-espera')
  assert.equal(estadoHeroSegunCompuerta('abierta'), 'libre')
  for (const sinCompuerta of [null, undefined]) assert.equal(estadoHeroSegunCompuerta(sinCompuerta), 'libre')
})

test('bloqueaDesplazamiento: solo en armado, lectura y retiro', () => {
  for (const fase of ['armado', 'lectura', 'retiro']) assert.equal(bloqueaDesplazamiento(fase), true, fase)
  for (const fase of ['apertura', 'abierta', null, undefined]) assert.equal(bloqueaDesplazamiento(fase), false, String(fase))
})

// --- 2.5 Módulo puro ---------------------------------------------------------

test('compuerta.js se importa en Node puro: sin window ni document y sin tocar el DOM', () => {
  assert.equal(typeof window, 'undefined')
  assert.equal(typeof document, 'undefined')
  assert.equal(sesionDelNavegador(), null, 'sin sessionStorage global devuelve null')
})
