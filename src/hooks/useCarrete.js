import { useEffect, useLayoutEffect, useRef } from "react"
import { REDUCED_MOTION_QUERY } from "../utils/motion"
import {
  SETTLE_IDLE_MS,
  pagePosition,
  scrollProgress,
  scrollTopForPage,
  scrollTopForPosition,
  settleTargetDirectional,
} from "../utils/proyectosScroll"
import {
  canvasLabel,
  cardWidthFraction,
  clampDt,
  dampPhase,
  dragToPhase,
  keyToStop,
  nearestStop,
  reelFrame,
  trackDims,
} from "../utils/carrete3d"

// 40%: a 1440×900 la sección arranca a ~1.8 viewports, así que la carga inicial no baja el chunk.
const PRELOAD_MARGIN = "0px 0px 40% 0px"
const DRAG_THRESHOLD_PX = 4

/**
 * Carrete 3D: la fuente única de verdad es el scroll de la página. Rueda, arrastre,
 * teclado y foco terminan en una posición de scroll; el bucle solo la lee.
 *
 * @param {{
 *   enabled: boolean,
 *   projects: Array<object>,
 *   onFail: () => void,
 *   sectionRef: object, pinRef: object, stageRef: object, lienzoRef: object, linksRef: object, posterRef: object,
 * }} args
 */
export function useCarrete({ enabled, projects, onFail, sectionRef, pinRef, stageRef, lienzoRef, linksRef, posterRef }) {
  const exitTopRef = useRef(null)
  const failRef = useRef(onFail)
  useLayoutEffect(() => {
    failRef.current = onFail
  })

  const count = projects.length

  useLayoutEffect(() => {
    const section = sectionRef.current
    const pin = pinRef.current
    const stage = stageRef.current
    const lienzo = lienzoRef.current
    const linksList = linksRef.current
    const poster = posterRef.current
    if (!enabled || !section || !pin || !stage || !lienzo || !linksList) return undefined

    const links = Array.from(linksList.querySelectorAll("a[data-index]"))
    const reducedQuery = typeof window.matchMedia === "function" ? window.matchMedia(REDUCED_MOTION_QUERY) : null

    let top = 0
    let range = 0
    let dims = null
    let width = 0
    let height = 0
    let scene = null
    let cancelled = false
    let reduced = reducedQuery?.matches === true
    let visible = true
    let phase = 0
    let time = 0
    let last = null
    let rafId = 0
    let front = -1
    let drawn = false
    let settleTimer = 0
    let lastY = window.scrollY
    let direction = 0
    let pointerActive = false
    let drag = null
    let dragRaf = 0
    let dragPhase = 0

    const behavior = () => (reduced ? "instant" : "smooth")

    function measure() {
      const stickyTop = parseFloat(getComputedStyle(stage).top) || 0
      top = pin.getBoundingClientRect().top + window.scrollY - stickyTop
      range = pin.offsetHeight - stage.offsetHeight
      width = lienzo.clientWidth
      height = lienzo.clientHeight
      dims = trackDims({ width, height })
      stage.style.setProperty("--carrete-card-w", `${width * cardWidthFraction(width)}px`)
      if (scene && dims) scene.setSize(width, height, window.devicePixelRatio || 1)
    }

    function getTarget() {
      return pagePosition(scrollProgress({ scrollY: window.scrollY, top, range }), count)
    }

    function setFront(index) {
      if (index === front) return
      if (front >= 0) links[front]?.removeAttribute("data-activo")
      front = index
      links[index]?.setAttribute("data-activo", "")
      lienzo.setAttribute("aria-label", canvasLabel(projects[index], index, count))
      if (poster && !drawn) poster.src = projects[index].image
    }

    // ── bucle ──
    function tick(now) {
      rafId = 0
      if (!scene || !dims) return
      const dt = last === null ? 0 : clampDt((now - last) / 1000)
      last = now
      time += dt
      const target = getTarget()
      const next = dampPhase(phase, target, dt, { reduced })
      const frame = reelFrame({ phase: next, prevPhase: phase, dt, count, dims, time, reduced })
      phase = next
      scene.render(frame)
      setFront(Math.min(count - 1, Math.max(0, Math.round(target))))
      if (!drawn) {
        drawn = true
        lienzo.dataset.ready = "true"
      }
      if (!reduced && visible && !document.hidden) rafId = window.requestAnimationFrame(tick)
      else last = null
    }

    function schedule() {
      if (rafId || !scene || !dims || !visible || document.hidden) return
      rafId = window.requestAnimationFrame(tick)
    }

    function stopLoop() {
      window.cancelAnimationFrame(rafId)
      rafId = 0
      last = null
    }

    // ── asentamiento ──
    function cancelSettle() {
      window.clearTimeout(settleTimer)
    }

    function scheduleSettle() {
      cancelSettle()
      settleTimer = window.setTimeout(() => {
        if (pointerActive) return
        const target = settleTargetDirectional(scrollProgress({ scrollY: window.scrollY, top, range }), count, direction)
        if (target !== null) {
          window.scrollTo({ top: scrollTopForPage({ page: target, pages: count, top, range }), behavior: behavior() })
        }
      }, SETTLE_IDLE_MS)
    }

    function onScroll() {
      const y = window.scrollY
      if (y !== lastY) direction = y > lastY ? 1 : -1
      lastY = y
      schedule()
      scheduleSettle()
    }

    function remeasure() {
      measure()
      schedule()
      scheduleSettle()
    }

    function onPageShow() {
      measure()
      phase = getTarget()
      last = null
      schedule()
    }

    // ── foco y teclado ──
    function goToStop(index, scrollBehavior) {
      cancelSettle()
      window.scrollTo({ top: scrollTopForPage({ page: index, pages: count, top, range }), behavior: scrollBehavior })
    }

    function onFocusIn(event) {
      const link = event.target instanceof Element ? event.target.closest("a[data-index]") : null
      if (!link) return
      const index = Number(link.dataset.index)
      if (Math.round(getTarget()) !== index) goToStop(index, "instant")
      setFront(index)
      schedule()
    }

    function onKeyDown(event) {
      if (event.altKey || event.ctrlKey || event.metaKey) return
      const next = keyToStop(event.key, front, count)
      if (next === null) return
      event.preventDefault()
      links[next]?.focus({ preventScroll: true })
    }

    // ── arrastre ──
    function applyDrag() {
      dragRaf = 0
      if (!drag?.active) return
      window.scrollTo({ top: scrollTopForPosition({ position: dragPhase, pages: count, top, range }), behavior: "instant" })
    }

    function endDrag(event) {
      if (!drag) return
      const wasDragging = drag.active
      try {
        lienzo.releasePointerCapture(drag.id)
      } catch {
        /* ya liberado */
      }
      drag = null
      pointerActive = false
      lienzo.removeAttribute("data-dragging")
      window.cancelAnimationFrame(dragRaf)
      dragRaf = 0
      if (wasDragging && event.type !== "pointercancel") {
        goToStop(nearestStop(dragPhase, count), behavior())
      } else {
        scheduleSettle()
      }
    }

    function onPointerDown(event) {
      if (event.pointerType === "mouse" && event.button !== 0) return
      cancelSettle()
      pointerActive = true
      drag = { id: event.pointerId, x: event.clientX, y: event.clientY, startPhase: getTarget(), active: false, type: event.pointerType }
      try {
        lienzo.setPointerCapture(event.pointerId)
      } catch {
        /* sin captura */
      }
    }

    function onPointerMove(event) {
      if (!drag || event.pointerId !== drag.id) return
      const dx = event.clientX - drag.x
      const dy = event.clientY - drag.y
      if (!drag.active) {
        if (Math.hypot(dx, dy) < DRAG_THRESHOLD_PX) return
        drag.active = true
        lienzo.setAttribute("data-dragging", "")
      }
      const cardPx = cardWidthFraction(width) * width
      dragPhase = dragToPhase({ startPhase: drag.startPhase, dx, dy, pointerType: drag.type, cardPx, count })
      if (!dragRaf) dragRaf = window.requestAnimationFrame(applyDrag)
    }

    // ── observadores ──
    const resizeObserver = typeof ResizeObserver === "function" ? new ResizeObserver(remeasure) : null
    resizeObserver?.observe(pin)
    resizeObserver?.observe(stage)
    resizeObserver?.observe(lienzo)
    resizeObserver?.observe(document.body)

    const visibilityObserver =
      typeof IntersectionObserver === "function"
        ? new IntersectionObserver((entries) => {
            visible = entries[entries.length - 1].isIntersecting
            if (visible) {
              last = null
              schedule()
            } else {
              stopLoop()
            }
          })
        : null
    visibilityObserver?.observe(section)

    function onVisibility() {
      if (document.hidden) stopLoop()
      else {
        last = null
        schedule()
      }
    }

    function onReducedChange(event) {
      reduced = event.matches
      last = null
      schedule()
    }

    // ── carga diferida del motor 3D ──
    function load() {
      import("../three/carreteEscena.js")
        .then((mod) => {
          if (cancelled) return
          scene = mod.createCarreteEscena({
            container: lienzo,
            projects,
            onContextLost: () => failRef.current(),
            onNeedRender: schedule,
          })
          measure()
          phase = getTarget()
          schedule()
        })
        .catch(() => {
          if (!cancelled) failRef.current()
        })
    }

    const preloadObserver =
      typeof IntersectionObserver === "function"
        ? new IntersectionObserver(
            (entries) => {
              if (entries.some((e) => e.isIntersecting)) {
                preloadObserver.disconnect()
                load()
              }
            },
            { rootMargin: PRELOAD_MARGIN },
          )
        : null
    if (preloadObserver) preloadObserver.observe(section)
    else load()

    // ── arranque ──
    measure()
    phase = getTarget()
    setFront(Math.min(count - 1, Math.max(0, Math.round(phase))))

    window.addEventListener("scroll", onScroll, { passive: true })
    window.addEventListener("resize", remeasure)
    window.addEventListener("pageshow", onPageShow)
    window.addEventListener("wheel", cancelSettle, { passive: true })
    window.addEventListener("touchstart", cancelSettle, { passive: true })
    window.addEventListener("keydown", cancelSettle, { passive: true })
    document.addEventListener("visibilitychange", onVisibility)
    reducedQuery?.addEventListener("change", onReducedChange)
    linksList.addEventListener("focusin", onFocusIn)
    linksList.addEventListener("keydown", onKeyDown)
    lienzo.addEventListener("pointerdown", onPointerDown)
    lienzo.addEventListener("pointermove", onPointerMove)
    lienzo.addEventListener("pointerup", endDrag)
    lienzo.addEventListener("pointercancel", endDrag)
    lienzo.addEventListener("lostpointercapture", endDrag)

    return () => {
      cancelled = true
      window.cancelAnimationFrame(rafId)
      window.cancelAnimationFrame(dragRaf)
      window.clearTimeout(settleTimer)
      resizeObserver?.disconnect()
      visibilityObserver?.disconnect()
      preloadObserver?.disconnect()
      window.removeEventListener("scroll", onScroll)
      window.removeEventListener("resize", remeasure)
      window.removeEventListener("pageshow", onPageShow)
      window.removeEventListener("wheel", cancelSettle)
      window.removeEventListener("touchstart", cancelSettle)
      window.removeEventListener("keydown", cancelSettle)
      document.removeEventListener("visibilitychange", onVisibility)
      reducedQuery?.removeEventListener("change", onReducedChange)
      linksList.removeEventListener("focusin", onFocusIn)
      linksList.removeEventListener("keydown", onKeyDown)
      lienzo.removeEventListener("pointerdown", onPointerDown)
      lienzo.removeEventListener("pointermove", onPointerMove)
      lienzo.removeEventListener("pointerup", endDrag)
      lienzo.removeEventListener("pointercancel", endDrag)
      lienzo.removeEventListener("lostpointercapture", endDrag)
      scene?.dispose()
      scene = null
      delete lienzo.dataset.ready
      lienzo.removeAttribute("data-dragging")
      for (const link of links) link.removeAttribute("data-activo")
      // Si el scroll estaba dentro del tramo fijado, el alto va a colapsar al salir del modo.
      const scrollY = window.scrollY
      exitTopRef.current = scrollY > top && scrollY < top + range + stage.offsetHeight ? Math.max(0, top) : null
    }
  }, [enabled, count, projects, sectionRef, pinRef, stageRef, lienzoRef, linksRef, posterRef])

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
