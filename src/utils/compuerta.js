/**
 * Lógica pura de la compuerta de entrada (change `compuerta-intro`).
 * Sin DOM ni React: se testea con `node --test`.
 */
import { resolveHashTarget } from './hashTarget.js'

/** Tope de duración de toda la secuencia (spec "Secuencia de apertura"). */
export const DURACION_MAXIMA = 2200

/**
 * Duraciones (ms) de la intro. Las del CSS de `index.css` las reflejan y un guard las compara.
 * - `junta`, `glifo` y `texto` corren en paralelo escalonados (el glifo arranca en `glifoInicio`, el texto en
 *   `textoInicio`) y juntos forman la fase `armado`.
 * - `lectura` es una pausa quieta; `retiro` recoge el glifo hacia la junta; `apertura` separa las hojas.
 */
export const TIEMPOS_COMPUERTA = Object.freeze({
  junta: 300,
  glifoInicio: 200,
  glifo: 360,
  textoInicio: 480,
  texto: 360,
  lectura: 460,
  retiro: 200,
  apertura: 500,
})

/** Fases en orden. `abierta` es el estado final: la compuerta ya no está en pantalla. */
export const FASES_COMPUERTA = Object.freeze(['armado', 'lectura', 'retiro', 'apertura', 'abierta'])

/** Fases con la compuerta cerrada: la página no se desplaza (spec "Desplazamiento bloqueado"). */
const FASES_CERRADAS = Object.freeze(['armado', 'lectura', 'retiro'])

/** Clave y valor del flag de sesión (design D4). */
export const CLAVE_SESION = 'facucode.compuerta'
export const VALOR_SESION = 'vista'

/**
 * @typedef {{ inicio: number, fin: number }} Tramo
 * @typedef {{ armado: Tramo, lectura: Tramo, retiro: Tramo, apertura: Tramo, total: number }} LineaCompuerta
 */

/**
 * Arma la línea de tiempo y valida los tiempos.
 * @param {typeof TIEMPOS_COMPUERTA} [tiempos]
 * @returns {LineaCompuerta}
 */
export function crearLineaCompuerta(tiempos = TIEMPOS_COMPUERTA) {
  for (const clave of Object.keys(TIEMPOS_COMPUERTA)) {
    const valor = tiempos[clave]
    if (typeof valor !== 'number' || !Number.isFinite(valor) || valor < 0) {
      throw new RangeError(`Tiempo de compuerta inválido: "${clave}" debe ser un número ≥ 0 (los tramos se solaparían), recibió ${String(valor)}`)
    }
  }
  const finArmado = Math.max(tiempos.junta, tiempos.glifoInicio + tiempos.glifo, tiempos.textoInicio + tiempos.texto)
  const finLectura = finArmado + tiempos.lectura
  const finRetiro = finLectura + tiempos.retiro
  const total = finRetiro + tiempos.apertura
  if (total > DURACION_MAXIMA) {
    throw new RangeError(`La compuerta dura ${total} ms y el máximo es ${DURACION_MAXIMA} ms`)
  }
  return {
    armado: { inicio: 0, fin: finArmado },
    lectura: { inicio: finArmado, fin: finLectura },
    retiro: { inicio: finLectura, fin: finRetiro },
    apertura: { inicio: finRetiro, fin: total },
    total,
  }
}

const LINEA_POR_DEFECTO = crearLineaCompuerta()

/**
 * Fase de la compuerta en el instante `t`.
 * @param {number} t ms desde el primer cuadro
 * @param {LineaCompuerta} [linea]
 * @returns {'armado'|'lectura'|'retiro'|'apertura'|'abierta'}
 */
export function faseCompuerta(t, linea = LINEA_POR_DEFECTO) {
  if (t >= linea.total) return 'abierta'
  if (t >= linea.apertura.inicio) return 'apertura'
  if (t >= linea.retiro.inicio) return 'retiro'
  if (t >= linea.lectura.inicio) return 'lectura'
  return 'armado'
}

/**
 * @param {{ reducedMotion: boolean, rutaDeEntrada: string, hash: string, sesion: { disponible: boolean, vista: boolean } }} entrada
 * @returns {boolean}
 */
export function debeMostrarCompuerta({ reducedMotion, rutaDeEntrada, hash, sesion }) {
  return !reducedMotion && rutaDeEntrada === '/' && resolveHashTarget(hash) === null && sesion.disponible && !sesion.vista
}

/**
 * Almacenamiento de sesión del navegador, o `null` si el *getter* lanza (cookies bloqueadas).
 * @param {{ sessionStorage?: Storage }} [global]
 * @returns {Storage|null}
 */
export function sesionDelNavegador(global = globalThis) {
  try {
    return global.sessionStorage ?? null
  } catch {
    return null
  }
}

/**
 * @param {Pick<Storage, 'getItem'>|null|undefined} storage
 * @returns {{ disponible: boolean, vista: boolean }}
 */
export function leerSesion(storage) {
  try {
    return { disponible: true, vista: storage.getItem(CLAVE_SESION) === VALOR_SESION }
  } catch {
    return { disponible: false, vista: false }
  }
}

/**
 * @param {Pick<Storage, 'setItem'>|null|undefined} storage
 * @returns {boolean} `false` si no se pudo escribir (nunca lanza)
 */
export function marcarSesion(storage) {
  try {
    storage.setItem(CLAVE_SESION, VALOR_SESION)
    return true
  } catch {
    return false
  }
}

/**
 * Decide si se muestra y, si es que sí, marca la sesión antes del primer cuadro (una recarga a mitad de la
 * intro no la repite). Si marcar falla no hay compuerta: sin memoria se repetiría en cada recarga.
 * @param {{ reducedMotion: boolean, rutaDeEntrada: string, hash: string }} entrada
 * @param {Storage|null|undefined} storage
 * @returns {boolean}
 */
export function decidirCompuerta(entrada, storage) {
  if (!debeMostrarCompuerta({ ...entrada, sesion: leerSesion(storage) })) return false
  return marcarSesion(storage)
}

/**
 * Reductor de la fase. `cuadro` avanza según el reloj y nunca retrocede; `saltar` y `movimiento-reducido`
 * pasan a `abierta`. Desde `abierta`, o con una acción desconocida, devuelve el mismo estado.
 * @param {{ fase: string }} estado
 * @param {{ tipo: string, t?: number, linea?: LineaCompuerta }} accion
 * @returns {{ fase: string }}
 */
export function transicionCompuerta(estado, accion) {
  if (estado.fase === 'abierta') return estado
  if (accion.tipo === 'saltar' || accion.tipo === 'movimiento-reducido') return { fase: 'abierta' }
  if (accion.tipo !== 'cuadro') return estado
  const siguiente = faseCompuerta(accion.t, accion.linea)
  return FASES_COMPUERTA.indexOf(siguiente) > FASES_COMPUERTA.indexOf(estado.fase) ? { fase: siguiente } : estado
}

/**
 * Modo del hero según la compuerta (design D5): `lista` (estado final tapado), `en-espera` (todo reservado y
 * transparente durante la apertura) o `libre` (la escritura de siempre).
 * @param {string|null|undefined} fase `null`/`undefined` si no hay compuerta
 * @returns {'lista'|'en-espera'|'libre'}
 */
export function estadoHeroSegunCompuerta(fase) {
  if (FASES_CERRADAS.includes(fase)) return 'lista'
  return fase === 'apertura' ? 'en-espera' : 'libre'
}

/**
 * @param {string|null|undefined} fase
 * @returns {boolean}
 */
export function bloqueaDesplazamiento(fase) {
  return FASES_CERRADAS.includes(fase)
}

/** Teclas cuya acción por defecto desplaza la página en vertical. */
const TECLAS_DE_DESPLAZAMIENTO = Object.freeze([' ', 'Spacebar', 'PageDown', 'PageUp', 'ArrowDown', 'ArrowUp', 'Home', 'End'])

/**
 * ¿La tecla desplazaría la página? La que salta la compuerta no puede hacerlo: llega con el bloqueo puesto,
 * pero el bloqueo se quita antes de que el navegador ejecute su acción por defecto.
 * @param {unknown} tecla `KeyboardEvent.key`
 * @returns {boolean}
 */
export function teclaDesplaza(tecla) {
  return typeof tecla === 'string' && TECLAS_DE_DESPLAZAMIENTO.includes(tecla)
}
