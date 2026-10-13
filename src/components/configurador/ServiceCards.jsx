import { resolveServiceIcon } from './serviceIcons.js'

/**
 * Paso 1: elección del tipo de sitio (C-07).
 *
 * Presentacional: recibe el catálogo, el id seleccionado y el callback de
 * selección. La unicidad de la selección la garantiza `setService` (C-05).
 */
export default function ServiceCards({ services = [], selectedId, onSelect }) {
  return (
    <ul className="grid gap-3 sm:grid-cols-2">
      {services.map((service) => {
        const Icon = resolveServiceIcon(service.icon)
        const selected = service.id === selectedId

        return (
          <li key={service.id}>
            <button
              type="button"
              aria-pressed={selected}
              onClick={() => onSelect(service.id)}
              className={`h-full w-full rounded-xl border p-4 text-left transition-colors ${
                selected
                  ? 'box-glow-cyan border-accent-green/60 bg-accent-green/5'
                  : 'border-dark-border bg-dark-card/60 hover:border-accent-green/30'
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <span
                  className={`flex size-9 shrink-0 items-center justify-center rounded-lg border ${
                    selected
                      ? 'border-accent-green/50 text-accent-green'
                      : 'border-dark-border text-gray-400'
                  }`}
                >
                  <Icon className="size-5" aria-hidden="true" />
                </span>
                {service.tag && <span className="tag">{service.tag}</span>}
              </div>

              <h3 className="mt-3 font-display text-base font-bold text-white">{service.name}</h3>
              <p className="mt-1 text-sm text-gray-400">{service.description}</p>
            </button>
          </li>
        )
      })}
    </ul>
  )
}
