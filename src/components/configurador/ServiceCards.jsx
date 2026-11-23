import { Check } from 'lucide-react'

import { claseIndicador, claseModulo, codigoModulo } from './estilos.js'
import { resolveServiceIcon } from './serviceIcons.js'

/**
 * Paso 1: elección del tipo de sitio (C-07).
 *
 * Presentacional: recibe el catálogo, el id seleccionado y el callback de
 * selección. La unicidad de la selección la garantiza `setService` (C-05).
 * El estado seleccionado se expresa por forma (indicador con tilde y sombra
 * desplazada) además de por color.
 */
export default function ServiceCards({ services = [], selectedId, onSelect }) {
  return (
    <ul className="grid gap-3 sm:grid-cols-2">
      {services.map((service, index) => {
        const Icon = resolveServiceIcon(service.icon)
        const selected = service.id === selectedId

        return (
          <li key={service.id}>
            <button
              type="button"
              aria-pressed={selected}
              onClick={() => onSelect(service.id)}
              className={claseModulo(selected)}
            >
              <div className="flex items-center justify-between gap-3">
                <span aria-hidden="true" className="font-mono text-xs tracking-widest text-eva-gray">
                  {codigoModulo('TIPO', index)}
                </span>
                <span aria-hidden="true" className={claseIndicador(selected)}>
                  {selected && <Check className="size-4" strokeWidth={3} />}
                </span>
              </div>

              <div className="mt-3 flex items-start justify-between gap-3">
                <span
                  className={`flex size-10 shrink-0 items-center justify-center border-2 ${
                    selected ? 'border-eva-orange text-eva-orange' : 'border-eva-gray-dim text-eva-gray'
                  }`}
                >
                  <Icon className="size-5" aria-hidden="true" />
                </span>
                {service.tag && <span className="eva-tag">{service.tag}</span>}
              </div>

              <h3 className="mt-3 font-eva-display text-lg font-black uppercase text-eva-paper font-stretch-condensed">
                {service.name}
              </h3>
              <p className="mt-1 text-sm text-eva-gray">{service.description}</p>
            </button>
          </li>
        )
      })}
    </ul>
  )
}
