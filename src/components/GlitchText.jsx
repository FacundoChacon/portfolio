import { useEffect, useState } from "react"

const chars = "!<>-_/[]{}—=+*^?#@%"

export default function GlitchText({ text, className, as: Tag = "span", interval = 3000, scrambleDuration = 200 }) {
  const [display, setDisplay] = useState(text)
  const [glitching, setGlitching] = useState(false)

  useEffect(() => {
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
  }, [text, interval, scrambleDuration])

  return (
    <Tag className={`${className} ${glitching ? "text-glow-magenta" : ""}`} style={{ transition: "text-shadow 0.1s" }}>
      {display}
    </Tag>
  )
}
