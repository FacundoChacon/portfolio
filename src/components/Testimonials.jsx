import { Star } from "lucide-react"
import { useReveal } from "../hooks/useReveal"
import testimonios from "../data/testimonios"
import { hasValidRating, inicialesDe, messageCode, ratingLabel } from "../utils/testimonios"

export default function Testimonials() {
  const [ref, visible] = useReveal()

  if (testimonios.length === 0) return null

  const shown = visible ? "is-visible" : ""

  return (
    <section
      id="testimonios"
      aria-labelledby="testimonios-titulo"
      className="eva-hex-grid relative eva-seccion border-t border-eva-line bg-eva-black"
    >
      <div className="relative mx-auto max-w-6xl px-5 md:px-6">
        <div className="flex items-center gap-4">
          <span aria-hidden="true" className="font-mono text-sm text-eva-primary-light">{"//RX"}</span>
          <h2
            id="testimonios-titulo"
            className="font-eva-display text-3xl font-black uppercase text-eva-paper font-stretch-condensed sm:text-4xl"
          >
            Testimonios
          </h2>
          <div aria-hidden="true" className="eva-stripes h-1 flex-1" />
        </div>

        <p className="mt-6 max-w-xl text-eva-gray text-pretty">
          Lo que dicen quienes ya trabajaron conmigo.
        </p>

        <div ref={ref} className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-3">
          {testimonios.map((t, index) => (
            <figure
              key={t.nombre}
              className={`eva-glass eva-reveal flex flex-col p-5 pt-8 ${shown}`}
              style={{ transitionDelay: `${index * 80}ms` }}
            >
              <span aria-hidden="true" className="eva-panel-label">{messageCode(index)}</span>
              <span aria-hidden="true" className="eva-panel-code">ENTRANTE</span>
              {hasValidRating(t.rating) && (
                <div role="img" aria-label={ratingLabel(t.rating)} className="flex items-center gap-1">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      aria-hidden="true"
                      fill={i < t.rating ? "currentColor" : "none"}
                      className={`size-4 ${i < t.rating ? "text-eva-secondary" : "text-eva-gray"}`}
                    />
                  ))}
                </div>
              )}
              <blockquote className="mt-4 flex-1">
                <p className="text-sm leading-relaxed text-eva-paper text-pretty">
                  <span aria-hidden="true" className="font-mono text-eva-tertiary">{"> "}</span>
                  “{t.comentario}”
                  <span aria-hidden="true" className="eva-cursor ml-1 text-eva-tertiary">▌</span>
                </p>
              </blockquote>
              <figcaption className="mt-6 flex items-center gap-4 border-t border-eva-line pt-4">
                <span
                  aria-hidden="true"
                  className="flex size-10 shrink-0 items-center justify-center border border-eva-gray-dim font-mono text-sm font-bold text-eva-primary-light"
                >
                  {inicialesDe(t.nombre)}
                </span>
                <div className="min-w-0">
                  <p className="truncate font-eva-display text-base font-bold uppercase text-eva-paper font-stretch-condensed">
                    {t.nombre}
                  </p>
                  <p className="font-mono text-xs uppercase tracking-widest text-eva-gray">{t.rol}</p>
                </div>
              </figcaption>
            </figure>
          ))}
        </div>
      </div>
    </section>
  )
}
