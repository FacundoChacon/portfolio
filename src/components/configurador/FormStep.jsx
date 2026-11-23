import { FIELD_MAX_LENGTH, HONEYPOT_FIELD } from '../../utils/wizard.js'
import { claseCampo } from './estilos.js'

/**
 * Paso 3: datos de contacto (C-08).
 *
 * Presentacional: recibe `form`, `errors` y `onChange(patch)`. La validación la
 * hace `nextStep`/`submit` (C-05); acá solo se renderizan los mensajes con
 * `aria-invalid` + `aria-describedby` + `role="alert"` (RN-VL-04).
 */
const labelClass = 'mb-1 block font-mono text-xs uppercase tracking-widest text-eva-gray'

/** Mensaje de error: marca textual ERR (aria-hidden) + mensaje; no depende del color. */
function FieldError({ id, error }) {
  if (!error) return null
  return (
    <p
      id={`${id}-error`}
      role="alert"
      className="mt-1 flex items-start gap-2 font-mono text-xs text-eva-paper"
    >
      <span aria-hidden="true" className="shrink-0 bg-eva-red px-1 text-eva-black">
        ERR
      </span>
      {error}
    </p>
  )
}

function Field({ id, label, required = false, error, className = '', ...props }) {
  return (
    <div>
      <label htmlFor={id} className={labelClass}>
        {label}
        {required && <span className="text-eva-orange"> *</span>}
      </label>
      <input
        id={id}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? `${id}-error` : undefined}
        className={`${claseCampo(Boolean(error))} ${className}`}
        {...props}
      />
      <FieldError id={id} error={error} />
    </div>
  )
}

function TextArea({ id, label, error, className = '', ...props }) {
  return (
    <div>
      <label htmlFor={id} className={labelClass}>
        {label}
      </label>
      <textarea
        id={id}
        rows={3}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? `${id}-error` : undefined}
        className={`${claseCampo(Boolean(error))} ${className}`}
        {...props}
      />
      <FieldError id={id} error={error} />
    </div>
  )
}

export default function FormStep({ form = {}, errors = {}, onChange }) {
  const set = (field) => (event) => onChange({ [field]: event.target.value })

  return (
    <form className="space-y-4" noValidate onSubmit={(event) => event.preventDefault()}>
      <Field
        id="name"
        label="Nombre"
        required
        autoComplete="name"
        maxLength={FIELD_MAX_LENGTH.name}
        placeholder="Tu nombre"
        value={form.name ?? ''}
        onChange={set('name')}
        error={errors.name}
      />

      <Field
        id="email"
        label="Email"
        required
        type="email"
        autoComplete="email"
        maxLength={FIELD_MAX_LENGTH.email}
        placeholder="tu@email.com"
        value={form.email ?? ''}
        onChange={set('email')}
        error={errors.email}
      />

      <div className="grid gap-4 sm:grid-cols-2">
        <Field
          id="phone"
          label="Teléfono"
          type="tel"
          autoComplete="tel"
          maxLength={FIELD_MAX_LENGTH.phone}
          placeholder="+54 9 11 ..."
          value={form.phone ?? ''}
          onChange={set('phone')}
          error={errors.phone}
        />
        <div className="hidden sm:block" aria-hidden="true" />
      </div>

      <TextArea
        id="project"
        label="Descripción del proyecto"
        placeholder="Contame brevemente qué necesitás..."
        value={form.project ?? ''}
        maxLength={FIELD_MAX_LENGTH.project}
        onChange={set('project')}
        error={errors.project}
      />

      {/* Campo trampa (RN-AB-01): invisible para personas, presente para bots.
          Si viene completo, `submit` descarta el envío en silencio (ver wizard.js). */}
      <div className="sr-only" aria-hidden="true">
        <label htmlFor={HONEYPOT_FIELD}>No completar este campo</label>
        <input
          id={HONEYPOT_FIELD}
          name={HONEYPOT_FIELD}
          type="text"
          tabIndex={-1}
          autoComplete="off"
          value={form[HONEYPOT_FIELD] ?? ''}
          onChange={set(HONEYPOT_FIELD)}
        />
      </div>
    </form>
  )
}