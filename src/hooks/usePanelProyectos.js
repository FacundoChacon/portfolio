import { useCallback, useEffect, useRef, useState } from "react"
import {
  CORTES,
  anuncioVentana,
  clampInicio,
  direccionDeslizar,
  inicioParaMostrar,
  mover,
  porVistaParaAncho,
  puedeAvanzar,
  puedeRetroceder,
} from "../utils/panelProyectos"

const consultas = () => [`(min-width: ${CORTES.dos}px)`, `(min-width: ${CORTES.tres}px)`]

/** Cantidad de cards visibles ahora, leída con las mismas consultas que el CSS (--por-vista). */
function leerPorVista() {
  if (typeof window === "undefined" || typeof window.matchMedia !== "function") return 1
  const [dos, tres] = consultas().map((q) => window.matchMedia(q).matches)
  return tres ? 3 : dos ? 2 : porVistaParaAncho(0)
}

/**
 * Estado de la ventana deslizante del panel de proyectos. Toda la lógica vive en
 * `utils/panelProyectos`; acá solo se conecta con el DOM (matchMedia, foco, gestos).
 */
export function usePanelProyectos(total) {
  const [porVista, setPorVista] = useState(leerPorVista)
  const [inicioCrudo, setInicioCrudo] = useState(0)
  const [anuncio, setAnuncio] = useState("")
  const ventanaRef = useRef(null)

  // La ventana siempre queda completa, aun entre un cambio de ancho y su efecto.
  const inicio = clampInicio(inicioCrudo, total, porVista)

  const estado = useRef({ inicio, porVista, total })
  estado.current = { inicio, porVista, total }

  /** Corre la ventana un proyecto (o ignora el extremo) y anuncia el cambio. */
  const ir = useCallback((delta) => {
    const { inicio: actual, porVista: pv, total: n } = estado.current
    if (delta > 0 ? !puedeAvanzar(actual, n, pv) : !puedeRetroceder(actual)) return
    const nuevo = mover(actual, delta, n, pv)
    setInicioCrudo(nuevo)
    setAnuncio(anuncioVentana(nuevo, pv, n))
  }, [])

  // Cambios de ancho en vivo: mismas consultas que el CSS; sin anuncio.
  useEffect(() => {
    const listas = consultas().map((q) => window.matchMedia(q))
    const actualizar = () => setPorVista(leerPorVista())
    listas.forEach((mq) => mq.addEventListener("change", actualizar))
    actualizar()
    return () => listas.forEach((mq) => mq.removeEventListener("change", actualizar))
  }, [])

  useEffect(() => {
    setInicioCrudo((i) => clampInicio(i, total, porVista))
  }, [total, porVista])

  // Foco de teclado en una card fuera de la ventana: corrimiento mínimo, sin anuncio.
  // `overflow: clip` evita el scroll del navegador; el scrollLeft = 0 cubre navegadores sin `clip`.
  useEffect(() => {
    const ventana = ventanaRef.current
    if (!ventana) return undefined
    const alEnfocar = (e) => {
      ventana.scrollLeft = 0
      const li = e.target.closest?.("li[data-index]")
      if (!li) return
      const { inicio: actual, porVista: pv, total: n } = estado.current
      const nuevo = inicioParaMostrar(Number(li.dataset.index), actual, n, pv)
      if (nuevo !== actual) setInicioCrudo(nuevo)
    }
    ventana.addEventListener("focusin", alEnfocar)
    return () => ventana.removeEventListener("focusin", alEnfocar)
  }, [])

  // Deslizar con el dedo: solo toque, escuchas pasivas (el scroll vertical queda nativo).
  useEffect(() => {
    const ventana = ventanaRef.current
    if (!ventana) return undefined
    let inicioToque = null
    const abajo = (e) => {
      inicioToque = e.pointerType === "touch" ? { x: e.clientX, y: e.clientY } : null
    }
    const arriba = (e) => {
      if (!inicioToque || e.pointerType !== "touch") return
      const dir = direccionDeslizar({ dx: e.clientX - inicioToque.x, dy: e.clientY - inicioToque.y })
      inicioToque = null
      if (dir !== 0) ir(dir)
    }
    const cancelar = () => {
      inicioToque = null
    }
    ventana.addEventListener("pointerdown", abajo, { passive: true })
    ventana.addEventListener("pointerup", arriba, { passive: true })
    ventana.addEventListener("pointercancel", cancelar, { passive: true })
    return () => {
      ventana.removeEventListener("pointerdown", abajo)
      ventana.removeEventListener("pointerup", arriba)
      ventana.removeEventListener("pointercancel", cancelar)
    }
  }, [ir])

  return { porVista, inicio, anuncio, ir, ventanaRef }
}
