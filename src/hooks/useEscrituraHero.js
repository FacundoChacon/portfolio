import { useEffect, useRef, useState } from 'react'
import { REDUCED_MOTION_QUERY, prefersReducedMotion } from '../utils/motion'
import { debeAnimar, estadoEn, estadoFinal, mismoEstado } from '../utils/escritura'

/** La entrada escrita corre como máximo una vez por carga de página (sobrevive a la navegación SPA). */
let escrituraEjecutada = false

/**
 * Orquesta la entrada escrita del hero con `requestAnimationFrame`. El progreso
 * sale del tiempo transcurrido (no de ticks), así que los frames perdidos no la
 * ralentizan. El estado inicial es síncrono: con movimiento reducido, o si ya se
 * ejecutó, el primer render ya es el estado final.
 *
 * Cualquier tecla, el foco dentro de la sección o activar el movimiento reducido
 * la completan al instante.
 *
 * @param {import('../utils/escritura').LineaDeTiempo} linea
 * @param {{ current: HTMLElement | null }} seccionRef sección que escucha `focusin`
 * @returns {{ fase: string, visibles: Record<string, number> }}
 */
export function useEscrituraHero(linea, seccionRef) {
  const [estado, setEstado] = useState(() =>
    debeAnimar({ reducedMotion: prefersReducedMotion(), yaEjecutada: escrituraEjecutada })
      ? estadoEn(0, linea)
      : estadoFinal(linea),
  )
  const corriendo = useRef(estado.fase !== 'fin')
  const t0 = useRef(null)

  useEffect(() => {
    if (!corriendo.current) return undefined
    const seccion = seccionRef.current
    let raf = 0
    let mediaQuery = null
    try {
      mediaQuery = globalThis.matchMedia?.(REDUCED_MOTION_QUERY) ?? null
    } catch {
      mediaQuery = null
    }

    const actualizar = (siguiente) => setEstado((previo) => (mismoEstado(previo, siguiente) ? previo : siguiente))

    function completar() {
      corriendo.current = false
      escrituraEjecutada = true
      cancelAnimationFrame(raf)
      actualizar(estadoFinal(linea))
    }
    function alCambiarMovimiento(evento) {
      if (evento.matches) completar()
    }
    function cuadro(ahora) {
      const t = ahora - t0.current
      if (t >= linea.total) {
        completar()
        return
      }
      actualizar(estadoEn(t, linea))
      raf = requestAnimationFrame(cuadro)
    }

    // t0 vive en un ref: el doble efecto de StrictMode no reinicia la escritura.
    if (t0.current === null) t0.current = performance.now()
    raf = requestAnimationFrame(cuadro)
    window.addEventListener('keydown', completar)
    seccion?.addEventListener('focusin', completar)
    mediaQuery?.addEventListener('change', alCambiarMovimiento)

    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('keydown', completar)
      seccion?.removeEventListener('focusin', completar)
      mediaQuery?.removeEventListener('change', alCambiarMovimiento)
    }
  }, [linea, seccionRef])

  return estado
}
