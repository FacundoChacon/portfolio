import { PencilLine } from 'lucide-react'

import { BOTON_EDITAR, BOTON_PRIMARIO, PANEL } from './estilos.js'

/**
 * Paso 4: revisión de la solicitud (C-08 → extendido C-10).
 *
 * Presentacional: recibe el modelo de `buildReview` (bloques + summary), el
 * callback de edición (`onEdit(editStep)`), el callback de envío (`onSubmit`) y
 * estados de envío (`submitting`, `submitted`) y el email de contacto que se
 * muestra en el aviso de privacidad (C-11). Mientras `submitting`, los botones
 * "Editar" quedan deshabilitados.
 */
export default function ReviewStep({
  review,
  onEdit,
  onSubmit,
  submitting = false,
  submitted = false,
  contactEmail = '',
}) {
  const { blocks } = review
  const disabled = submitting || submitted
  const label = submitting ? 'Enviando...' : 'Enviar solicitud'

  return (
    <div className="space-y-4">
      {blocks.map((block, index) => (
        <section key={block.id} className={PANEL}>
          <span aria-hidden="true" className="eva-panel-label">
            REV {'//'} {String(index + 1).padStart(2, '0')}
          </span>

          <div className="flex items-center justify-between gap-3">
            <h3 className="font-eva-display text-lg font-black uppercase text-eva-paper font-stretch-condensed">
              {block.title}
            </h3>
            <button
              type="button"
              onClick={() => onEdit(block.editStep)}
              className={BOTON_EDITAR}
              disabled={submitting}
            >
              <PencilLine className="size-3.5" aria-hidden="true" /> Editar
            </button>
          </div>

          <dl className="mt-3 space-y-1.5 border-t-2 border-eva-line pt-3">
            {block.lines.map((line) => (
              <div key={line.label} className="flex items-baseline justify-between gap-4">
                <dt className="font-mono text-xs text-eva-gray">{line.label}</dt>
                <dd className="text-right text-sm text-eva-paper">{line.value}</dd>
              </div>
            ))}
          </dl>
        </section>
      ))}

      <p className="text-xs text-eva-gray">
        Es una solicitud sin cargo: te paso el presupuesto por email.
      </p>

      <p className="text-xs text-eva-gray">
        Uso tus datos solo para responder esta solicitud. No los comparto ni los uso para
        publicidad. Si querés que los borre, escribime a{' '}
        <a
          href={`mailto:${contactEmail}`}
          className="text-eva-primary-light underline underline-offset-2 hover:text-eva-paper"
        >
          {contactEmail}
        </a>
        .
      </p>

      <div className="flex justify-end">
        <button type="button" onClick={onSubmit} className={BOTON_PRIMARIO} disabled={disabled}>
          {label}
        </button>
      </div>
    </div>
  )
}
