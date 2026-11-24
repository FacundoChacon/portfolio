import { useEffect } from 'react'
import { EVA_THEME_COLORS } from '../styles/eva-tokens'
import { REDUCED_MOTION_QUERY } from '../utils/motion'
import { dibujarLCL } from '../utils/lclDibujo'
import { N_BURBUJAS, crearBurbujas, crearRng, pasoBurbujas } from '../utils/lclBurbujas'
import {
  DT_MAX,
  acumularImpulso,
  aplicarImpulsos,
  capasDeSuperficie,
  crearSuperficie,
  dprAcotado,
  debeDibujar,
  energia,
  impulsoDeToque,
  impulsoDelPuntero,
  paso,
  remuestrear,
  resortesParaAncho,
  shouldAnimate,
} from '../utils/lcl'

const DEBOUNCE_RESIZE_MS = 120
const SEMILLA_BURBUJAS = 20241124 // fija: el líquido es determinista
const COLORES = { liquido: EVA_THEME_COLORS.secondary, menisco: EVA_THEME_COLORS.paper, fondo: EVA_THEME_COLORS.black }

/**
 * Conecta el tanque de LCL (canvas 2D) con el DOM: un único bucle rAF que corre
 * solo con el panel visible, la pestaña visible y sin movimiento reducido; ondas
 * por puntero/toque acumuladas y aplicadas una vez por cuadro. Toda la física
 * vive en `utils/lcl`.
 */
export function useTanqueLCL({ panelRef, tanqueRef, canvasRef }) {
  useEffect(() => {
    const panel = panelRef.current
    const tanque = tanqueRef.current
    const canvas = canvasRef.current
    if (!panel || !tanque || !canvas) return undefined

    let ctx = null
    try {
      ctx = canvas.getContext('2d', { alpha: true })
    } catch {
      ctx = null
    }
    if (!ctx) {
      // Plan B: el CSS pinta un degradé equivalente; sin errores.
      tanque.dataset.lcl = 'estatico'
      return undefined
    }

    const mqReducido = window.matchMedia(REDUCED_MOTION_QUERY)
    const estado = { visible: typeof IntersectionObserver === 'undefined', hidden: document.hidden, reduced: mqReducido.matches }

    let ancho = 0
    let alto = 0
    let sup = crearSuperficie(resortesParaAncho(0))
    let pendientes = new Float64Array(sup.h.length)
    let capas = [0, 1, 2].map(() => new Float64Array(sup.h.length))
    const burbujas = crearBurbujas(N_BURBUJAS, crearRng(SEMILLA_BURBUJAS))
    let reloj = 0 // segundos de cuadros dibujados: la onda ambiental continúa tras una pausa
    let last = null
    let ultimo = null
    let excitado = false
    let raf = 0
    let temporizador = 0
    let previo = null
    let punteros = false

    const dibujar = () => {
      if (ancho === 0 || alto === 0) return
      capasDeSuperficie(sup, reloj, capas)
      dibujarLCL(ctx, capas, ancho, alto, COLORES, burbujas)
    }

    /** Un cuadro estático (movimiento reducido): superficie en reposo con t = 0. */
    const dibujarEstatico = () => {
      sup = crearSuperficie(sup.h.length)
      pendientes.fill(0)
      reloj = 0
      dibujar()
    }

    const medir = () => {
      const w = tanque.clientWidth
      const h = tanque.clientHeight
      if (w === 0 || h === 0) return
      const dpr = dprAcotado(window.devicePixelRatio)
      ancho = w
      alto = h
      canvas.width = Math.round(w * dpr)
      canvas.height = Math.round(h * dpr)
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      const n = resortesParaAncho(w)
      sup = remuestrear(sup, n)
      if (pendientes.length !== n) pendientes = new Float64Array(n)
      if (capas[0].length !== n) capas = [0, 1, 2].map(() => new Float64Array(n))
      if (estado.reduced) dibujarEstatico()
      else dibujar()
    }

    const tick = (now) => {
      raf = 0
      if (!shouldAnimate(estado)) return
      const e = excitado ? Number.POSITIVE_INFINITY : energia(sup)
      if (!debeDibujar({ now, ultimo, energy: e })) {
        raf = requestAnimationFrame(tick)
        return
      }
      const dt = last === null ? 0 : Math.min((now - last) / 1000, DT_MAX)
      last = now
      ultimo = now
      reloj += dt
      excitado = false
      aplicarImpulsos(sup, pendientes)
      paso(sup, dt)
      pasoBurbujas(burbujas, dt)
      dibujar()
      raf = requestAnimationFrame(tick)
    }

    const detener = () => {
      if (raf) cancelAnimationFrame(raf)
      raf = 0
    }

    const iniciar = () => {
      if (raf) return
      last = null // al reanudar el primer cuadro usa dt = 0: sin saltos acumulados
      ultimo = null
      raf = requestAnimationFrame(tick)
    }

    // Una sola escucha de puntero (los eventos de las cards burbujean); sin bloquear el gesto de scroll.
    const alMover = (e) => {
      if (e.pointerType !== 'mouse') return
      const rect = panel.getBoundingClientRect()
      if (previo && rect.width > 0) {
        const fuerza = impulsoDelPuntero({ dx: e.clientX - previo.x, dy: e.clientY - previo.y, dtMs: e.timeStamp - previo.t })
        // Un puntero quieto (eventos sintéticos al hacer scroll o al moverse una card) no excita el líquido.
        if (fuerza > 0) {
          acumularImpulso(pendientes, (e.clientX - rect.left) / rect.width, fuerza)
          excitado = true
        }
      }
      previo = { x: e.clientX, y: e.clientY, t: e.timeStamp }
    }
    const alTocar = (e) => {
      if (e.pointerType === 'mouse') return
      const rect = panel.getBoundingClientRect()
      if (rect.width <= 0) return
      acumularImpulso(pendientes, (e.clientX - rect.left) / rect.width, impulsoDeToque())
      excitado = true
    }
    const registrarPunteros = () => {
      if (punteros) return
      punteros = true
      panel.addEventListener('pointermove', alMover, { passive: true })
      panel.addEventListener('pointerdown', alTocar, { passive: true })
    }
    const quitarPunteros = () => {
      if (!punteros) return
      punteros = false
      previo = null
      panel.removeEventListener('pointermove', alMover)
      panel.removeEventListener('pointerdown', alTocar)
    }

    const evaluar = () => {
      if (estado.reduced) {
        detener()
        quitarPunteros()
        dibujarEstatico()
        return
      }
      registrarPunteros()
      if (shouldAnimate(estado)) iniciar()
      else detener()
    }

    const alCambiarVisibilidad = () => {
      estado.hidden = document.hidden
      evaluar()
    }
    const alCambiarMovimiento = (e) => {
      estado.reduced = e.matches
      evaluar()
    }

    const observador =
      typeof IntersectionObserver === 'undefined'
        ? null
        : new IntersectionObserver((entradas) => {
            estado.visible = entradas[entradas.length - 1].isIntersecting
            evaluar()
          })
    observador?.observe(panel)

    const redimensionador =
      typeof ResizeObserver === 'undefined'
        ? null
        : new ResizeObserver(() => {
            clearTimeout(temporizador)
            temporizador = setTimeout(medir, DEBOUNCE_RESIZE_MS)
          })
    redimensionador?.observe(tanque)

    document.addEventListener('visibilitychange', alCambiarVisibilidad)
    mqReducido.addEventListener('change', alCambiarMovimiento)

    medir()
    evaluar()

    return () => {
      detener()
      clearTimeout(temporizador)
      observador?.disconnect()
      redimensionador?.disconnect()
      document.removeEventListener('visibilitychange', alCambiarVisibilidad)
      mqReducido.removeEventListener('change', alCambiarMovimiento)
      quitarPunteros()
    }
  }, [panelRef, tanqueRef, canvasRef])
}
