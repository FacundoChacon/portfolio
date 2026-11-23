import { useEffect, useState } from "react"
import { REDUCED_MOTION_QUERY } from "../utils/motion"
import { layoutMode } from "../utils/proyectosScroll"

const QUERIES = {
  narrow: "(max-width: 767.98px)",
  coarse: "(pointer: coarse)",
  short: "(max-height: 599.98px)",
  reducedMotion: REDUCED_MOTION_QUERY,
}

function supportsClip() {
  return typeof CSS !== "undefined" && typeof CSS.supports === "function" && CSS.supports("overflow", "clip")
}

function matches(query) {
  return typeof window.matchMedia === "function" && window.matchMedia(query).matches
}

function readMode(pages) {
  return layoutMode({
    pages,
    narrow: matches(QUERIES.narrow),
    coarse: matches(QUERIES.coarse),
    short: matches(QUERIES.short),
    reducedMotion: matches(QUERIES.reducedMotion),
    supportsClip: supportsClip(),
  })
}

/**
 * Modo de la sección de proyectos: 'pin' | 'carousel' | 'row'.
 * Estado inicial sincrónico (sin parpadeo) y actualización en vivo.
 * @param {number} pages
 */
export function useModoProyectos(pages) {
  const [mode, setMode] = useState(() => (typeof window === "undefined" ? "row" : readMode(pages)))

  useEffect(() => {
    if (typeof window.matchMedia !== "function") return undefined
    const update = () => setMode(readMode(pages))
    update()
    const lists = Object.values(QUERIES).map((q) => window.matchMedia(q))
    for (const mql of lists) mql.addEventListener("change", update)
    return () => {
      for (const mql of lists) mql.removeEventListener("change", update)
    }
  }, [pages])

  return mode
}
