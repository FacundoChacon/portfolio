import { Minus, Plus } from 'lucide-react'

/**
 * Control de cantidad del servicio principal (C-07).
 *
 * Presentacional: recibe la cantidad y notifica los cambios. El mínimo real lo
 * impone `setQuantity` (C-05); acá se deshabilita "−" en 1 como feedback
 * inmediato. El deshabilitado se ve por fondo y borde, sin transparencia.
 */
const buttonClass =
  'flex size-11 items-center justify-center text-eva-paper hover:text-eva-orange focus-visible:text-eva-orange disabled:cursor-not-allowed disabled:bg-eva-line disabled:text-eva-gray disabled:hover:text-eva-gray'

export default function QuantityControl({ quantity = 1, onChange, className = '' }) {
  return (
    <div className={`inline-flex items-center border-2 border-eva-gray-dim bg-eva-black ${className}`}>
      <button
        type="button"
        aria-label="Restar una unidad"
        disabled={quantity <= 1}
        onClick={() => onChange(quantity - 1)}
        className={buttonClass}
      >
        <Minus className="size-4" aria-hidden="true" />
      </button>
      <span
        role="status"
        className="min-w-10 text-center font-mono text-sm text-eva-paper"
        aria-label={`Cantidad: ${quantity}`}
      >
        {quantity}
      </span>
      <button
        type="button"
        aria-label="Sumar una unidad"
        onClick={() => onChange(quantity + 1)}
        className={buttonClass}
      >
        <Plus className="size-4" aria-hidden="true" />
      </button>
    </div>
  )
}
