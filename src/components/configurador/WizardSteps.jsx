import { Check } from 'lucide-react'

/**
 * Indicador de progreso del wizard (C-06).
 *
 * Muestra los 4 pasos con su estado (completado / actual / pendiente) y marca el
 * actual con `aria-current="step"`. Es de solo lectura: la navegación se hace con
 * los botones Atrás/Continuar.
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
        const status = index < current ? 'done' : index === current ? 'current' : 'pending'
        const isDone = status === 'done'
        const isCurrent = status === 'current'

        return (
          <li
            key={step.id}
            aria-current={isCurrent ? 'step' : undefined}
            className={`flex items-center gap-2 rounded-md border px-3 py-2 font-mono text-xs uppercase tracking-widest transition-colors ${
              isCurrent
                ? 'border-accent-green/60 text-accent-green box-glow-cyan'
                : isDone
                  ? 'border-accent-green/25 text-accent-green/70'
                  : 'border-dark-border text-gray-500'
            }`}
          >
            <span
              aria-hidden="true"
              className={`flex size-5 items-center justify-center rounded-full border text-[10px] ${
                isCurrent || isDone
                  ? 'border-accent-green/60 text-accent-green'
                  : 'border-dark-border text-gray-500'
              }`}
            >
              {isDone ? <Check className="size-3" /> : index + 1}
            </span>
            {step.label}
          </li>
        )
      })}
    </ol>
  )
}
