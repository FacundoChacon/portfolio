import { PencilLine } from 'lucide-react'

import BudgetTotals from './BudgetTotals.jsx'

/**
 * Paso 4: revisión del presupuesto (C-08 → extendido C-10).
 *
 * Presentacional: recibe el modelo de `buildReview` (bloques + summary), el
 * callback de edición (`onEdit(editStep)`), el callback de envío (`onSubmit`) y
 * estados de envío (`submitting`, `submitted`).
 */
const editButton =
  'inline-flex items-center gap-1.5 rounded-md border border-dark-border px-2.5 py-1 font-mono text-xs uppercase tracking-widest text-gray-400 transition-colors hover:border-accent-green/50 hover:text-accent-green focus-visible:text-accent-green'

const submitButton =
  'box-glow-cyan inline-flex items-center gap-2 rounded-md border border-accent-green/50 px-5 py-2 font-mono text-xs uppercase tracking-widest text-accent-green transition-colors hover:bg-accent-green hover:text-dark focus-visible:bg-accent-green focus-visible:text-dark disabled:cursor-not-allowed disabled:opacity-50'

export default function ReviewStep({ review, onEdit, onSubmit, submitting = false, submitted = false }) {
  const { blocks, summary } = review
  const disabled = submitting || submitted
  const label = submitting ? 'Enviando...' : 'Enviar solicitud'

  return (
    <div className="space-y-4">
      {blocks.map((block) => (
        <section key={block.id} className="glass p-4">
          <div className="flex items-center justify-between gap-3">
            <h3 className="font-display text-sm font-bold text-white">{block.title}</h3>
            <button type="button" onClick={() => onEdit(block.editStep)} className={editButton}>
              <PencilLine className="size-3.5" aria-hidden="true" /> Editar
            </button>
          </div>

          <dl className="mt-3 space-y-1.5 border-t border-dark-border pt-3">
            {block.lines.map((line) => (
              <div key={line.label} className="flex items-baseline justify-between gap-4">
                <dt className="text-xs text-gray-400">{line.label}</dt>
                <dd className="text-right text-sm text-white">{line.value}</dd>
              </div>
            ))}
          </dl>
        </section>
      ))}

      <section className="glass p-4">
        <BudgetTotals summary={summary} />
        <p className="mt-3 text-xs text-gray-500">
          Es una estimación no vinculante: el precio final se confirma por email.
        </p>
      </section>

      <div className="flex justify-end">
        <button type="button" onClick={onSubmit} className={submitButton} disabled={disabled}>
          {label}
        </button>
      </div>
    </div>
  )
}