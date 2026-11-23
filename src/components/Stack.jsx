import { useReveal } from "../hooks/useReveal"
import { STACK, moduleCode } from "../data/stack"

export default function Stack() {
  const [ref, visible] = useReveal()

  return (
    <section id="stack" aria-labelledby="stack-titulo" className="relative border-t border-eva-line bg-eva-black py-24">
      <div className="mx-auto max-w-6xl px-4 md:px-6">
        <div className="flex items-center gap-4">
          <p aria-hidden="true" className="font-mono text-sm uppercase tracking-[0.3em] text-eva-orange">
            {"//"}04
          </p>
          <h2
            id="stack-titulo"
            className="font-eva-display text-4xl font-black uppercase leading-none tracking-tight text-eva-paper font-stretch-condensed sm:text-6xl"
          >
            Stack
          </h2>
          <div aria-hidden="true" className="eva-stripes h-2 flex-1" />
        </div>

        <p className="mt-6 max-w-xl text-eva-gray text-pretty">
          Módulos en uso frecuente: lenguajes, frameworks y herramientas con los que construyo.
        </p>

        <div className="eva-neu-surface mt-12 p-4 pt-8 sm:p-6 sm:pt-10">
          <span aria-hidden="true" className="eva-panel-label">STACK {"//"} MÓDULOS</span>
          <span aria-hidden="true" className="eva-panel-code">{`${STACK.length}/${STACK.length}`}</span>
          <ul role="list" ref={ref} className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {STACK.map((tech, i) => (
              <li
                key={tech.name}
                className={`eva-reveal ${visible ? "is-visible" : ""}`}
                style={{ transitionDelay: `${i * 50}ms` }}
              >
                <div className="eva-neu-module relative flex h-full flex-col gap-3 p-4 sm:flex-row sm:items-center sm:gap-4">
                  <span aria-hidden="true" className="absolute right-2 top-2 font-mono text-[10px] text-eva-gray">
                    {moduleCode(i)}
                  </span>
                  <span
                    aria-hidden="true"
                    className="flex size-12 shrink-0 items-center justify-center bg-eva-black font-mono text-sm font-bold text-eva-orange shadow-[inset_2px_2px_5px_rgb(5_5_5/0.9)]"
                  >
                    {tech.glyph}
                  </span>
                  <div className="min-w-0">
                    <p className="break-words font-eva-display text-lg font-bold uppercase leading-tight text-eva-paper font-stretch-condensed">
                      {tech.name}
                    </p>
                    <p className="mt-1 font-mono text-[11px] uppercase tracking-widest text-eva-gray">
                      {tech.category}
                    </p>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  )
}
