import { useEffect, useRef, useState } from "react"
import { prefersReducedMotion, shouldRevealImmediately } from "../utils/motion"

/**
 * Revela un elemento la primera vez que entra en el viewport.
 * Las opciones se reciben desestructuradas (valores primitivos) para que el
 * efecto dependa de ellas sin re-ejecutarse cuando el llamador pasa un objeto
 * literal nuevo en cada render (`useReveal({ threshold: 0.1 })`).
 *
 * @param {{ threshold?: number|number[], rootMargin?: string, root?: Element|null }} [options]
 */
export function useReveal({ threshold = 0.15, rootMargin, root } = {}) {
  const ref = useRef(null)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const el = ref.current
    if (!el) return

    if (shouldRevealImmediately({ reducedMotion: prefersReducedMotion(), hasIntersectionObserver: "IntersectionObserver" in window })) {
      setVisible(true)
      return
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true)
          observer.disconnect()
        }
      },
      { threshold, rootMargin, root }
    )

    observer.observe(el)
    return () => observer.disconnect()
  }, [threshold, rootMargin, root])

  return [ref, visible]
}
