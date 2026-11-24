import { useRef } from "react"
import { ArrowDown } from "lucide-react"
import { GithubIcon, LinkedinIcon } from "./BrandIcons"
import TextoEscrito from "./TextoEscrito"
import { useEscrituraHero } from "../hooks/useEscrituraHero"
import { crearLineaDeTiempo, faseAlcanza } from "../utils/escritura"
import {
  DESCRIPCION,
  ENLACES_PERFIL,
  FICHA,
  KICKER,
  PERFIL,
  RETRATO,
  SUBTITULO,
  externalLinkProps,
  nombreCompleto,
} from "../data/presentacion"

const ICONOS = { github: GithubIcon, linkedin: LinkedinIcon }

/** Entrada con barrido (solo con movimiento permitido); nunca en la imagen del retrato ni en el h1. */
const BOOT = "motion-safe:animate-eva-boot"

/** Línea de tiempo de la entrada escrita (constantes en utils/escritura.js). */
const LINEA = crearLineaDeTiempo({
  kicker: KICKER,
  nombre: PERFIL.nombre,
  apellido: PERFIL.apellido,
  subtitulo: SUBTITULO,
  descripcion: DESCRIPCION,
  ficha: FICHA,
})

/**
 * Clase de un bloque que entra con barrido: oculto hasta su fase (sin visibility, sigue enfocable),
 * con el barrido mientras dura y limpio al terminar o al completarse la entrada.
 */
function claseDeEntrada(fase, desde, hasta) {
  if (faseAlcanza(fase, hasta)) return ""
  return faseAlcanza(fase, desde) ? BOOT : "opacity-0"
}

export default function Hero() {
  const seccionRef = useRef(null)
  const { fase, visibles } = useEscrituraHero(LINEA, seccionRef)
  const bajoLaGrilla = !faseAlcanza(fase, "c")

  return (
    <section
      ref={seccionRef}
      data-escritura={fase}
      id="presentacion"
      className="eva-hex-grid relative overflow-x-clip bg-eva-black pt-24"
    >
      <div className="mx-auto grid w-full max-w-6xl gap-y-12 px-4 pb-16 md:grid-cols-12 md:gap-x-8 md:px-6">
        <div className="md:col-span-7">
          <p aria-hidden="true" className="font-mono text-sm uppercase tracking-[0.3em] text-eva-primary-light">
            <TextoEscrito texto={KICKER} visibles={visibles.kicker} accesible="decorativo" />
          </p>
          <h1
            aria-label={nombreCompleto(PERFIL)}
            className="mt-4 font-eva-display text-[15vw] font-black uppercase leading-[0.86] tracking-tight text-eva-paper font-stretch-extra-condensed md:text-[9vw] xl:text-[7.25rem]"
          >
            <span className="block whitespace-nowrap">
              <TextoEscrito texto={PERFIL.nombre} visibles={visibles.nombre} accesible="externo" />
            </span>
            <span className="block whitespace-nowrap text-eva-primary-light">
              <TextoEscrito texto={PERFIL.apellido} visibles={visibles.apellido} accesible="externo" />
            </span>
          </h1>
          <p className="mt-6 font-mono text-base uppercase tracking-widest text-eva-paper">
            <TextoEscrito texto={SUBTITULO} visibles={visibles.subtitulo} />
          </p>
          <p className="mt-6 max-w-md text-lg leading-relaxed text-eva-gray text-pretty">
            <TextoEscrito texto={DESCRIPCION} visibles={visibles.descripcion} />
          </p>

          <div className={`mt-10 flex flex-wrap items-center gap-4 ${claseDeEntrada(fase, "acciones", "fin")}`}>
            <a
              href="#proyectos"
              className="inline-flex min-h-11 items-center gap-2 border-2 border-eva-primary bg-eva-primary px-6 py-3 font-mono text-sm font-bold uppercase tracking-[0.2em] text-eva-black shadow-[6px_6px_0_0_var(--eva-secondary)] hover:shadow-[8px_8px_0_0_var(--eva-secondary)] focus-visible:shadow-[8px_8px_0_0_var(--eva-secondary)] motion-safe:transition-[transform,box-shadow,color,background-color] motion-safe:duration-150 motion-safe:hover:-translate-x-0.5 motion-safe:hover:-translate-y-0.5 motion-safe:focus-visible:-translate-x-0.5 motion-safe:focus-visible:-translate-y-0.5"
            >
              Ver proyectos <ArrowDown className="size-4" aria-hidden="true" />
            </a>
            {ENLACES_PERFIL.map(({ id, label, href }) => {
              const Icono = ICONOS[id]
              return (
                <a
                  key={id}
                  href={href}
                  {...externalLinkProps()}
                  className="inline-flex min-h-11 items-center gap-2 border-2 border-eva-gray-dim bg-eva-black px-4 py-2 font-mono text-sm uppercase tracking-[0.2em] text-eva-paper hover:border-eva-secondary hover:text-eva-secondary hover:shadow-[4px_4px_0_0_var(--eva-secondary)] focus-visible:border-eva-secondary focus-visible:text-eva-secondary focus-visible:shadow-[4px_4px_0_0_var(--eva-secondary)] motion-safe:transition-[transform,box-shadow,color,background-color] motion-safe:duration-150 motion-safe:hover:-translate-x-0.5 motion-safe:hover:-translate-y-0.5 motion-safe:focus-visible:-translate-x-0.5 motion-safe:focus-visible:-translate-y-0.5"
                >
                  <Icono className="size-5" />
                  {label}
                  <span className="sr-only"> (se abre en una pestaña nueva)</span>
                </a>
              )
            })}
          </div>
        </div>

        <div className="md:col-span-5">
          <div className="mx-auto w-full max-w-[320px] md:ml-auto md:mr-0 md:max-w-[440px]">
            <figure className={`relative border-2 border-eva-primary bg-eva-panel shadow-[10px_10px_0_0_var(--eva-secondary)] ${bajoLaGrilla ? "-z-20" : ""}`}>
              <img
                src={RETRATO.src}
                width={RETRATO.width}
                height={RETRATO.height}
                alt={RETRATO.alt}
                // React 18 no conoce `fetchPriority` (camelCase, React 19): se pasa en minúscula al DOM.
                // eslint-disable-next-line react/no-unknown-property
                fetchpriority="high"
                decoding="async"
                className="block aspect-[4/5] w-full object-cover"
              />
              <span aria-hidden="true" className="eva-panel-label">
                REG {"//"} RETRATO
              </span>
              <span aria-hidden="true" className="eva-panel-code">
                IMG-01
              </span>
              <div
                aria-hidden="true"
                className="eva-stripes absolute -right-6 inset-y-4 hidden w-2 md:block"
              />
              {bajoLaGrilla && (
                // Tapa la tarjeta completa (borde, etiquetas, sombra y franja) con el color de fondo; la figure queda
                // bajo la grilla hex, así que se ve el fondo con su grilla. La imagen ya está pintada debajo (LCP).
                <span
                  aria-hidden="true"
                  data-obturador
                  className={`absolute -bottom-4 -left-4 -right-10 -top-4 bg-eva-black ${faseAlcanza(fase, "b") ? "motion-safe:animate-eva-obturador" : ""}`}
                />
              )}
            </figure>

            <div
              className={`eva-panel relative z-10 mt-10 p-5 pt-6 md:-ml-8 md:-mt-24 lg:-mt-36 ${claseDeEntrada(fase, "b", "fin")}`}
            >
              <span aria-hidden="true" className="eva-panel-label">
                SYS {"//"} FICHA
              </span>
              <span aria-hidden="true" className="eva-panel-code">
                FC-01
              </span>
              <dl>
                {FICHA.map(({ id, etiqueta, valor, tono }) => (
                  <div key={id} className="flex gap-4 border-b border-eva-line py-2 last:border-b-0">
                    <dt className="w-24 shrink-0 font-mono text-xs uppercase tracking-[0.18em] text-eva-gray">
                      <TextoEscrito texto={etiqueta} visibles={visibles[`${id}-etiqueta`]} direccion="der" />
                    </dt>
                    <dd
                      className={`font-mono text-sm ${tono === "ok" ? "text-eva-tertiary" : "text-eva-paper"}`}
                    >
                      <TextoEscrito texto={valor} visibles={visibles[`${id}-valor`]} direccion="der" />
                    </dd>
                  </div>
                ))}
              </dl>
            </div>
          </div>
        </div>
      </div>

      <div
        aria-hidden="true"
        className={`eva-stripes eva-stripes-primary h-3 w-full ${BOOT} motion-safe:[animation-delay:120ms]`}
      />
    </section>
  )
}
