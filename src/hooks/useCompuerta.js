import { createContext, createElement, useCallback, useContext, useEffect, useLayoutEffect, useMemo, useReducer } from 'react'
import { REDUCED_MOTION_QUERY, prefersReducedMotion } from '../utils/motion'
import {
  bloqueaDesplazamiento,
  decidirCompuerta,
  estadoHeroSegunCompuerta,
  sesionDelNavegador,
  teclaDesplaza,
  transicionCompuerta,
} from '../utils/compuerta'

/**
 * Ruta con la que se cargó el documento, capturada al evaluar el módulo (`Home` no es diferido, así que es en el
 * arranque). Entrar por `/configurador` y navegar después a `/` no muestra la compuerta.
 */
const RUTA_DE_ENTRADA = globalThis.location?.pathname ?? '/'

/** Decisión de esta carga de página: una sola respuesta para el doble inicializador de `StrictMode` y para cada `Home`. */
let decisionDeEstaCarga = null
/** La compuerta ya se abrió, se saltó o se desmontó: un segundo montaje de `Home` por SPA no la repite. */
let consumida = false

const CONTEXTO_POR_DEFECTO = Object.freeze({ fase: null, saltar: () => {} })
const Contexto = createContext(CONTEXTO_POR_DEFECTO)

function decidirUnaVez() {
  if (decisionDeEstaCarga === null) {
    decisionDeEstaCarga = decidirCompuerta(
      { reducedMotion: prefersReducedMotion(), rutaDeEntrada: RUTA_DE_ENTRADA, hash: globalThis.location?.hash ?? '' },
      sesionDelNavegador(),
    )
  }
  return decisionDeEstaCarga && !consumida
}

const estadoInicial = () => ({ fase: decidirUnaVez() ? 'armado' : 'abierta' })

/**
 * Proveedor de la compuerta de entrada. Envuelve la barra y `main` de `Home` y recibe sus hijos por `children`:
 * un cambio de fase solo vuelve a renderizar a los consumidores del contexto (la capa y el hero).
 *
 * El reloj arranca en el primer `requestAnimationFrame` (una pestaña en segundo plano no la "termina" sin que
 * nadie la vea) y el progreso sale del tiempo transcurrido. Con la compuerta cerrada bloquea el desplazamiento
 * con una clase en `<html>` (nunca `style`, por la CSP).
 */
export function CompuertaProvider({ children }) {
  const [{ fase }, dispatch] = useReducer(transicionCompuerta, undefined, estadoInicial)
  const abierta = fase === 'abierta'
  const bloquea = bloqueaDesplazamiento(fase)
  const saltar = useCallback(() => dispatch({ tipo: 'saltar' }), [])

  // Antes del primer pintado: la página ya nace bloqueada y sin salto de diseño (`overflow-y: scroll`, ver index.css).
  useLayoutEffect(() => {
    if (!bloquea) return undefined
    document.documentElement.classList.add('compuerta-cerrada')
    return () => document.documentElement.classList.remove('compuerta-cerrada')
  }, [bloquea])

  useEffect(() => {
    if (!abierta) return undefined
    consumida = true
    return undefined
  }, [abierta])

  useEffect(() => {
    if (abierta) return undefined
    let raf = 0
    let t0 = null
    let mediaQuery = null
    try {
      mediaQuery = globalThis.matchMedia?.(REDUCED_MOTION_QUERY) ?? null
    } catch {
      mediaQuery = null
    }
    function cuadro(ahora) {
      if (t0 === null) t0 = ahora
      dispatch({ tipo: 'cuadro', t: ahora - t0 })
      raf = requestAnimationFrame(cuadro)
    }
    // Listeners en `window` (no en `document`): la escritura del hero escucha `keydown` en el mismo objetivo, y el DOM
    // no invoca durante un despacho a los listeners que se agregan al mismo objetivo. La tecla que salta no la completa.
    const alSaltar = () => dispatch({ tipo: 'saltar' })
    // La tecla que salta no puede desplazar: el bloqueo se quita antes de que el navegador ejecute su acción por defecto.
    const alTeclear = (evento) => {
      if (teclaDesplaza(evento.key)) evento.preventDefault()
      dispatch({ tipo: 'saltar' })
    }
    const alCambiarMovimiento = (evento) => {
      if (evento.matches) dispatch({ tipo: 'movimiento-reducido' })
    }
    raf = requestAnimationFrame(cuadro)
    window.addEventListener('keydown', alTeclear)
    window.addEventListener('wheel', alSaltar, { passive: true })
    window.addEventListener('touchmove', alSaltar, { passive: true })
    mediaQuery?.addEventListener('change', alCambiarMovimiento)
    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('keydown', alTeclear)
      window.removeEventListener('wheel', alSaltar)
      window.removeEventListener('touchmove', alSaltar)
      mediaQuery?.removeEventListener('change', alCambiarMovimiento)
      // Si se desmonta a mitad de la intro (navegación SPA), no se repite al volver.
      consumida = true
    }
  }, [abierta])

  const valor = useMemo(() => ({ fase, saltar }), [fase, saltar])
  return createElement(Contexto.Provider, { value: valor }, children)
}

/** Fase de la compuerta y la acción de saltarla. Sin proveedor: `fase` es `null` (no hay compuerta). */
export function useCompuerta() {
  return useContext(Contexto)
}

/** Modo que la compuerta le impone al hero (`libre` si no hay compuerta). */
export function useModoHero() {
  return estadoHeroSegunCompuerta(useContext(Contexto).fase)
}
