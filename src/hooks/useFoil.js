import { useEffect } from 'react'
import { REDUCED_MOTION_QUERY } from '../utils/motion'
import { estadoActivo, estadoReposo, propiedadesCss, tiltDesdePuntero } from '../utils/foil'

const PUNTERO_FINO = '(hover: hover) and (pointer: fine)'

/**
 * Efecto foil 2.5D de una card: solo con puntero fino y sin movimiento reducido.
 * Escribe variables CSS directamente en la cara (la transición CSS interpola, sin
 * animaciones propias ni rAF). Escucha en el envoltorio (no se transforma, así el
 * puntero no "sale" al inclinarse la cara). Foco de teclado y táctil los resuelve
 * el CSS: aquí no se hace nada.
 */
export function useFoil(envoltorioRef, caraRef) {
  useEffect(() => {
    const envoltorio = envoltorioRef.current
    const cara = caraRef.current
    if (!envoltorio || !cara || typeof window.matchMedia !== 'function') return undefined

    const fino = window.matchMedia(PUNTERO_FINO)
    const reducido = window.matchMedia(REDUCED_MOTION_QUERY)
    let activo = false

    const escribir = (estado) => {
      for (const [nombre, valor] of Object.entries(propiedadesCss(estado))) cara.style.setProperty(nombre, valor)
    }

    const reiniciar = () => {
      if (activo) {
        activo = false
        document.removeEventListener('keydown', alTeclear)
      }
      for (const nombre of Object.keys(propiedadesCss(estadoReposo()))) cara.style.removeProperty(nombre)
    }

    function alTeclear(e) {
      if (e.key !== 'Escape') return
      reiniciar()
      cara.dataset.reposo = '' // vuelve al reposo aunque tenga foco de teclado
    }

    const alMover = (e) => {
      if (e.pointerType === 'touch' || !fino.matches || reducido.matches) return
      if (!activo) {
        activo = true
        delete cara.dataset.reposo
        document.addEventListener('keydown', alTeclear)
      }
      const tilt = tiltDesdePuntero({
        px: e.clientX,
        py: e.clientY,
        rect: envoltorio.getBoundingClientRect(),
        vw: window.innerWidth,
        vh: window.innerHeight,
      })
      escribir(estadoActivo(tilt))
    }

    const alSalirFoco = () => reiniciar()
    const alTeclearEnCard = (e) => {
      if (e.key === 'Escape') cara.dataset.reposo = ''
    }
    const alEntrarFoco = () => {
      delete cara.dataset.reposo
    }

    envoltorio.addEventListener('pointermove', alMover, { passive: true })
    envoltorio.addEventListener('pointerleave', reiniciar)
    envoltorio.addEventListener('pointercancel', reiniciar)
    envoltorio.addEventListener('focusout', alSalirFoco)
    envoltorio.addEventListener('focusin', alEntrarFoco)
    envoltorio.addEventListener('keydown', alTeclearEnCard)

    return () => {
      envoltorio.removeEventListener('pointermove', alMover)
      envoltorio.removeEventListener('pointerleave', reiniciar)
      envoltorio.removeEventListener('pointercancel', reiniciar)
      envoltorio.removeEventListener('focusout', alSalirFoco)
      envoltorio.removeEventListener('focusin', alEntrarFoco)
      envoltorio.removeEventListener('keydown', alTeclearEnCard)
      document.removeEventListener('keydown', alTeclear)
    }
  }, [envoltorioRef, caraRef])
}
