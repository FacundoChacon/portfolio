/**
 * Paso de error al enviar el presupuesto (C-10).
 *
 * Muestra mensaje de error con alternativas de contacto (mailto/WhatsApp)
 * según RN-AB-04.
 */
export default function ErrorStep({
  onRetry,
  contactEmail = 'chaconfacu2006@gmail.com',
  whatsappUrl = 'https://wa.me/?text=Hola Facundo, te quería consultar por el presupuesto del configurador',
}) {
  const subject = encodeURIComponent('Presupuesto web - Configurador')
  const body = encodeURIComponent(
    'Hola Facundo, intenté enviar el presupuesto desde el configurador pero falló. Te dejo mis datos para que me contactes. Gracias.'
  )
  const mailto = `mailto:${contactEmail}?subject=${subject}&body=${body}`

  return (
    <div className="glass p-6">
      <h2 className="font-display text-xl font-bold text-white">No se pudo enviar</h2>
      <p className="mt-2 text-sm text-gray-300">
        Ocurrió un error al enviar tu solicitud. Podés reintentar, o contactarme directamente por email o WhatsApp.
      </p>
      <div className="mt-4 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={onRetry}
          className="box-glow-cyan inline-flex items-center gap-2 rounded-md border border-accent-green/50 px-5 py-2 font-mono text-xs uppercase tracking-widest text-accent-green transition-colors hover:bg-accent-green hover:text-dark focus-visible:bg-accent-green focus-visible:text-dark"
        >
          Reintentar
        </button>
        <a
          href={mailto}
          className="inline-flex items-center gap-2 rounded-md border border-dark-border px-5 py-2 font-mono text-xs uppercase tracking-widest text-gray-400 transition-colors hover:border-accent-green/50 hover:text-accent-green focus-visible:text-accent-green"
        >
          Enviar email
        </a>
        <a
          href={whatsappUrl}
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-2 rounded-md border border-dark-border px-5 py-2 font-mono text-xs uppercase tracking-widest text-gray-400 transition-colors hover:border-accent-green/50 hover:text-accent-green focus-visible:text-accent-green"
        >
          WhatsApp
        </a>
      </div>
    </div>
  )
}