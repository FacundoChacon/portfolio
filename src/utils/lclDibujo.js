/**
 * Dibujo del tanque de LCL sobre un contexto 2D. Sin DOM propio: recibe el
 * contexto, las capas de `capasDeSuperficie` y los colores ya resueltos.
 */

import { xBurbuja } from './lclBurbujas.js'
import { NIVEL_LLENADO } from './lcl.js'

const NIVEL_REPOSO = 1 - NIVEL_LLENADO // superficie en calma, medida desde arriba (el líquido llena 2/3 del panel)
// Líquido translúcido: se ve a través, más denso hacia el fondo.
const ALFA_CAPAS = [1, 0.26, 0.18]
const ALFA_SUPERFICIE = 0.38
const ALFA_FONDO = 0.58

/** "#rrggbb" + alfa → "rgb(r g b / a)". */
export function rgba(hex, alfa) {
  const n = parseInt(hex.slice(1), 16)
  return `rgb(${(n >> 16) & 255} ${(n >> 8) & 255} ${n & 255} / ${alfa})`
}

/** Traza la curva de una capa con curvas cuadráticas entre puntos medios (sin aristas). */
function trazarSuperficie(ctx, capa, ancho, alto) {
  const n = capa.length
  const y = (i) => alto * (NIVEL_REPOSO - capa[i])
  const x = (i) => (n > 1 ? (i / (n - 1)) * ancho : 0)
  ctx.moveTo(x(0), y(0))
  for (let i = 1; i < n - 1; i++) {
    const mx = (x(i) + x(i + 1)) / 2
    const my = (y(i) + y(i + 1)) / 2
    ctx.quadraticCurveTo(x(i), y(i), mx, my)
  }
  ctx.lineTo(x(n - 1), y(n - 1))
}

/**
 * Pinta el líquido: capas secundarias detrás (alfa baja), principal delante con
 * degradé vertical más denso abajo, y un menisco fino en la cresta de la principal.
 * @param {CanvasRenderingContext2D} ctx
 * @param {Float64Array[]} capas  [principal, secundaria, secundaria]
 * @param {number} ancho  px CSS
 * @param {number} alto  px CSS
 * @param {object|null} burbujas  pool de `lclBurbujas` (opcional)
 * @param {{ liquido: string, menisco: string, fondo: string }} colores  hex
 */
export function dibujarLCL(ctx, capas, ancho, alto, colores, burbujas = null) {
  ctx.clearRect(0, 0, ancho, alto)
  for (let k = capas.length - 1; k >= 0; k--) {
    const capa = capas[k]
    ctx.beginPath()
    trazarSuperficie(ctx, capa, ancho, alto)
    ctx.lineTo(ancho, alto)
    ctx.lineTo(0, alto)
    ctx.closePath()
    if (k === 0) {
      const degradado = ctx.createLinearGradient(0, 0, 0, alto)
      degradado.addColorStop(0, rgba(colores.liquido, ALFA_SUPERFICIE))
      degradado.addColorStop(1, rgba(colores.liquido, ALFA_FONDO))
      ctx.fillStyle = degradado
    } else {
      ctx.fillStyle = rgba(colores.liquido, ALFA_CAPAS[k])
    }
    ctx.fill()
    if (k === 0) {
      // Profundidad: el fondo del tanque se oscurece hacia abajo.
      const fondo = ctx.createLinearGradient(0, alto * NIVEL_REPOSO, 0, alto)
      fondo.addColorStop(0, rgba(colores.fondo, 0))
      fondo.addColorStop(1, rgba(colores.fondo, 0.3))
      ctx.fillStyle = fondo
      ctx.fill()
    }
  }
  // Menisco: línea fina y suave sobre la cresta principal.
  ctx.beginPath()
  trazarSuperficie(ctx, capas[0], ancho, alto)
  ctx.lineWidth = 1.5
  ctx.lineJoin = 'round'
  ctx.strokeStyle = rgba(colores.menisco, 0.5)
  ctx.stroke()
  if (burbujas) dibujarBurbujas(ctx, burbujas, capas[0], ancho, alto, colores)
}

/** Altura (px) de la superficie en x01, interpolando la capa principal. */
function ySuperficie(capa, x01, alto) {
  const pos = x01 * (capa.length - 1)
  const a = Math.floor(pos)
  const b = Math.min(capa.length - 1, a + 1)
  const h = capa[a] * (1 - (pos - a)) + capa[b] * (pos - a)
  return alto * (NIVEL_REPOSO - h)
}

/** Burbujas: relleno translúcido, borde fino y un brillo; suben desde el fondo hasta la cresta. */
function dibujarBurbujas(ctx, burbujas, capa, ancho, alto, colores) {
  ctx.lineWidth = 1
  for (let i = 0; i < burbujas.n; i++) {
    const x01 = xBurbuja(burbujas, i)
    const r = burbujas.r[i]
    const techo = ySuperficie(capa, x01, alto) + r
    const fondo = alto - r
    if (techo >= fondo) continue
    const x = x01 * ancho
    const y = fondo - burbujas.y[i] * (fondo - techo)
    ctx.beginPath()
    ctx.arc(x, y, r, 0, 2 * Math.PI)
    ctx.fillStyle = rgba(colores.menisco, 0.1)
    ctx.fill()
    ctx.strokeStyle = rgba(colores.menisco, 0.35)
    ctx.stroke()
    ctx.beginPath()
    ctx.arc(x - r * 0.3, y - r * 0.3, r * 0.28, 0, 2 * Math.PI)
    ctx.fillStyle = rgba(colores.menisco, 0.55)
    ctx.fill()
  }
}
