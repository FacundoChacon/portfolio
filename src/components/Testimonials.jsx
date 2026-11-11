import { Star } from "lucide-react"
import { useReveal } from "../hooks/useReveal"
import GlitchText from "./GlitchText"
import testimonios from "../data/testimonios"

const hasValidRating = (rating) => Number.isInteger(rating) && rating >= 1 && rating <= 5

const inicialesDe = (nombre) =>
  nombre
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((palabra) => palabra.charAt(0).toUpperCase())
    .join("")

export default function Testimonials() {
  const [ref, visible] = useReveal()

  if (testimonios.length === 0) return null

  return (
    <section id="testimonios" className="relative overflow-hidden border-t border-dark-border py-24">
      <div className="cyber-grid pointer-events-none absolute inset-0 opacity-30" />
      <div className="relative mx-auto max-w-6xl px-5 md:px-6">
        <div className="flex items-center gap-4">
          <span className="font-mono text-sm text-accent-green text-glow-cyan">04.</span>
          <h2 className="font-display text-3xl font-bold text-white sm:text-4xl">
            <GlitchText text="Testimonios" interval={4000} scrambleDuration={250} />
          </h2>
          <div className="h-px flex-1 bg-gradient-to-r from-accent-green/50 to-transparent" />
        </div>

        <p className="mt-6 max-w-xl text-gray-400 text-pretty">
          Lo que dicen quienes ya trabajaron conmigo.
        </p>

        <div
          ref={ref}
          className={`reveal reveal-bottom mt-12 grid grid-cols-1 gap-6 transition-all duration-1000 lg:grid-cols-3 ${
            visible ? "visible" : ""
          }`}
        >
          {testimonios.map((t) => (
            <figure
              key={t.nombre}
              className="flex flex-col rounded-lg border border-dark-border bg-dark-card/50 p-5 transition-all duration-300 hover:-translate-y-1 hover:border-accent-green/60 hover:box-glow-cyan"
            >
              {hasValidRating(t.rating) && (
                <div
                  role="img"
                  aria-label={`Calificación: ${t.rating} de 5`}
                  className="flex items-center gap-1"
                >
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      aria-hidden="true"
                      fill={i < t.rating ? "currentColor" : "none"}
                      className={`size-4 ${i < t.rating ? "text-amber-400" : "text-gray-500"}`}
                    />
                  ))}
                </div>
              )}
              <blockquote className="mt-4 flex-1">
                <p className="text-sm leading-relaxed text-gray-400 text-pretty">“{t.comentario}”</p>
              </blockquote>
              <figcaption className="mt-6 flex items-center gap-4 border-t border-dark-border pt-4">
                <span
                  aria-hidden="true"
                  className="flex size-10 shrink-0 items-center justify-center rounded-full border border-dark-border bg-dark-secondary font-display text-sm font-bold text-accent-green"
                >
                  {inicialesDe(t.nombre)}
                </span>
                <div className="min-w-0">
                  <p className="truncate font-display text-base font-semibold text-white">{t.nombre}</p>
                  <p className="font-mono text-xs uppercase tracking-widest text-gray-400">{t.rol}</p>
                </div>
              </figcaption>
            </figure>
          ))}
        </div>
      </div>
    </section>
  )
}
