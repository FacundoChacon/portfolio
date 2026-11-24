/**
 * Paso de error al enviar el presupuesto (C-10).
 *
 * Muestra mensaje de error con alternativas de contacto (mailto/WhatsApp)
 * según RN-AB-04. Si recibe `onEdit`, ofrece volver a revisar los datos.
 * El botón de WhatsApp solo se muestra si hay `whatsappUrl` (número configurado).
 * Recibe `headingRef` para que la página le dé el foco al aparecer (C-11).
 */
import { TriangleAlert } from 'lucide-react'

import { BOTON_PRIMARIO, BOTON_SECUNDARIO, PANEL } from './estilos.js'

export default function ErrorStep({
  onRetry,
  onEdit,
  contactEmail = 'chaconfacu2006@gmail.com',
  whatsappUrl = null,
  headingRef = null,
}) {
  const subject = encodeURIComponent('Presupuesto web - Configurador')
  const body = encodeURIComponent(
    'Hola Facundo, intenté enviar el presupuesto desde el configurador pero falló. Te dejo mis datos para que me contactes. Gracias.'
  )
  const mailto = `mailto:${contactEmail}?subject=${subject}&body=${body}`

  return (
    <div className={PANEL}>
      <div aria-hidden="true" className="eva-stripes eva-stripes-error absolute inset-x-0 top-0 h-2" />
      <span aria-hidden="true" className="eva-panel-label eva-panel-label-error">
        ERR {'//'} ENVÍO
      </span>
      <p
        aria-hidden="true"
        className="mb-2 mt-2 flex items-center gap-2 font-mono text-xs uppercase tracking-widest text-eva-error"
      >
        <TriangleAlert className="size-4" aria-hidden="true" /> Transmisión fallida
      </p>
      <h2
        ref={headingRef}
        tabIndex={-1}
        className="font-eva-display text-2xl font-black uppercase text-eva-paper outline-none font-stretch-condensed"
      >
        No se pudo enviar
      </h2>
      <p className="mt-2 text-sm text-eva-gray">
        Ocurrió un error al enviar tu solicitud. Podés reintentar, o contactarme directamente por email o WhatsApp.
      </p>
      <div className="mt-4 flex flex-wrap gap-3">
        <button type="button" onClick={onRetry} className={BOTON_PRIMARIO}>
          Reintentar
        </button>
        {onEdit && (
          <button type="button" onClick={onEdit} className={BOTON_SECUNDARIO}>
            Revisar mis datos
          </button>
        )}
        <a href={mailto} className={BOTON_SECUNDARIO}>
          Enviar email
        </a>
        {whatsappUrl && (
          <a href={whatsappUrl} target="_blank" rel="noreferrer" className={BOTON_SECUNDARIO}>
            WhatsApp
          </a>
        )}
      </div>
    </div>
  )
}
