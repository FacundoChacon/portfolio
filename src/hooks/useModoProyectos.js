import { useCallback, useEffect, useState } from "react"
import { projectsMode } from "../utils/proyectosScroll"

const SHORT_QUERY = "(max-height: 599.98px)"

function supportsClip() {
  return typeof CSS !== "undefined" && typeof CSS.supports === "function" && CSS.supports("overflow", "clip")
}

function hasWebgl2() {
  return typeof WebGL2RenderingContext === "function"
}

function isShort() {
  return typeof window.matchMedia === "function" && window.matchMedia(SHORT_QUERY).matches
}

function readMode(failed) {
  return projectsMode({ webgl2: hasWebgl2(), short: isShort(), supportsClip: supportsClip(), failed })
}

/**
 * Modo de la sección de proyectos: 'reel' | 'carousel'.
 * Estado inicial sincrónico (sin parpadeo), actualización en vivo y un `fail`
 * pegajoso para cuando el carrete no puede dibujarse (import, contexto, pérdida).
 * @returns {{ mode: 'reel'|'carousel', fail: () => void }}
 */
export function useModoProyectos() {
  const [failed, setFailed] = useState(false)
  const [mode, setMode] = useState(() => (typeof window === "undefined" ? "carousel" : readMode(false)))

  useEffect(() => {
    setMode(readMode(failed))
    if (typeof window.matchMedia !== "function") return undefined
    const update = () => setMode(readMode(failed))
    const mql = window.matchMedia(SHORT_QUERY)
    mql.addEventListener("change", update)
    return () => mql.removeEventListener("change", update)
  }, [failed])

  const fail = useCallback(() => setFailed(true), [])
  return { mode, fail }
}
