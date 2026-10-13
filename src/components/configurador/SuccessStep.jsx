/**
 * Paso de éxito al enviar el presupuesto (C-10).
 *
 * Muestra confirmación con el nombre del prospecto (US-008 CA-3) y un botón
 * para volver al inicio.
 */
import { Link } from 'react-router-dom'

export default function SuccessStep({ name = '' }) {
  const displayName = name?.trim() || 'el equipo'

  return (
    <div className="glass p-6">
      <h2 className="font-display text-xl font-bold text-white">¡Solicitud enviada!</h2>
      <p className="mt-2 text-sm text-gray-300">
        Gracias {displayName}. Te respondemos por email a la brevedad.
      </p>
      <div className="mt-4">
        <Link
          to="/"
          className="box-glow-cyan inline-flex items-center gap-2 rounded-md border border-accent-green/50 px-5 py-2 font-mono text-xs uppercase tracking-widest text-accent-green transition-colors hover:bg-accent-green hover:text-dark focus-visible:bg-accent-green focus-visible:text-dark"
        >
          Volver al inicio
        </Link>
      </div>
    </div>
  )
}