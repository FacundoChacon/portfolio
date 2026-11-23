import { useEffect, useLayoutEffect, useRef } from "react"
import {
  SETTLE_IDLE_MS,
  currentPage,
  pageOfItem,
  pagePosition,
  pageStride,
  scrollProgress,
  scrollTopForPage,
  settleTarget,
  trackOffset,
} from "../utils/proyectosScroll"

const SETTLE_EPSILON = 0.001

/** Formato "01 / 02" del indicador. */
function formatIndicator(page, pages) {
  const two = (n) => String(n).padStart(2, "0")
  return `${two(page + 1)} / ${two(pages)}`
}

/**
 * Recorrido horizontal fijado: mide una vez (cacheado), escucha `scroll` de forma
 * pasiva y escribe un único `transform` por cuadro. No hay estado de React por cuadro.
 *
 * @param {{ enabled: boolean, pages: number, pinRef: object, stickyRef: object, trackRef: object, indicatorRef: object, barRef: object }} args
 */
export function usePinHorizontal({ enabled, pages, pinRef, stickyRef, trackRef, indicatorRef, barRef }) {
  // Inicio de la sección a restaurar si se sale del modo con el scroll dentro del tramo.
  const exitTopRef = useRef(null)

  useLayoutEffect(() => {
    const pin = pinRef.current
    const sticky = stickyRef.current
    const track = trackRef.current
    if (!enabled || !pin || !sticky || !track) return undefined

    const indicator = indicatorRef.current
    const bar = barRef.current

    let top = 0
    let range = 0
    let stride = 0
    let position = 0
    let shownPage = -1
    let rafId = 0
    let settleTimer = 0
    let pointerDown = false

    function measure() {
      const stickyTop = parseFloat(getComputedStyle(sticky).top) || 0
      top = pin.getBoundingClientRect().top + window.scrollY - stickyTop
      range = pin.offsetHeight - sticky.offsetHeight
      const gap = parseFloat(getComputedStyle(track).columnGap) || 0
      stride = pageStride(track.clientWidth, gap)
    }

    function apply() {
      const progress = scrollProgress({ scrollY: window.scrollY, top, range })
      position = pagePosition(progress, pages)
      track.style.transform = `translate3d(${trackOffset(position, stride)}px, 0, 0)`
      if (bar) bar.style.transform = `scaleX(${progress})`
      const page = currentPage(position)
      if (indicator && page !== shownPage) {
        indicator.textContent = formatIndicator(page, pages)
        shownPage = page
      }
    }

    function cancelSettle() {
      window.clearTimeout(settleTimer)
    }

    function scheduleSettle() {
      cancelSettle()
      settleTimer = window.setTimeout(() => {
        if (pointerDown) return
        const progress = scrollProgress({ scrollY: window.scrollY, top, range })
        const target = settleTarget(progress, pages)
        if (target !== null) {
          window.scrollTo({ top: scrollTopForPage({ page: target, pages, top, range }), behavior: "smooth" })
        }
      }, SETTLE_IDLE_MS)
    }

    function onScroll() {
      if (rafId === 0) {
        rafId = window.requestAnimationFrame(() => {
          rafId = 0
          apply()
        })
      }
      scheduleSettle()
    }

    function remeasure() {
      measure()
      apply()
      scheduleSettle()
    }

    function onFocusIn(event) {
      const item = event.target instanceof Element ? event.target.closest("li[data-index]") : null
      if (!item || !track.contains(item)) return
      const page = pageOfItem(Number(item.dataset.index))
      if (Math.abs(position - page) <= SETTLE_EPSILON) return
      cancelSettle()
      window.scrollTo({ top: scrollTopForPage({ page, pages, top, range }), behavior: "instant" })
      apply()
    }

    function onPointerDown() {
      pointerDown = true
      cancelSettle()
    }

    function onPointerUp() {
      if (!pointerDown) return
      pointerDown = false
      scheduleSettle()
    }

    function onPageShow() {
      measure()
      apply()
    }

    measure()
    apply()

    const resizeObserver = typeof ResizeObserver === "function" ? new ResizeObserver(remeasure) : null
    if (resizeObserver) {
      for (const el of [pin, sticky, track, document.body]) resizeObserver.observe(el)
    }

    window.addEventListener("scroll", onScroll, { passive: true })
    window.addEventListener("resize", remeasure)
    window.addEventListener("pageshow", onPageShow)
    window.addEventListener("wheel", cancelSettle, { passive: true })
    window.addEventListener("touchstart", cancelSettle, { passive: true })
    window.addEventListener("keydown", cancelSettle, { passive: true })
    window.addEventListener("pointerdown", onPointerDown, { passive: true })
    window.addEventListener("pointerup", onPointerUp, { passive: true })
    window.addEventListener("pointercancel", onPointerUp, { passive: true })
    track.addEventListener("focusin", onFocusIn)

    return () => {
      window.cancelAnimationFrame(rafId)
      window.clearTimeout(settleTimer)
      resizeObserver?.disconnect()
      window.removeEventListener("scroll", onScroll)
      window.removeEventListener("resize", remeasure)
      window.removeEventListener("pageshow", onPageShow)
      window.removeEventListener("wheel", cancelSettle)
      window.removeEventListener("touchstart", cancelSettle)
      window.removeEventListener("keydown", cancelSettle)
      window.removeEventListener("pointerdown", onPointerDown)
      window.removeEventListener("pointerup", onPointerUp)
      window.removeEventListener("pointercancel", onPointerUp)
      track.removeEventListener("focusin", onFocusIn)
      track.style.transform = ""
      if (bar) bar.style.transform = ""
      // Si el scroll estaba dentro del tramo fijado, el alto va a colapsar al salir del modo.
      const scrollY = window.scrollY
      exitTopRef.current = scrollY > top && scrollY < top + range + sticky.offsetHeight ? Math.max(0, top) : null
    }
  }, [enabled, pages, pinRef, stickyRef, trackRef, indicatorRef, barRef])

  // Tras salir del modo (no al desmontar), vuelve al inicio de la sección para no dejar al usuario perdido.
  useLayoutEffect(() => {
    if (!enabled && exitTopRef.current !== null) {
      window.scrollTo({ top: exitTopRef.current, behavior: "instant" })
    }
    exitTopRef.current = null
  })

  // Re-mide al terminar de cargar (imágenes y fuentes cambian el alto de lo de arriba).
  useEffect(() => {
    if (!enabled || document.readyState === "complete") return undefined
    const onLoad = () => window.dispatchEvent(new Event("resize"))
    window.addEventListener("load", onLoad, { once: true })
    return () => window.removeEventListener("load", onLoad)
  }, [enabled])
}
