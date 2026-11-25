import LogoEva from "./LogoEva"
import { useCompuerta } from "../hooks/useCompuerta"

/** Barrido de entrada del glifo y de "FACU CODE" (demoras = TIEMPOS_COMPUERTA.glifoInicio y .textoInicio). */
const BARRIDO = "motion-safe:animate-eva-boot"

/**
 * Compuerta de entrada: dos hojas opacas que se abren hacia arriba y hacia abajo antes de la escritura del hero.
 * Es una capa decorativa (`aria-hidden`, sin elementos enfocables ni roles) encima de la página real. Todo el
 * movimiento lo hace el CSS según `data-compuerta` (`index.css`); React solo cambia la fase.
 * Un clic o un toque la salta: va en `click` y no en `pointerdown`/`touchstart`, para que el clic sintetizado
 * del toque caiga sobre la capa y no sobre lo que hay debajo.
 */
export default function CompuertaIntro() {
  const { fase, saltar } = useCompuerta()
  if (!fase || fase === "abierta") return null

  return (
    <div
      aria-hidden="true"
      data-compuerta={fase}
      onClick={saltar}
      className="compuerta fixed inset-0 z-[70] overflow-hidden"
    >
      <div className="compuerta-hoja-superior absolute inset-x-0 top-0 h-1/2 bg-eva-panel">
        <span className="eva-stripes absolute h-2 compuerta-franja-izq bottom-0 left-0 right-[calc(50%+3.125rem)] md:right-[calc(50%+3.8125rem)]" />
        <span className="eva-stripes absolute h-2 compuerta-franja-der bottom-0 left-[calc(50%+3.125rem)] right-0 md:left-[calc(50%+3.8125rem)]" />
      </div>

      <div className="absolute inset-0 flex items-center justify-center">
        <span className={`compuerta-simbolo block ${BARRIDO} motion-safe:[animation-delay:200ms]`}>
          <LogoEva variante="completo" className="block h-28 w-auto md:h-40" />
        </span>
      </div>

      <div className="compuerta-hoja-inferior absolute inset-x-0 top-1/2 h-1/2 bg-eva-panel">
        <span className="eva-stripes absolute h-2 compuerta-franja-izq left-0 right-[calc(50%+3.125rem)] top-0 md:right-[calc(50%+3.8125rem)]" />
        <span className="eva-stripes absolute h-2 compuerta-franja-der left-[calc(50%+3.125rem)] right-0 top-0 md:left-[calc(50%+3.8125rem)]" />
        <p className="flex justify-center pt-20 md:pt-[6.5rem]">
          <span
            className={`inline-block font-eva-display text-3xl font-black uppercase tracking-[0.2em] whitespace-nowrap font-stretch-condensed md:text-5xl ${BARRIDO} motion-safe:[animation-delay:480ms]`}
          >
            <span className="text-eva-paper">FACU</span> <span className="text-eva-primary-light">CODE</span>
          </span>
        </p>
      </div>
    </div>
  )
}
