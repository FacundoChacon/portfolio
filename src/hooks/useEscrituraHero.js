import { useEffect, useState } from 'react'
import { REDUCED_MOTION_QUERY, prefersReducedMotion } from '../utils/motion'
import { estadoEn, estadoFinal, estadoInicialSegunModo, mismoEstado } from '../utils/escritura'

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
 * `modo` lo fija la compuerta de entrada: solo en `libre` corre la escritura. En `lista` y `en-espera`
 * el estado se deriva en el render (sin rAF ni listeners ni marcar la ejecución), así el paso de la
 * compuerta a `libre` reinicia la escritura en el mismo commit en que la compuerta desaparece.
 *
 * @param {import('../utils/escritura').LineaDeTiempo} linea
 * @param {{ current: HTMLElement | null }} seccionRef sección que escucha `focusin`
 * @param {'lista'|'en-espera'|'libre'} [modo]
 * @returns {{ fase: string, visibles: Record<string, number> }}
 */
export function useEscrituraHero(linea, seccionRef, modo = 'libre') {
  // Progreso de la escritura: solo existe una vez que arrancó en `libre`.
  const [progreso, setProgreso] = useState(null)
  const inicial = estadoInicialSegunModo(modo, linea, {
    reducedMotion: prefersReducedMotion(),
    yaEjecutada: escrituraEjecutada,
  })

  const yaFinal = inicial.fase === 'fin'

  useEffect(() => {
    if (modo !== 'libre') return undefined
    // Movimiento reducido o ya ejecutada: el primer render ya es el estado final.
    if (yaFinal) return undefined
    const seccion = seccionRef.current
    const t0 = performance.now()
    let raf = 0
    let mediaQuery = null
    try {
      mediaQuery = globalThis.matchMedia?.(REDUCED_MOTION_QUERY) ?? null
    } catch {
      mediaQuery = null
    }

    const actualizar = (siguiente) => setProgreso((previo) => (previo && mismoEstado(previo, siguiente) ? previo : siguiente))

    function completar() {
      escrituraEjecutada = true
      cancelAnimationFrame(raf)
      actualizar(estadoFinal(linea))
    }
    // Una tecla anterior a t0 es la que saltó la compuerta: no completa la escritura que ella misma inició.
    function alTeclear(evento) {
      if (evento.timeStamp < t0) return
      completar()
    }
    function alCambiarMovimiento(evento) {
      if (evento.matches) completar()
    }
    function cuadro(ahora) {
      const t = ahora - t0
      if (t >= linea.total) {
        completar()
        return
      }
      actualizar(estadoEn(t, linea))
      raf = requestAnimationFrame(cuadro)
    }

    raf = requestAnimationFrame(cuadro)
    window.addEventListener('keydown', alTeclear)
    seccion?.addEventListener('focusin', completar)
    mediaQuery?.addEventListener('change', alCambiarMovimiento)

    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('keydown', alTeclear)
      seccion?.removeEventListener('focusin', completar)
      mediaQuery?.removeEventListener('change', alCambiarMovimiento)
    }
  }, [linea, seccionRef, modo, yaFinal])

  return modo === 'libre' && progreso ? progreso : inicial
}
