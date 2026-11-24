import { Check } from 'lucide-react'

import { claseIndicador, claseModulo, codigoModulo } from './estilos.js'

/**
 * Paso 2: selección de extras (C-07).
 *
 * Presentacional: recibe el catálogo de extras, los ids seleccionados y el
 * callback de alternancia. El disclaimer del extra (RN-HD-03) se muestra dentro
 * de la tarjeta, siempre visible. El estado seleccionado se expresa por forma
 * (indicador con tilde y sombra desplazada) además de por color.
 */
export default function ExtrasCards({ extras = [], selectedIds = [], onToggle }) {
  return (
    <ul className="grid gap-3 sm:grid-cols-2">
      {extras.map((extra, index) => {
        const selected = selectedIds.includes(extra.id)

        return (
          <li key={extra.id}>
            <button
              type="button"
              aria-pressed={selected}
              onClick={() => onToggle(extra.id)}
              className={claseModulo(selected)}
            >
              <div className="flex items-center justify-between gap-3">
                <span aria-hidden="true" className="font-mono text-xs tracking-widest text-eva-gray">
                  {codigoModulo('EXT', index)}
                </span>
                <span aria-hidden="true" className={claseIndicador(selected)}>
                  {selected && <Check className="size-4" strokeWidth={3} />}
                </span>
              </div>

              <h3 className="mt-3 font-eva-display text-base font-black uppercase text-eva-paper font-stretch-condensed">
                {extra.name}
              </h3>

              <p className="mt-1 text-sm text-eva-gray">{extra.description}</p>

              {extra.disclaimer && (
                <p className="mt-2 border-l-4 border-eva-secondary bg-eva-black px-2.5 py-2 text-xs text-eva-paper">
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
