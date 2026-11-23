import { Check } from 'lucide-react'

import { clasePaso, estadoPaso } from './estilos.js'

/**
 * Indicador de progreso del wizard (C-06).
 *
 * Muestra los 4 pasos con su estado (completado / actual / pendiente) y marca el
 * actual con `aria-current="step"`. Los tres estados difieren por forma además
 * de por color: actual relleno, completado con tilde, pendiente con número.
 * Es de solo lectura: la navegación se hace con los botones Atrás/Continuar.
 */
const STEPS = [
  { id: 'servicio', label: 'Tipo de sitio' },
  { id: 'extras', label: 'Extras' },
  { id: 'datos', label: 'Tus datos' },
  { id: 'resumen', label: 'Resumen' },
]

export default function WizardSteps({ current = 0 }) {
  return (
    <ol className="flex flex-wrap items-center gap-2 sm:gap-3" aria-label="Progreso del presupuesto">
      {STEPS.map((step, index) => {
        const estado = estadoPaso(index, current)

        return (
          <li
            key={step.id}
            aria-current={estado === 'current' ? 'step' : undefined}
            className={clasePaso(estado)}
          >
            <span
              aria-hidden="true"
              className="flex size-5 items-center justify-center border-2 border-current text-[10px]"
            >
              {estado === 'done' ? <Check className="size-3" strokeWidth={3} /> : index + 1}
            </span>
            {step.label}
          </li>
        )
      })}
    </ol>
  )
}
