/**
 * Burbujas del tanque de LCL: pool fijo y determinista (PRNG con semilla
 * inyectable), sin DOM ni asignaciones por cuadro. La altura `y` es la fracción
 * de la columna de líquido (0 = fondo, 1 = superficie), así la burbuja sigue la
 * altura de la ola en su x sin conocer la simulación.
 */

/** Cantidad de burbujas del pool. */
export const N_BURBUJAS = 10
/** Vaivén lateral máximo (fracción del ancho del tanque). */
export const WOBBLE = 0.012
const DT_MAX = 0.05
const VEL_MIN = 0.08 // fracción de la columna por segundo
const VEL_MAX = 0.2
const R_MIN = 1.5 // px CSS
const R_MAX = 4
const FV_MIN = 1
const FV_MAX = 2.5 // rad/s del vaivén

/** PRNG mulberry32: determinista por semilla, valores en [0, 1). */
export function crearRng(semilla) {
  let a = semilla >>> 0
  return () => {
    a = (a + 0x6d2b79f5) >>> 0
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

const entre = (rng, min, max) => min + rng() * (max - min)

function sortear(b, i, rng) {
  b.x[i] = rng()
  b.r[i] = entre(rng, R_MIN, R_MAX)
  b.vel[i] = entre(rng, VEL_MIN, VEL_MAX)
  b.fv[i] = entre(rng, FV_MIN, FV_MAX)
  b.fase[i] = rng() * 2 * Math.PI
}

/** Crea el pool de `n` burbujas repartidas en altura. */
export function crearBurbujas(n, rng) {
  const b = {
    n,
    rng,
    x: new Float64Array(n),
    y: new Float64Array(n),
    r: new Float64Array(n),
    vel: new Float64Array(n),
    fv: new Float64Array(n),
    fase: new Float64Array(n),
  }
  for (let i = 0; i < n; i++) {
    sortear(b, i, rng)
    b.y[i] = rng() * 0.95
  }
  return b
}

/** Hace subir las burbujas; las que llegan a la superficie renacen abajo (mismo pool). */
export function pasoBurbujas(b, dt) {
  if (!Number.isFinite(dt) || dt <= 0) return
  const d = Math.min(dt, DT_MAX)
  for (let i = 0; i < b.n; i++) {
    b.y[i] += b.vel[i] * d
    b.fase[i] += b.fv[i] * d
    if (b.y[i] >= 1) {
      sortear(b, i, b.rng)
      b.y[i] = 0
    }
  }
}

/** Posición horizontal (0..1) con vaivén, siempre dentro del tanque. */
export function xBurbuja(b, i) {
  return Math.min(1, Math.max(0, b.x[i] + WOBBLE * Math.sin(b.fase[i])))
}
