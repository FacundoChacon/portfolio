/**
 * Física del tanque de LCL: resortes 1D acoplados + ondulación ambiental.
 * Módulo puro (sin DOM, sin Math.random): todo es determinista y testeable.
 * Las alturas `h` están normalizadas al alto del panel (el canvas cubre todo el
 * panel; positivo = sube).
 */

/** Paso fijo de integración (s) y tope de `dt` por cuadro (s): máximo 6 subpasos. */
export const SUBPASO = 1 / 120
export const DT_MAX = 0.05
/** Fracción del alto del panel que llena el líquido en calma (nivel de reposo a 2/3 desde abajo). */
export const NIVEL_LLENADO = 2 / 3
/** Tope de amplitud (fracción del alto del panel, ≈ 9%): la cresta no invade la barra superior. */
export const AMP_MAX = 0.09
/** Tope del impulso acumulado por resorte en un cuadro (velocidad normalizada, 1/s). */
export const IMPULSO_MAX = 0.3
/** Energía media por resorte por debajo de la cual solo queda la ondulación ambiental. */
export const ENERGIA_REPOSO = 1e-6
/** Amplitud máxima de la respiración ambiental (fracción del alto del tanque). */
export const AMB_AMP = 0.017
/** Intervalo entre cuadros dibujados cuando solo hay ondulación ambiental (~30 fps). */
export const INTERVALO_AMBIENTAL_MS = 1000 / 30

const K = 56 // rigidez del resorte (≈ 1.2 Hz)
const D = 3 // amortiguación (más alta: las ondas del puntero se calman antes)
const PROPAGACION = 1200 // c² (resortes²/s²): ~35 resortes por segundo
const RADIO_IMPULSO = 3 // resortes a cada lado
const DESFASE_CAPAS = 3 // resortes de muestreo desplazado de las capas secundarias
const GANANCIA_PUNTERO = 0.05 // impulso por px/ms (≈ 40% del efecto anterior, en unidades del panel)
const IMPULSO_TOQUE = 0.18
const IMPULSO_PUNTERO_MAX = 0.06 // tope por evento del puntero (el acumulado por cuadro sigue acotado por IMPULSO_MAX)

const clamp = (v, min, max) => Math.min(max, Math.max(min, v))

/** Cantidad de resortes: separación aproximada constante (12 px) entre 24 y 160. */
export function resortesParaAncho(anchoCss) {
  if (!Number.isFinite(anchoCss)) return 24
  return clamp(Math.round(anchoCss / 12), 24, 160)
}

/** Resolución del canvas: el líquido es suave, no necesita más de 1.5×. */
export function dprAcotado(dpr) {
  return clamp(dpr || 1, 1, 1.5)
}

/** Superficie en reposo de `n` resortes. `acum` guarda el tiempo pendiente de subpasos. */
export function crearSuperficie(n) {
  return { h: new Float64Array(n), v: new Float64Array(n), acum: 0 }
}

/** Re-muestrea las alturas (interpolación lineal) al cambiar la cantidad de resortes. */
export function remuestrear(sup, n) {
  const m = sup.h.length
  if (n === m) return sup
  const nueva = crearSuperficie(n)
  for (let i = 0; i < n; i++) {
    const pos = n > 1 ? (i / (n - 1)) * (m - 1) : 0
    const a = Math.floor(pos)
    const b = Math.min(m - 1, a + 1)
    const f = pos - a
    nueva.h[i] = sup.h[a] * (1 - f) + sup.h[b] * f
    nueva.v[i] = sup.v[a] * (1 - f) + sup.v[b] * f
  }
  return nueva
}

function subpaso(sup, dt) {
  const { h, v } = sup
  const n = h.length
  for (let i = 0; i < n; i++) {
    v[i] += (-K * h[i] - D * v[i]) * dt
    // Laplaciano con bordes reflectantes: el vecino faltante es el propio resorte.
    const izq = h[i > 0 ? i - 1 : i]
    const der = h[i < n - 1 ? i + 1 : i]
    v[i] += PROPAGACION * (izq + der - 2 * h[i]) * dt
  }
  for (let i = 0; i < n; i++) {
    h[i] += v[i] * dt
    if (h[i] > AMP_MAX) {
      h[i] = AMP_MAX
      if (v[i] > 0) v[i] = 0
    } else if (h[i] < -AMP_MAX) {
      h[i] = -AMP_MAX
      if (v[i] < 0) v[i] = 0
    }
  }
}

/** Avanza la simulación con subpasos fijos; `dt` (s) se acota a `DT_MAX`. */
export function paso(sup, dt) {
  const limitado = Number.isFinite(dt) ? clamp(dt, 0, DT_MAX) : 0
  sup.acum += limitado
  while (sup.acum >= SUBPASO - 1e-9) {
    subpaso(sup, SUBPASO)
    sup.acum -= SUBPASO
  }
  if (sup.acum < 0) sup.acum = 0
}

/** Suma un impulso (reparto coseno) al buffer de pendientes. `x01` fuera de [0, 1] se ignora. */
export function acumularImpulso(pendientes, x01, fuerza) {
  if (!Number.isFinite(x01) || !Number.isFinite(fuerza) || x01 < 0 || x01 > 1) return
  const n = pendientes.length
  const centro = Math.round(x01 * (n - 1))
  for (let d = -RADIO_IMPULSO; d <= RADIO_IMPULSO; d++) {
    const i = centro + d
    if (i < 0 || i >= n) continue
    const peso = 0.5 * (1 + Math.cos((Math.PI * d) / (RADIO_IMPULSO + 1)))
    pendientes[i] = clamp(pendientes[i] + fuerza * peso, -IMPULSO_MAX, IMPULSO_MAX)
  }
}

/** Vuelca los impulsos acumulados en las velocidades y vacía el buffer. */
export function aplicarImpulsos(sup, pendientes) {
  for (let i = 0; i < pendientes.length; i++) {
    sup.v[i] += pendientes[i]
    pendientes[i] = 0
  }
}

/** Impulso proporcional a la velocidad del puntero (px/ms), acotado; 0 sin movimiento. */
export function impulsoDelPuntero({ dx, dy, dtMs }) {
  const dist = Math.hypot(dx, dy)
  if (!Number.isFinite(dist)) return 0
  const dt = Number.isFinite(dtMs) && dtMs > 1 ? dtMs : 1
  return Math.min(IMPULSO_PUNTERO_MAX, (dist / dt) * GANANCIA_PUNTERO)
}

/** Impulso fijo y moderado de un toque. */
export function impulsoDeToque() {
  return IMPULSO_TOQUE
}

/** Energía media por resorte (independiente de la cantidad de resortes). */
export function energia(sup) {
  const n = sup.h.length
  let total = 0
  for (let i = 0; i < n; i++) total += sup.h[i] * sup.h[i] + sup.v[i] * sup.v[i]
  return n > 0 ? total / n : 0
}

// Respiración: 2 senos lentos por capa (número de onda, período en s, fase).
const AMBIENTE = [
  [
    { k: 1.0, T: 7, fase: 0.0, sentido: 1 },
    { k: 1.7, T: 11, fase: 1.3, sentido: -1 },
  ],
  [
    { k: 1.4, T: 8.5, fase: 2.1, sentido: -1 },
    { k: 2.3, T: 13, fase: 0.7, sentido: 1 },
  ],
  [
    { k: 0.8, T: 9.5, fase: 4.0, sentido: 1 },
    { k: 2.9, T: 6, fase: 2.6, sentido: -1 },
  ],
]

/** Ondulación ambiental de una capa en x01 ∈ [0, 1] y tiempo `t` (s). |valor| ≤ AMB_AMP. */
export function ondaAmbiental(x01, t, capa) {
  const ondas = AMBIENTE[capa] ?? AMBIENTE[0]
  let suma = 0
  for (const { k, T, fase, sentido } of ondas) {
    suma += Math.sin(2 * Math.PI * (k * x01 + (sentido * t) / T) + fase)
  }
  return (AMB_AMP * suma) / ondas.length
}

/** ¿Debe haber bucle? Solo con el panel visible, la pestaña visible y sin movimiento reducido. */
export function shouldAnimate({ visible, hidden, reduced }) {
  return Boolean(visible) && !hidden && !reduced
}

/** Intervalo mínimo (ms) entre cuadros dibujados: ~30 fps en reposo, todos si hay ondas. */
export function intervaloCuadro({ energy }) {
  return energy > ENERGIA_REPOSO ? 0 : INTERVALO_AMBIENTAL_MS
}

/** ¿Toca dibujar en este cuadro del navegador? (1 ms de tolerancia por el jitter del rAF.) */
export function debeDibujar({ now, ultimo, energy }) {
  if (ultimo == null) return true
  return now - ultimo >= intervaloCuadro({ energy }) - 1
}

const FACTOR_CAPA = [1, 0.6, 0.35]
const DESPLAZAMIENTO_CAPA = [0, DESFASE_CAPAS, -DESFASE_CAPAS]

/**
 * Tres curvas de superficie: la principal (simulación) y dos secundarias
 * derivadas, cada una con su ondulación ambiental. Toda capa respeta AMP_MAX.
 * `out` permite reutilizar los arreglos entre cuadros.
 */
export function capasDeSuperficie(sup, t, out) {
  const n = sup.h.length
  const capas = out ?? [0, 1, 2].map(() => new Float64Array(n))
  for (let k = 0; k < 3; k++) {
    const capa = capas[k]
    for (let i = 0; i < n; i++) {
      const j = clamp(i + DESPLAZAMIENTO_CAPA[k], 0, n - 1)
      const x01 = n > 1 ? i / (n - 1) : 0
      capa[i] = clamp(sup.h[j] * FACTOR_CAPA[k] + ondaAmbiental(x01, t, k), -AMP_MAX, AMP_MAX)
    }
  }
  return capas
}
