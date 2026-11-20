import { useEffect, useState } from "react"

import { REDUCED_MOTION_QUERY, prefersReducedMotion } from "../utils/motion.js"

const chars = "!<>-_/[]{}—=+*^?#@%"

export default function GlitchText({ text, className, as: Tag = "span", interval = 3000, scrambleDuration = 200 }) {
  const [display, setDisplay] = useState(text)
  const [glitching, setGlitching] = useState(false)
  const [reduced, setReduced] = useState(() => prefersReducedMotion())

  // Sigue los cambios de la preferencia del sistema mientras la página está abierta.
  useEffect(() => {
    if (typeof globalThis.matchMedia !== "function") return undefined
    const list = globalThis.matchMedia(REDUCED_MOTION_QUERY)
    if (typeof list?.addEventListener !== "function") return undefined
    const onChange = (event) => setReduced(event.matches)
    list.addEventListener("change", onChange)
    return () => list.removeEventListener("change", onChange)
  }, [])

  useEffect(() => {
    // Con movimiento reducido el texto queda estático: no se programa el revuelto.
    if (reduced) {
      setDisplay(text)
      setGlitching(false)
      return undefined
    }

    let timeout, intervalId

    const scramble = () => {
      setGlitching(true)
      let count = 0
      const totalSteps = Math.floor(scrambleDuration / 40)

      intervalId = setInterval(() => {
        count++
        const scrambled = text
          .split("")
          .map((char, i) => {
            if (char === " ") return " "
            const dist = Math.floor((count / totalSteps) * text.length)
            return i < dist ? text[i] : chars[Math.floor(Math.random() * chars.length)]
          })
          .join("")

        setDisplay(scrambled)

        if (count >= totalSteps) {
          clearInterval(intervalId)
          setDisplay(text)
          setGlitching(false)
        }
      }, 40)
    }

    const schedule = () => {
      timeout = setTimeout(() => {
        scramble()
        schedule()
      }, interval + Math.random() * 2000)
    }

    schedule()

    return () => {
      clearTimeout(timeout)
      clearInterval(intervalId)
    }
  }, [text, interval, scrambleDuration, reduced])

  return (
    <Tag className={`${className} ${glitching && !reduced ? "text-glow-magenta" : ""}`} style={{ transition: "text-shadow 0.1s" }}>
      {/* El texto real es estable para tecnologías de asistencia; el revuelto es solo visual. */}
      <span className="sr-only">{text}</span>
      <span aria-hidden="true">{display}</span>
    </Tag>
  )
}
