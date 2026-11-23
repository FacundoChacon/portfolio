/**
 * Geometría y movimiento puros del carrete 3D. Sin three ni DOM: el adaptador
 * (src/three/carreteEscena.js) solo aplica el "cuadro" que se calcula acá.
 */
import { STATUS_LABELS } from "../data/proyectos.js"

// ── Valores de la especificación ─────────────────────────────────────────────
export const CAMERA = { fov: 65.7, z: 8.1, near: 0.1, far: 40 }
export const PLANE = { width: 2.38, height: 1.5771, segmentsX: 48, segmentsY: 24 }
export const HALF_WIDTH = PLANE.width / 2
export const BEND_BASE = 0.3
export const BEND_MAX = 0.42
export const RIPPLE_AMP = 0.006
export const THETA_STEP = 0.73
export const PITCH_FACTOR = 0.52
export const Z_OFFSET = -0.28
export const ROT_X_STEP = -0.01
export const DAMPING_RATE = 13
export const DT_MAX = 0.05
/** Proyectos por segundo como máximo (equivale al clamp de impulso de la spec). */
export const MAX_PHASE_SPEED = 8
export const CARD_FRACTION = { desktop: 0.37, phone: 0.77 }

// ── Ajuste visual (calibrable sin tocar la spec) ─────────────────────────────
export const RADIUS_K = 3.6
export const DEPTH_K = 1.6
/** Velocidad (proyectos/s) a la que la flexión llega a BEND_MAX. */
export const FLEX_VELOCITY = 4
export const LEAN_K = 0.015
export const LEAN_MAX = 0.05
export const RIPPLE_SPEED = 0.8
/** Radio de las esquinas, en unidades del plano. */
export const CORNER_RADIUS = 0.07
/** Intensidad del sombreado por curvatura. */
export const SHADE = 0.18

const SNAP_EPSILON = 1e-4
const BEND_EPSILON = 1e-6
const PHONE_MAX_WIDTH = 480
const DESKTOP_MIN_WIDTH = 1024

/** @param {number} value @param {number} min @param {number} max */
function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value))
}

// ── Amortiguación ────────────────────────────────────────────────────────────

/** dt acotado a [0, 0.05]; no finito → 0. */
export function clampDt(dt) {
  return Number.isFinite(dt) ? clamp(dt, 0, DT_MAX) : 0
}

/** Fracción del camino que se recorre en `dt`: 1 − e^(−13·dt). */
export function dampFactor(dt) {
  return 1 - Math.exp(-DAMPING_RATE * clampDt(dt))
}

/**
 * Un paso de la fase flotante hacia el objetivo.
 * @param {number} phase
 * @param {number} target
 * @param {number} dt
 * @param {{ reduced?: boolean }} [options]
 */
export function dampPhase(phase, target, dt, { reduced = false } = {}) {
  if (reduced) return Math.round(target)
  const diff = target - phase
  if (Math.abs(diff) < SNAP_EPSILON) return target
  const maxStep = MAX_PHASE_SPEED * clampDt(dt)
  const step = clamp(diff * dampFactor(dt), -maxStep, maxStep)
  const next = phase + step
  return Math.abs(target - next) < SNAP_EPSILON ? target : next
}

// ── Índices ──────────────────────────────────────────────────────────────────

/** Índice relativo a la fase, envuelto a [−N/2, N/2). */
export function wrapRelative(index, phase, count) {
  const half = count / 2
  const shifted = index - phase + half
  return shifted - Math.floor(shifted / count) * count - half
}

/** Proyecto entero más cercano a la fase, dentro de [0, N−1]. */
export function nearestStop(phase, count) {
  return clamp(Math.round(phase), 0, count - 1)
}

// ── Curvado ──────────────────────────────────────────────────────────────────

/**
 * Curva un vértice sobre un cilindro.
 * @param {number} x @param {number} z @param {number} bend @param {number} [halfWidth]
 * @returns {{ x: number, z: number }}
 */
export function bendVertex(x, z, bend, halfWidth = HALF_WIDTH) {
  if (!(Math.abs(bend) > BEND_EPSILON)) return { x, z }
  const angle = (x / halfWidth) * bend
  const radius = halfWidth / bend
  return { x: Math.sin(angle) * radius, z: z + (Math.cos(angle) - 1) * radius }
}

/**
 * Escribe en `out` el plano curvado (+ ondulación vertical). No modifica `flat`.
 * @param {Float32Array} flat posiciones planas xyz
 * @param {Float32Array} out
 * @param {{ bend: number, time: number, rippleAmp: number, height: number }} params
 */
export function deformPlane(flat, out, { bend, time, rippleAmp, height }) {
  const phase = time * RIPPLE_SPEED
  for (let i = 0; i < flat.length; i += 3) {
    const y = flat[i + 1]
    const bent = bendVertex(flat[i], flat[i + 2], bend)
    out[i] = bent.x
    out[i + 1] = y
    out[i + 2] = bent.z + (rippleAmp === 0 ? 0 : rippleAmp * Math.sin((2 * Math.PI * y) / height + phase))
  }
  return out
}

/** Flexión según la velocidad de la fase (proyectos/s). */
export function bendForVelocity(velocity, reduced) {
  if (reduced) return BEND_BASE
  return BEND_BASE + (BEND_MAX - BEND_BASE) * clamp(Math.abs(velocity) / FLEX_VELOCITY, 0, 1)
}

/** Inclinación (rotX) según la velocidad de la fase. */
export function leanForVelocity(velocity, reduced) {
  if (reduced) return 0
  return clamp(velocity * LEAN_K, -LEAN_MAX, LEAN_MAX)
}

// ── Dimensiones según viewport ───────────────────────────────────────────────

/** Fracción del ancho que ocupa la card del frente: 77% en teléfono → 37% en escritorio. */
export function cardWidthFraction(width) {
  if (width <= PHONE_MAX_WIDTH) return CARD_FRACTION.phone
  if (width >= DESKTOP_MIN_WIDTH) return CARD_FRACTION.desktop
  const t = (width - PHONE_MAX_WIDTH) / (DESKTOP_MIN_WIDTH - PHONE_MAX_WIDTH)
  return CARD_FRACTION.phone + (CARD_FRACTION.desktop - CARD_FRACTION.phone) * t
}

/** Ancho visible por unidad de distancia a la cámara. */
function visibleWidthPerUnit(width, height) {
  return 2 * Math.tan((CAMERA.fov * Math.PI) / 360) * (width / height)
}

/** Borde derecho de la card del frente ya curvada (en unidades del plano). */
function frontEdge() {
  return bendVertex(HALF_WIDTH, 0, BEND_BASE)
}

/**
 * Escala del carrete para que la card del frente ocupe la fracción pedida del
 * ancho (midiendo sus bordes curvados). Dimensiones inválidas → null.
 * @param {{ width: number, height: number }} viewport
 */
export function trackDims({ width, height }) {
  if (!(width > 0) || !(height > 0)) return null
  const fk = cardWidthFraction(width) * visibleWidthPerUnit(width, height)
  const edge = frontEdge()
  const scale = (fk * (CAMERA.z - Z_OFFSET)) / (2 * edge.x + fk * (DEPTH_K + edge.z))
  return { scale, radius: RADIUS_K * scale, depth: DEPTH_K * scale, pitch: PITCH_FACTOR * scale }
}

/**
 * Fracción del ancho de pantalla que ocupa la card del frente (bordes curvados).
 * @param {{ scale: number }} dims
 * @param {{ width: number, height: number }} viewport
 */
export function projectedWidthFraction(dims, { width, height }) {
  const edge = frontEdge()
  const distance = CAMERA.z - (DEPTH_K * dims.scale + Z_OFFSET + edge.z * dims.scale)
  return (2 * edge.x * dims.scale) / (visibleWidthPerUnit(width, height) * distance)
}

// ── Transformaciones por card ────────────────────────────────────────────────

/**
 * Posición y orientación de una card.
 * @param {number} relative
 * @param {{ scale: number, radius: number, depth: number, pitch: number }} dims
 * @param {number} [lean]
 */
export function cardTransform(relative, dims, lean = 0) {
  const theta = relative * THETA_STEP
  const sin = Math.sin(theta)
  const cos = Math.cos(theta)
  return {
    x: sin * dims.radius,
    y: relative * dims.pitch,
    z: cos * dims.depth + Z_OFFSET,
    rotY: Math.atan2(dims.depth * sin, dims.radius * cos),
    rotX: relative * ROT_X_STEP + lean,
    scale: dims.scale,
  }
}

/** La cara frontal mira hacia la cámara. */
export function isFacingCamera(rotY) {
  return Math.cos(rotY) > 1e-6
}

// ── Texturas y esquinas ──────────────────────────────────────────────────────

/**
 * Recorte "cover" sin deformar: uv' = uv · scale + offset.
 * @returns {{ scale: [number, number], offset: [number, number] }}
 */
export function coverUv(imageAspect, planeAspect, focusX = 0.5, focusY = 0.5) {
  if (imageAspect > planeAspect) {
    const sx = planeAspect / imageAspect
    return { scale: [sx, 1], offset: [(1 - sx) * focusX, 0] }
  }
  const sy = imageAspect / planeAspect
  return { scale: [1, sy], offset: [0, (1 - sy) * focusY] }
}

/** Distancia con signo a un rectángulo redondeado (<0 dentro, 0 en el borde, >0 fuera). */
export function roundedRectSdf(px, py, hx, hy, r) {
  const qx = Math.abs(px) - hx + r
  const qy = Math.abs(py) - hy + r
  return Math.hypot(Math.max(qx, 0), Math.max(qy, 0)) + Math.min(Math.max(qx, qy), 0) - r
}

// ── Cuadro completo ──────────────────────────────────────────────────────────

/**
 * Todo lo que el adaptador necesita para dibujar un cuadro.
 * @param {{ phase: number, prevPhase: number, dt: number, count: number, dims: object, time: number, reduced: boolean }} args
 */
export function reelFrame({ phase, prevPhase, dt, count, dims, time, reduced }) {
  const velocity = dt > 0 ? (phase - prevPhase) / dt : 0
  const lean = leanForVelocity(velocity, reduced)
  const cards = []
  for (let index = 0; index < count; index++) {
    const relative = wrapRelative(index, phase, count)
    const transform = cardTransform(relative, dims, lean)
    cards.push({ index, relative, ...transform, visible: isFacingCamera(transform.rotY) })
  }
  return {
    phase,
    velocity,
    time,
    bend: bendForVelocity(velocity, reduced),
    rippleAmp: reduced ? 0 : RIPPLE_AMP,
    cards,
  }
}

// ── Entradas ─────────────────────────────────────────────────────────────────

/**
 * Fase que corresponde a un arrastre: izquierda avanza; con mouse/lápiz, abajo
 * también (eje dominante). Con toque solo cuenta el eje horizontal.
 * @param {{ startPhase: number, dx: number, dy: number, pointerType: string, cardPx: number, count: number }} args
 */
export function dragToPhase({ startPhase, dx, dy, pointerType, cardPx, count }) {
  if (!(cardPx > 0)) return startPhase
  const vertical = pointerType !== "touch" && Math.abs(dy) > Math.abs(dx)
  const advance = vertical ? dy : -dx
  return clamp(startPhase + advance / cardPx, 0, count - 1)
}

/**
 * Proyecto al que lleva una tecla; null si la tecla no corresponde o ya está en el extremo
 * (para dejar el comportamiento nativo).
 * @param {string} key @param {number} index @param {number} count
 * @returns {number|null}
 */
export function keyToStop(key, index, count) {
  let next
  switch (key) {
    case "ArrowRight":
    case "ArrowDown":
      next = index + 1
      break
    case "ArrowLeft":
    case "ArrowUp":
      next = index - 1
      break
    case "Home":
      next = 0
      break
    case "End":
      next = count - 1
      break
    default:
      return null
  }
  return next < 0 || next > count - 1 || next === index ? null : next
}

// ── Texto accesible ──────────────────────────────────────────────────────────

/** Nombre accesible del lienzo para el proyecto al frente. */
export function canvasLabel(project, index, total) {
  const status = STATUS_LABELS[project.status] ?? STATUS_LABELS.demo
  return `Carrete de proyectos. Al frente: ${project.title}, ${status}. ${project.description} (proyecto ${index + 1} de ${total})`
}
