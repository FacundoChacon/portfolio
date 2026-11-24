import { ArrowDown } from "lucide-react"
import { GithubIcon, LinkedinIcon } from "./BrandIcons"
import LogoEva from "./LogoEva"
import {
  ENLACES_PERFIL,
  FICHA,
  PERFIL,
  RETRATO,
  externalLinkProps,
  nombreCompleto,
} from "../data/presentacion"

const ICONOS = { github: GithubIcon, linkedin: LinkedinIcon }

/** Entrada escalonada (solo con movimiento permitido); nunca en el retrato ni en el h1. */
const BOOT = "motion-safe:animate-eva-boot"

export default function Hero() {
  return (
    <section
      id="presentacion"
      className="eva-hex-grid relative flex min-h-screen flex-col overflow-x-clip bg-eva-black pt-24"
    >
      <div className="mx-auto grid w-full max-w-6xl flex-1 content-center gap-y-12 px-4 pb-16 md:grid-cols-12 md:gap-x-8 md:px-6">
        <div className="relative md:col-span-7">
          <LogoEva
            variante="completo"
            className="pointer-events-none absolute right-0 top-0 z-0 h-32 w-auto md:h-40 lg:h-60 xl:h-[280px] motion-safe:animate-eva-boot motion-safe:[animation-delay:120ms]"
          />
          <p aria-hidden="true" className="font-mono text-sm uppercase tracking-[0.3em] text-eva-primary-light">
            01 {"//"} Presentación
          </p>
          <h1
            aria-label={nombreCompleto(PERFIL)}
            className="mt-4 font-eva-display text-[15vw] font-black uppercase leading-[0.86] tracking-tight text-eva-paper font-stretch-extra-condensed md:text-[9vw] xl:text-[7.25rem]"
          >
            <span className="block whitespace-nowrap">{PERFIL.nombre}</span>
            <span className="block whitespace-nowrap text-eva-primary-light">{PERFIL.apellido}</span>
          </h1>
          <p className="mt-6 font-mono text-base uppercase tracking-widest text-eva-paper">
            {PERFIL.rol}
            {" · "}
            {PERFIL.especialidad}
          </p>
          <p className="mt-6 max-w-md text-lg leading-relaxed text-eva-gray text-pretty">
            Construyo experiencias full stack de punta a punta: APIs robustas con
            Java 17 y Spring Boot, interfaces reactivas con React y Tailwind CSS. Actualmente
            buscando mi primera oportunidad profesional.
          </p>

          <div className={`mt-10 flex flex-wrap items-center gap-4 ${BOOT} motion-safe:[animation-delay:240ms]`}>
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

        <div className="md:col-span-5 md:mt-16">
          <div className="mx-auto w-full max-w-[320px] md:ml-auto md:mr-0 md:max-w-[440px]">
            <figure className="relative border-2 border-eva-primary bg-eva-panel shadow-[10px_10px_0_0_var(--eva-secondary)]">
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
            </figure>

            <div
              className={`eva-panel relative z-10 mt-10 p-5 pt-6 md:-ml-8 md:-mt-10 ${BOOT} motion-safe:[animation-delay:120ms]`}
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
                      {etiqueta}
                    </dt>
                    <dd
                      className={`font-mono text-sm ${tono === "ok" ? "text-eva-tertiary" : "text-eva-paper"}`}
                    >
                      {valor}
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
