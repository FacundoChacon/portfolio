/**
 * Tests de la compuerta de entrada (change `compuerta-intro`): lógica pura de
 * `src/utils/compuerta.js` y guards estáticos del componente, el CSS y el hook.
 */
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
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
  teclaDesplaza,
  transicionCompuerta,
} from '../src/utils/compuerta.js'
import tailwindConfig from '../tailwind.config.js'
import { ruleBody } from './lib/css-rules.mjs'

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

// --- 4.1 Guard estático del componente (design D6, D11) -----------------------

const ROOT = new URL('../', import.meta.url)
const read = (ruta) => readFileSync(new URL(ruta, ROOT), 'utf8')

/** Etiqueta de apertura (sin el contenido) que contiene `marca`, o '' si no hay. */
function etiquetaConMarca(source, marca) {
  const indice = source.indexOf(marca)
  if (indice < 0) return ''
  const inicio = source.lastIndexOf('<', indice)
  return source.slice(inicio, source.indexOf('>', indice) + 1)
}

/** Cuenta una clase exacta (no `compuerta-placa-texto` cuando se busca `compuerta-placa`) en un bloque de JSX. */
const contarClase = (bloque, clase) => (bloque.match(new RegExp(`(?<![\\w-])${clase}(?![\\w-])`, 'g')) ?? []).length

/** Mínimos de decoración por hoja (design D14): las mismas piezas arriba y abajo, simétricas. */
const DECORACION_POR_HOJA = { 'compuerta-placa': 2, 'compuerta-labio': 2, 'compuerta-nervio': 2 }

/** Decoración metálica del componente (design D14): superficie, relieves y simetría entre las dos hojas. */
function decoracionComponenteProblems(codigo) {
  const problems = []
  const corte = codigo.indexOf('compuerta-hoja-inferior')
  const hojas = { superior: codigo.slice(0, corte), inferior: codigo.slice(corte, codigo.indexOf('compuerta-simbolo', corte)) }
  for (const [nombre, bloque] of Object.entries(hojas)) {
    if (!/compuerta-metal/.test(etiquetaConMarca(codigo, `compuerta-hoja-${nombre}`))) problems.push(`compuerta-hoja-${nombre} no tiene compuerta-metal`)
    for (const [clase, minimo] of Object.entries(DECORACION_POR_HOJA)) {
      if (contarClase(bloque, clase) < minimo) problems.push(`la hoja ${nombre} tiene menos de ${minimo} piezas ${clase}`)
    }
  }
  for (const clase of Object.keys(DECORACION_POR_HOJA)) {
    if (contarClase(hojas.superior, clase) !== contarClase(hojas.inferior, clase)) problems.push(`las hojas no son simétricas en ${clase}`)
  }
  return problems
}

/** Problemas de un `CompuertaIntro.jsx`: composición, accesibilidad y CSP. */
function componenteProblems(source) {
  const problems = []
  const codigo = source.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/.*$/gm, '')
  const raiz = etiquetaConMarca(codigo, 'data-compuerta')
  for (const requerido of ['aria-hidden="true"', 'fixed inset-0', 'z-[70]']) {
    if (!raiz.includes(requerido)) problems.push(`la raíz no tiene ${requerido}`)
  }
  for (const hoja of ['compuerta-hoja-superior', 'compuerta-hoja-inferior']) {
    if (!/bg-eva-panel/.test(etiquetaConMarca(codigo, hoja))) problems.push(`${hoja} no tiene bg-eva-panel`)
  }
  const franjas = (codigo.match(/className="[^"]*\beva-stripes\b[^"]*"/g) ?? []).length
  if (franjas !== 4) problems.push(`hay ${franjas} franjas eva-stripes y tienen que ser 4 (dos tramos por hoja)`)
  if (!/compuerta-simbolo[^>]*>\s*<LogoEva variante="completo"/.test(codigo)) {
    problems.push('el glifo no es <LogoEva variante="completo" /> dentro de compuerta-simbolo')
  }
  if (codigo.indexOf('compuerta-simbolo') < codigo.indexOf('compuerta-hoja-inferior')) {
    problems.push('el glifo tiene que ir después de las dos hojas: si no, la hoja inferior le tapa la mitad de abajo')
  }
  if (/<svg/.test(codigo)) problems.push('dibuja un <svg> propio en vez de usar LogoEva')
  const desdeInferior = codigo.slice(Math.max(codigo.indexOf('compuerta-hoja-inferior'), 0))
  if (!/FACU/.test(desdeInferior) || !/CODE/.test(desdeInferior) || !/font-eva-display/.test(desdeInferior)) {
    problems.push('FACU y CODE con font-eva-display tienen que ir dentro de la hoja inferior')
  }
  problems.push(...decoracionComponenteProblems(codigo))
  const prohibidos = [
    [/<a[\s>]/, '<a'],
    [/<img/, '<img'],
    [/<button/, '<button'],
    [/tabIndex/, 'tabIndex'],
    [/\brole=/, 'role='],
    [/\bstyle=/, 'style='],
    [/dangerouslySetInnerHTML/, 'dangerouslySetInnerHTML'],
    [/#[0-9a-fA-F]{3,8}\b/, 'un color hex'],
  ]
  for (const [patron, nombre] of prohibidos) {
    if (patron.test(codigo)) problems.push(`usa ${nombre}`)
  }
  return problems
}

const COMPONENTE_EJEMPLO = `import LogoEva from './LogoEva'
export default function CompuertaIntro({ fase, onSaltar }) {
  return (
    <div aria-hidden="true" data-compuerta={fase} onClick={onSaltar} className="compuerta fixed inset-0 z-[70]">
      <div className="compuerta-hoja-superior compuerta-metal absolute inset-x-0 top-0 h-1/2 bg-eva-panel">
        <span className="eva-stripes compuerta-franja-izq" /><span className="eva-stripes compuerta-franja-der" />
        <span className="compuerta-placa" /><span className="compuerta-placa" />
        <span className="compuerta-labio" /><span className="compuerta-labio" />
        <span className="compuerta-nervio" /><span className="compuerta-nervio" />
      </div>
      <div className="compuerta-hoja-inferior compuerta-metal absolute inset-x-0 top-1/2 h-1/2 bg-eva-panel">
        <span className="eva-stripes compuerta-franja-izq" /><span className="eva-stripes compuerta-franja-der" />
        <span className="compuerta-placa" /><span className="compuerta-placa" />
        <span className="compuerta-labio" /><span className="compuerta-labio" />
        <span className="compuerta-nervio" /><span className="compuerta-nervio" />
        <p className="font-eva-display">FACU CODE</p>
      </div>
      <div className="absolute inset-0"><span className="compuerta-simbolo"><LogoEva variante="completo" className="h-28" /></span></div>
    </div>
  )
}`

test('CompuertaIntro.jsx: raíz decorativa fija, dos hojas, franjas, glifo único y texto en la hoja inferior', () => {
  assert.deepEqual(componenteProblems(read('src/components/CompuertaIntro.jsx')), [])
})

test('componenteProblems: acepta el componente de ejemplo correcto (triangulación)', () => {
  assert.deepEqual(componenteProblems(COMPONENTE_EJEMPLO), [])
})

test('componenteProblems: rechaza el glifo entre las hojas, donde la hoja inferior lo corta a la mitad (triangulación)', () => {
  const capa = `      <div className="absolute inset-0"><span className="compuerta-simbolo"><LogoEva variante="completo" className="h-28" /></span></div>
`
  const entreHojas = COMPONENTE_EJEMPLO.replace(capa, '').replace('      <div className="compuerta-hoja-inferior', capa + '      <div className="compuerta-hoja-inferior')
  assert.notEqual(entreHojas, COMPONENTE_EJEMPLO)
  assert.deepEqual(componenteProblems(entreHojas), [
    'el glifo tiene que ir después de las dos hojas: si no, la hoja inferior le tapa la mitad de abajo',
  ])
})

test('componenteProblems: rechaza tabIndex y style inline (triangulación)', () => {
  const conTabIndex = COMPONENTE_EJEMPLO.replace('onClick={onSaltar}', 'onClick={onSaltar} tabIndex={0}')
  assert.deepEqual(componenteProblems(conTabIndex), ['usa tabIndex'])
  const conStyle = COMPONENTE_EJEMPLO.replace('onClick={onSaltar}', 'onClick={onSaltar} style={{ opacity: 0 }}')
  assert.deepEqual(componenteProblems(conStyle), ['usa style='])
})

test('componenteProblems: rechaza elementos interactivos, hex, svg propio, raíz visible y franjas de menos (triangulación)', () => {
  assert.deepEqual(componenteProblems(COMPONENTE_EJEMPLO.replace('<p ', '<a href="#x" ')), ['usa <a'])
  assert.deepEqual(componenteProblems(COMPONENTE_EJEMPLO.replace('h-28"', 'h-28 text-[#ff0000]"')), ['usa un color hex'])
  assert.deepEqual(componenteProblems(COMPONENTE_EJEMPLO.replace('<LogoEva variante="completo" className="h-28" />', '<svg />')), [
    'el glifo no es <LogoEva variante="completo" /> dentro de compuerta-simbolo',
    'dibuja un <svg> propio en vez de usar LogoEva',
  ])
  assert.deepEqual(componenteProblems(COMPONENTE_EJEMPLO.replace('aria-hidden="true" ', '')), ['la raíz no tiene aria-hidden="true"'])
  const sinPanel = COMPONENTE_EJEMPLO.replace('top-1/2 h-1/2 bg-eva-panel', 'top-1/2 h-1/2')
  assert.deepEqual(componenteProblems(sinPanel), ['compuerta-hoja-inferior no tiene bg-eva-panel'])
  const sinFranja = COMPONENTE_EJEMPLO.replace('<span className="eva-stripes compuerta-franja-der" />', '')
  assert.deepEqual(componenteProblems(sinFranja), ['hay 3 franjas eva-stripes y tienen que ser 4 (dos tramos por hoja)'])
})

test('componenteProblems: rechaza hojas sin metal, sin piezas o asimétricas, e imágenes (triangulación, design D14)', () => {
  const sinMetal = COMPONENTE_EJEMPLO.replace('compuerta-hoja-superior compuerta-metal', 'compuerta-hoja-superior')
  assert.deepEqual(componenteProblems(sinMetal), ['compuerta-hoja-superior no tiene compuerta-metal'])
  const dosPlacas = '<span className="compuerta-placa" /><span className="compuerta-placa" />\n        <span className="compuerta-labio" />'
  const unaPlaca = COMPONENTE_EJEMPLO.replace(dosPlacas, '<span className="compuerta-placa" />\n        <span className="compuerta-labio" />')
  assert.notEqual(unaPlaca, COMPONENTE_EJEMPLO)
  assert.deepEqual(componenteProblems(unaPlaca), [
    'la hoja superior tiene menos de 2 piezas compuerta-placa',
    'las hojas no son simétricas en compuerta-placa',
  ])
  const nervios = '<span className="compuerta-nervio" /><span className="compuerta-nervio" />\n      </div>\n      <div className="compuerta-hoja-inferior'
  const nervioDeMas = COMPONENTE_EJEMPLO.replace(nervios, nervios.replace('/>\n', '/><span className="compuerta-nervio" />\n'))
  assert.notEqual(nervioDeMas, COMPONENTE_EJEMPLO)
  assert.deepEqual(componenteProblems(nervioDeMas), ['las hojas no son simétricas en compuerta-nervio'])
  assert.deepEqual(componenteProblems(COMPONENTE_EJEMPLO.replace('<p ', '<img src="x.png" /><p ')), ['usa <img'])
})

test('contarClase: no confunde compuerta-placa con compuerta-placa-texto (triangulación)', () => {
  assert.equal(contarClase('compuerta-placa compuerta-placa-texto "compuerta-placa"', 'compuerta-placa'), 2)
  assert.equal(contarClase('a compuerta-placa-texto', 'compuerta-placa'), 0)
})

// --- 4.2 Guard del CSS (design D6, D8, D10) ------------------------------------

const SIN_MOVIMIENTO_REDUCIDO = '@media (prefers-reduced-motion: no-preference)'
const KEYFRAMES = {
  'compuerta-junta-izq': 'clip-path',
  'compuerta-junta-der': 'clip-path',
  'compuerta-retiro': 'clip-path',
  'compuerta-hoja-arriba': 'transform',
  'compuerta-hoja-abajo': 'transform',
}
const SELECTOR_RETIRO = '.compuerta[data-compuerta="retiro"] .compuerta-simbolo, .compuerta[data-compuerta="apertura"] .compuerta-simbolo'
const SELECTOR_HOJA = (hoja) => `.compuerta[data-compuerta="apertura"] .compuerta-hoja-${hoja}`
const propiedades = (cuerpo) => [...new Set([...cuerpo.matchAll(/([a-z-]+)\s*:/g)].map((m) => m[1]))]
const animacionDe = (cuerpo) => /animation:\s*([^;]+)/.exec(cuerpo)?.[1].trim() ?? ''
const duracionMs = (animacion) => {
  const tiempo = /(\d+(?:\.\d+)?)(ms|s)\b/.exec(animacion)
  return tiempo ? Number(tiempo[1]) * (tiempo[2] === 's' ? 1000 : 1) : Number.NaN
}

/** Problemas del CSS de la compuerta frente a los tiempos del módulo puro. */
function cssProblems(css, tiempos = TIEMPOS_COMPUERTA) {
  const problems = []
  const dentro = (selector) => ruleBody(css, selector, { within: SIN_MOVIMIENTO_REDUCIDO })
  const bloqueo = ruleBody(css, 'html.compuerta-cerrada')
  // El canal de la barra se conserva con `overflow-y: scroll` y no con `scrollbar-gutter: stable`: el gutter reserva
  // el canal aunque la barra sea oculta o superpuesta, y al liberar el contenido se ensancharía (CLS en 375).
  if (!bloqueo || !/overflow-x:\s*hidden/.test(bloqueo)) problems.push('html.compuerta-cerrada no tiene overflow-x: hidden')
  if (!bloqueo || !/overflow-y:\s*scroll/.test(bloqueo)) problems.push('html.compuerta-cerrada no tiene overflow-y: scroll')
  if (bloqueo && /scrollbar-gutter/.test(bloqueo)) problems.push('html.compuerta-cerrada usa scrollbar-gutter')
  // `overflow: hidden` en <html> no impide el desplazamiento programático (scrollBy, scrollIntoView): el cuerpo se
  // recorta al alto de la ventana con `overflow: clip` y no hay nada que desplazar.
  const cuerpo = ruleBody(css, 'html.compuerta-cerrada body')
  if (!cuerpo || !/overflow:\s*clip/.test(cuerpo)) problems.push('html.compuerta-cerrada body no tiene overflow: clip')
  if (!cuerpo || !/height:\s*100svh/.test(cuerpo)) problems.push('html.compuerta-cerrada body no tiene height: 100svh')
  for (const [nombre, esperada] of Object.entries(KEYFRAMES)) {
    const regla = `@keyframes ${nombre}`
    if (ruleBody(css, regla) !== null) problems.push(`${regla} está fuera de no-preference`)
    const cuerpo = dentro(regla)
    if (cuerpo === null) problems.push(`falta ${regla} dentro de no-preference`)
    else if (propiedades(cuerpo).join() !== esperada) problems.push(`${regla} anima ${propiedades(cuerpo).join()} y solo puede animar ${esperada}`)
  }
  const reglas = [
    ['.compuerta-franja-izq', tiempos.junta, 'compuerta-junta-izq'],
    ['.compuerta-franja-der', tiempos.junta, 'compuerta-junta-der'],
    [SELECTOR_RETIRO, tiempos.retiro, 'compuerta-retiro'],
    [SELECTOR_HOJA('superior'), tiempos.apertura, 'compuerta-hoja-arriba'],
    [SELECTOR_HOJA('inferior'), tiempos.apertura, 'compuerta-hoja-abajo'],
  ]
  for (const [selector, esperado, keyframes] of reglas) {
    if (ruleBody(css, selector) !== null) problems.push(`${selector} está fuera de no-preference`)
    const cuerpo = dentro(selector)
    if (cuerpo === null) {
      problems.push(`falta la regla ${selector} dentro de no-preference`)
      continue
    }
    const animacion = animacionDe(cuerpo)
    if (!animacion.startsWith(keyframes)) problems.push(`${selector} no usa ${keyframes}`)
    if (duracionMs(animacion) !== esperado) problems.push(`${selector} dura ${duracionMs(animacion)} ms y TIEMPOS_COMPUERTA dice ${esperado} ms`)
    if (/\binfinite\b|animation-iteration-count|\s[2-9]\d*\s*$/.test(animacion)) problems.push(`${selector} repite la animación`)
  }
  return problems
}

const CSS_REAL = read('src/index.css')

test('index.css: bloqueo de desplazamiento, keyframes y reglas de la compuerta solo con movimiento permitido', () => {
  assert.deepEqual(cssProblems(CSS_REAL), [])
})

test('cssProblems: rechaza una apertura de 600 ms desincronizada de TIEMPOS_COMPUERTA (triangulación)', () => {
  const desincronizado = CSS_REAL.replace(/(compuerta-hoja-arriba) 500ms/, '$1 600ms')
  assert.notEqual(desincronizado, CSS_REAL)
  assert.deepEqual(cssProblems(desincronizado), [`${SELECTOR_HOJA('superior')} dura 600 ms y TIEMPOS_COMPUERTA dice 500 ms`])
})

test('cssProblems: sigue la constante y no el valor del CSS (triangulación con otros tiempos)', () => {
  const alternativos = { ...TIEMPOS_COMPUERTA, apertura: 400 }
  assert.deepEqual(cssProblems(CSS_REAL, alternativos), [
    `${SELECTOR_HOJA('superior')} dura 500 ms y TIEMPOS_COMPUERTA dice 400 ms`,
    `${SELECTOR_HOJA('inferior')} dura 500 ms y TIEMPOS_COMPUERTA dice 400 ms`,
  ])
})

test('cssProblems: rechaza animation infinite, un bloqueo sin overflow-y: scroll y el scrollbar-gutter (triangulación)', () => {
  const infinito = CSS_REAL.replace(/(compuerta-retiro 200ms steps\(4, end\)) forwards/, '$1 infinite')
  assert.notEqual(infinito, CSS_REAL)
  assert.deepEqual(cssProblems(infinito), [`${SELECTOR_RETIRO} repite la animación`])
  const sinScroll = CSS_REAL.replace(/(html\.compuerta-cerrada \{[^}]*?)overflow-y:\s*scroll;/, '$1overflow-y: hidden;')
  assert.notEqual(sinScroll, CSS_REAL)
  assert.deepEqual(cssProblems(sinScroll), ['html.compuerta-cerrada no tiene overflow-y: scroll'])
  const conGutter = CSS_REAL.replace(/(html\.compuerta-cerrada \{[^}]*?)overflow-y:\s*scroll;/, '$1overflow-y: scroll; scrollbar-gutter: stable;')
  assert.notEqual(conGutter, CSS_REAL)
  assert.deepEqual(cssProblems(conGutter), ['html.compuerta-cerrada usa scrollbar-gutter'])
})

test('cssProblems: rechaza un bloqueo que solo oculta el desbordamiento de html y no recorta el cuerpo (triangulación)', () => {
  const sinClip = CSS_REAL.replace(/(html\.compuerta-cerrada body \{[^}]*?)overflow: clip;/, '$1overflow: visible;')
  assert.notEqual(sinClip, CSS_REAL)
  assert.deepEqual(cssProblems(sinClip), ['html.compuerta-cerrada body no tiene overflow: clip'])
  const sinAlto = CSS_REAL.replace(/(html\.compuerta-cerrada body \{[^}]*?)height: 100svh;/, '$1')
  assert.notEqual(sinAlto, CSS_REAL)
  assert.deepEqual(cssProblems(sinAlto), ['html.compuerta-cerrada body no tiene height: 100svh'])
})

test('cssProblems: rechaza un keyframe fuera de no-preference y uno que anima otra propiedad (triangulación)', () => {
  const fuera = `${CSS_REAL}\n@keyframes compuerta-retiro { to { clip-path: inset(0) } }\n`
  assert.ok(cssProblems(fuera).includes('@keyframes compuerta-retiro está fuera de no-preference'))
  const conOpacidad = CSS_REAL.replace(/(@keyframes compuerta-hoja-arriba \{[^}]*\})/, '$1 to { opacity: 0 }')
  assert.notEqual(conOpacidad, CSS_REAL)
  assert.ok(cssProblems(conOpacidad).some((p) => p.startsWith('@keyframes compuerta-hoja-arriba anima')))
})

// --- 4.3 Guard del CSS de la decoración metálica (design D14) --------------------------------

const PIEZAS_CSS = ['.compuerta-metal', '.compuerta-placa', '.compuerta-placa-texto', '.compuerta-labio', '.compuerta-nervio']

/** Problemas de la decoración: superficie metálica, relieves biselados y nada pesado (sin imágenes, filtros ni dientes). */
function decoracionCssProblems(css) {
  const problems = []
  const seccion = css.slice(css.indexOf('/* Compuerta de entrada')).replace(/\/\*[\s\S]*?\*\//g, '')
  if (!seccion.trim()) return ['falta la sección de la compuerta']
  const cuerpos = Object.fromEntries(PIEZAS_CSS.map((selector) => [selector, ruleBody(seccion, selector)]))
  for (const [selector, cuerpo] of Object.entries(cuerpos)) if (cuerpo === null) problems.push(`falta la regla ${selector}`)
  if (cuerpos['.compuerta-metal'] && !/repeating-linear-gradient\(\s*(180deg|0deg|to bottom)/.test(cuerpos['.compuerta-metal'])) {
    problems.push('.compuerta-metal no tiene el cepillado (repeating-linear-gradient horizontal)')
  }
  for (const selector of ['.compuerta-placa', '.compuerta-placa-texto', '.compuerta-labio', '.compuerta-nervio']) {
    const cuerpo = cuerpos[selector]
    if (cuerpo && !/box-shadow:[^;]*\binset\b/.test(cuerpo)) problems.push(`${selector} no tiene bisel (box-shadow inset)`)
  }
  if (!/--compuerta-remache:[^;]*radial-gradient/.test(seccion)) problems.push('falta --compuerta-remache con radial-gradient')
  const prohibidos = [
    [/backdrop-filter/, 'backdrop-filter'],
    [/(^|[;{\s])filter\s*:/, 'filter'],
    [/blur\(/, 'blur()'],
    [/url\(/, 'url() (imágenes o SVG)'],
    [/polygon\(/, 'polygon() (dientes de sierra)'],
    [/@import/, '@import'],
    [/#[0-9a-fA-F]{3,8}\b/, 'un color hex'],
  ]
  for (const [patron, nombre] of prohibidos) if (patron.test(seccion)) problems.push(`usa ${nombre}`)
  return problems
}

test('index.css: la decoración metálica tiene superficie cepillada, relieves biselados y remaches, sin nada pesado', () => {
  assert.deepEqual(decoracionCssProblems(CSS_REAL), [])
})

test('decoracionCssProblems: rechaza filtros, imágenes, dientes de sierra, hex y piezas faltantes (triangulación)', () => {
  const con = (extra) => `${CSS_REAL}\n.compuerta-extra { ${extra} }\n`
  assert.deepEqual(decoracionCssProblems(con('backdrop-filter: blur(4px);')), ['usa backdrop-filter', 'usa blur()'])
  assert.deepEqual(decoracionCssProblems(con('filter: contrast(1.2);')), ['usa filter'])
  assert.deepEqual(decoracionCssProblems(con('background: url(x.png);')), ['usa url() (imágenes o SVG)'])
  assert.deepEqual(decoracionCssProblems(con('clip-path: polygon(0 0, 50% 100%, 100% 0);')), ['usa polygon() (dientes de sierra)'])
  assert.deepEqual(decoracionCssProblems(con('color: #ff0000;')), ['usa un color hex'])
  assert.deepEqual(decoracionCssProblems(CSS_REAL.replace('.compuerta-labio {', '.compuerta-otra {')), ['falta la regla .compuerta-labio'])
  assert.deepEqual(decoracionCssProblems(CSS_REAL.replace(/repeating-linear-gradient\(\s*180deg/g, 'linear-gradient(180deg')), [
    '.compuerta-metal no tiene el cepillado (repeating-linear-gradient horizontal)',
  ])
  assert.deepEqual(decoracionCssProblems(CSS_REAL.replace('--compuerta-remache:', '--otra:')), ['falta --compuerta-remache con radial-gradient'])
})

test('CompuertaIntro.jsx: las demoras del barrido coinciden con TIEMPOS_COMPUERTA y eva-boot dura glifo y texto', () => {
  const source = read('src/components/CompuertaIntro.jsx')
  const demoras = [...source.matchAll(/\[animation-delay:(\d+)ms\]/g)].map((m) => Number(m[1])).sort((a, b) => a - b)
  assert.deepEqual(demoras, [TIEMPOS_COMPUERTA.glifoInicio, TIEMPOS_COMPUERTA.textoInicio])
  assert.equal(TIEMPOS_COMPUERTA.glifo, 360)
  assert.equal(TIEMPOS_COMPUERTA.texto, 360)
  assert.match(tailwindConfig.theme.extend.animation['eva-boot'], /^evaBoot 0\.36s /)
})

// --- 5.1 Guard estático del hook, Home y la CSP (design D1, D2, D3, D9, D10) --------

/** Problemas del hook `useCompuerta.js`: reloj, bloqueo, gestos de salto y decisión por carga. */
function hookCompuertaProblems(source) {
  const problems = []
  const codigo = source.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/.*$/gm, '')
  if (!/requestAnimationFrame\(/.test(codigo) || !/cancelAnimationFrame\(/.test(codigo)) {
    problems.push('el reloj no usa requestAnimationFrame con cancelAnimationFrame en el cleanup')
  }
  if (!/useLayoutEffect\(/.test(codigo) || !/document\.documentElement\.classList\.add\(\s*['"]compuerta-cerrada['"]/.test(codigo)) {
    problems.push('no agrega compuerta-cerrada a document.documentElement en un useLayoutEffect')
  }
  if (!/document\.documentElement\.classList\.remove\(\s*['"]compuerta-cerrada['"]/.test(codigo)) {
    problems.push('no quita compuerta-cerrada en el cleanup')
  }
  for (const evento of ['keydown', 'wheel', 'touchmove']) {
    if (!new RegExp(String.raw`window\.addEventListener\(\s*['"]${evento}['"]`).test(codigo)) problems.push(`no escucha ${evento} en window`)
    if (!new RegExp(String.raw`window\.removeEventListener\(\s*['"]${evento}['"]`).test(codigo)) problems.push(`no remueve ${evento} de window`)
  }
  if (!/addEventListener\(\s*['"]change['"]/.test(codigo) || !/removeEventListener\(\s*['"]change['"]/.test(codigo)) {
    problems.push('no escucha y remueve el change de matchMedia')
  }
  for (const evento of ['pointerdown', 'touchstart', 'mousedown']) {
    if (new RegExp(`['"]${evento}['"]`).test(codigo)) problems.push(`escucha ${evento} (provoca clic fantasma)`)
  }
  if (/document\.addEventListener\(\s*['"]keydown['"]/.test(codigo)) problems.push('escucha keydown en document y no en window')
  if (!/^let\s+decisionDeEstaCarga\b/m.test(codigo)) problems.push('falta la variable de módulo decisionDeEstaCarga')
  if (!/^const\s+\w*RUTA_DE_ENTRADA\w*\s*=.*pathname/m.test(codigo)) problems.push('no captura location.pathname al evaluar el módulo')
  if (!/teclaDesplaza\(/.test(codigo) || !/preventDefault\(\)/.test(codigo)) {
    problems.push('la tecla que salta puede desplazar la página (falta preventDefault con teclaDesplaza)')
  }
  if (/setInterval|setTimeout|\bstyle\b/.test(codigo)) problems.push('usa timers o style')
  return problems
}

const HOOK_COMPUERTA_EJEMPLO = `import { useLayoutEffect } from 'react'
const RUTA_DE_ENTRADA = globalThis.location?.pathname ?? '/'
let decisionDeEstaCarga = null
export function useCompuerta() {
  const alTeclear = (e) => { if (teclaDesplaza(e.key)) e.preventDefault() }
  useLayoutEffect(() => {
    document.documentElement.classList.add('compuerta-cerrada')
    return () => document.documentElement.classList.remove('compuerta-cerrada')
  }, [])
  useEffect(() => {
    let raf = requestAnimationFrame(f)
    window.addEventListener('keydown', f); window.addEventListener('wheel', f, { passive: true }); window.addEventListener('touchmove', f, { passive: true })
    mq.addEventListener('change', f)
    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('keydown', f); window.removeEventListener('wheel', f); window.removeEventListener('touchmove', f)
      mq.removeEventListener('change', f)
    }
  }, [])
}`

test('useCompuerta.js: reloj con rAF, bloqueo en useLayoutEffect, gestos en window y decisión por carga', () => {
  assert.deepEqual(hookCompuertaProblems(read('src/hooks/useCompuerta.js')), [])
})

test('hookCompuertaProblems: acepta el hook de ejemplo correcto (triangulación)', () => {
  assert.deepEqual(hookCompuertaProblems(HOOK_COMPUERTA_EJEMPLO), [])
})

test('hookCompuertaProblems: rechaza un hook que salta en touchstart (clic fantasma) (triangulación)', () => {
  const conTouchstart = HOOK_COMPUERTA_EJEMPLO.replace("window.addEventListener('touchmove', f, { passive: true })", "window.addEventListener('touchstart', f)")
  assert.deepEqual(hookCompuertaProblems(conTouchstart), ['no escucha touchmove en window', 'escucha touchstart (provoca clic fantasma)'])
  const conPointerdown = HOOK_COMPUERTA_EJEMPLO.replace("window.addEventListener('wheel', f, { passive: true })", "window.addEventListener('pointerdown', f)")
  assert.deepEqual(hookCompuertaProblems(conPointerdown), ['no escucha wheel en window', 'escucha pointerdown (provoca clic fantasma)'])
})

test('hookCompuertaProblems: rechaza un keydown en document, timers, style y la falta de cleanup del bloqueo (triangulación)', () => {
  const enDocument = HOOK_COMPUERTA_EJEMPLO.replace("window.addEventListener('keydown', f);", "document.addEventListener('keydown', f);")
  assert.deepEqual(hookCompuertaProblems(enDocument), ['no escucha keydown en window', 'escucha keydown en document y no en window'])
  assert.deepEqual(hookCompuertaProblems(`${HOOK_COMPUERTA_EJEMPLO}\nsetTimeout(f, 10)`), ['usa timers o style'])
  const sinQuitar = HOOK_COMPUERTA_EJEMPLO.replace("return () => document.documentElement.classList.remove('compuerta-cerrada')", 'return undefined')
  assert.deepEqual(hookCompuertaProblems(sinQuitar), ['no quita compuerta-cerrada en el cleanup'])
  const sinRuta = HOOK_COMPUERTA_EJEMPLO.replace("globalThis.location?.pathname ?? '/'", "'/'")
  assert.deepEqual(hookCompuertaProblems(sinRuta), ['no captura location.pathname al evaluar el módulo'])
})

test('CompuertaIntro.jsx: salta con onClick y no con eventos de puntero o toque', () => {
  const source = read('src/components/CompuertaIntro.jsx')
  assert.match(source, /onClick=\{saltar\}/)
  assert.doesNotMatch(source, /onPointerDown|onTouchStart|onMouseDown/)
})

test('Home.jsx: el proveedor envuelve la barra y main, y renderiza la compuerta una sola vez', () => {
  const home = read('src/pages/Home.jsx').replace(/\r\n/g, '\n')
  const proveedor = /<CompuertaProvider>([\s\S]*)<\/CompuertaProvider>/.exec(home)
  assert.ok(proveedor, 'falta <CompuertaProvider>')
  assert.match(proveedor[1], /<SiteNav \/>/)
  assert.match(proveedor[1], /<main[\s\S]*<\/main>/)
  assert.equal((home.match(/<CompuertaIntro \/>/g) ?? []).length, 1)
  assert.equal((home.match(/<CompuertaProvider>/g) ?? []).length, 1)
})

test('Hero.jsx: recibe el modo de la compuerta y se lo pasa al hook de escritura', () => {
  const hero = read('src/components/Hero.jsx')
  assert.match(hero, /useModoHero\(\)/)
  assert.match(hero, /useEscrituraHero\(LINEA, seccionRef, modo\)/)
})

test('index.html no contiene la compuerta ni scripts inline', () => {
  const html = read('index.html')
  assert.doesNotMatch(html, /compuerta/i)
  const scripts = [...html.matchAll(/<script\b([^>]*)>/gi)]
  for (const [, atributos] of scripts) assert.match(atributos, /\bsrc=/, `script inline: <script${atributos}>`)
})

test('vercel.json conserva script-src y style-src en self, sin unsafe-inline', () => {
  const { headers } = JSON.parse(read('vercel.json'))
  const csp = headers.flatMap((regla) => regla.headers).find((cabecera) => cabecera.key === 'Content-Security-Policy').value
  assert.match(csp, /script-src 'self'(;|$)/)
  assert.match(csp, /style-src 'self'(;|$)/)
  assert.doesNotMatch(csp, /unsafe-inline|unsafe-eval/)
})

test('package.json no suma dependencias para la compuerta', () => {
  const { dependencies, devDependencies } = JSON.parse(read('package.json'))
  assert.deepEqual(Object.keys(dependencies).sort(), [
    '@fontsource-variable/jetbrains-mono',
    '@fontsource-variable/noto-serif-display',
    '@react-pdf/renderer',
    'lucide-react',
    'react',
    'react-dom',
    'react-router-dom',
  ])
  assert.equal(Object.keys(devDependencies).length, 11)
})

// --- Teclas que desplazan (la tecla que salta no puede mover la página) -----------

test('teclaDesplaza: Espacio, RePág, AvPág, flechas verticales, Inicio y Fin desplazan', () => {
  for (const tecla of [' ', 'Spacebar', 'PageDown', 'PageUp', 'ArrowDown', 'ArrowUp', 'Home', 'End']) {
    assert.equal(teclaDesplaza(tecla), true, JSON.stringify(tecla))
  }
})

test('teclaDesplaza: Tab, Enter, Escape, letras, flechas horizontales y valores no válidos no desplazan', () => {
  for (const tecla of ['Tab', 'Enter', 'Escape', 'a', 'ArrowLeft', 'ArrowRight', 'Shift', '', undefined, null, 32]) {
    assert.equal(teclaDesplaza(tecla), false, JSON.stringify(tecla))
  }
})

test('hookCompuertaProblems: rechaza un hook cuya tecla de salto puede desplazar la página (triangulación)', () => {
  const sinPrevenir = HOOK_COMPUERTA_EJEMPLO.replace('if (teclaDesplaza(e.key)) e.preventDefault()', 'void e')
  assert.deepEqual(hookCompuertaProblems(sinPrevenir), ['la tecla que salta puede desplazar la página (falta preventDefault con teclaDesplaza)'])
})
