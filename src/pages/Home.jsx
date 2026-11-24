import { useEffect } from 'react'
import { resolveHashTarget, shouldApplyHash } from '../utils/hashTarget'
import SiteNav from '../components/SiteNav'
import Hero from '../components/Hero'
import About from '../components/About'
import Projects from '../components/Projects'
import Stack from '../components/Stack'
import Testimonials from '../components/Testimonials'
import Contact from '../components/Contact'

// Solo la primera carga de la página: después manda el router / la restauración del navegador.
let primerMontaje = true
const REAJUSTE_MS = 2500

/**
 * La SPA se monta después de que el navegador intenta el ancla, así que `/#proyectos`
 * no llegaba a la sección. Respeta `scroll-padding-top` (navbar) y no anima.
 */
function useAnclaDirecta() {
  useEffect(() => {
    if (!primerMontaje) return undefined
    const timer = window.setTimeout(() => {
      primerMontaje = false
    }, 0)
    const id = resolveHashTarget(window.location.hash)
    const navegacion = typeof performance.getEntriesByType === 'function' ? performance.getEntriesByType('navigation')[0] : undefined
    const el = id && shouldApplyHash(navegacion?.type) ? document.getElementById(id) : null
    if (!el) return () => window.clearTimeout(timer)

    const ir = () => el.scrollIntoView({ behavior: 'instant', block: 'start' })
    ir()
    // Imágenes, fuentes y el panel de proyectos mueven la sección mientras carga: reajusta (sin animar)
    // durante un rato, solo si el usuario no tocó nada.
    let tocado = false
    const marcar = () => {
      tocado = true
    }
    const eventos = ['wheel', 'touchstart', 'keydown', 'pointerdown']
    for (const nombre of eventos) window.addEventListener(nombre, marcar, { passive: true })
    const observador =
      typeof ResizeObserver === 'function'
        ? new ResizeObserver(() => {
            if (!tocado) ir()
          })
        : null
    observador?.observe(document.body)
    const fin = window.setTimeout(() => observador?.disconnect(), REAJUSTE_MS)
    return () => {
      window.clearTimeout(timer)
      window.clearTimeout(fin)
      observador?.disconnect()
      for (const nombre of eventos) window.removeEventListener(nombre, marcar)
    }
  }, [])
}

export default function Home() {
  useAnclaDirecta()
  return (
    <>
      <SiteNav />
      <main id="contenido" tabIndex={-1} className="relative min-h-screen overflow-x-clip bg-eva-black outline-none">
        <Hero />
        <About />
        <Projects />
        <Stack />
        <Testimonials />
        <Contact />
      </main>
    </>
  )
}
