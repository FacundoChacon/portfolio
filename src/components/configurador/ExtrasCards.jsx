import { Check } from 'lucide-react'

/**
 * Paso 2: selección de extras (C-07).
 *
 * Presentacional: recibe el catálogo de extras, los ids seleccionados y el
 * callback de alternancia. El disclaimer del extra (RN-HD-03) se muestra dentro
 * de la tarjeta, siempre visible.
 */
export default function ExtrasCards({ extras = [], selectedIds = [], onToggle }) {
  return (
    <ul className="grid gap-3 sm:grid-cols-2">
      {extras.map((extra) => {
        const selected = selectedIds.includes(extra.id)

        return (
          <li key={extra.id}>
            <button
              type="button"
              aria-pressed={selected}
              onClick={() => onToggle(extra.id)}
              className={`h-full w-full rounded-xl border p-4 text-left transition-colors ${
                selected
                  ? 'border-accent-green/60 bg-accent-green/5'
                  : 'border-dark-border bg-dark-card/60 hover:border-accent-green/30'
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <h3 className="font-display text-sm font-bold text-white">{extra.name}</h3>
                <span
                  className={`flex size-5 shrink-0 items-center justify-center rounded border ${
                    selected
                      ? 'border-accent-green bg-accent-green text-dark'
                      : 'border-dark-border'
                  }`}
                >
                  {selected && <Check className="size-3.5" aria-hidden="true" />}
                </span>
              </div>

              <p className="mt-1 text-sm text-gray-400">{extra.description}</p>

              {extra.disclaimer && (
                <p className="mt-2 rounded-md border border-accent-pink/30 bg-accent-pink/5 px-2.5 py-2 text-xs text-accent-pink/90">
                  {extra.disclaimer}
                </p>
              )}
            </button>
          </li>
        )
      })}
    </ul>
  )
}
