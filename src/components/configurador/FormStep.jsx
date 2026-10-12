import { HONEYPOT_FIELD } from '../../utils/wizard.js'

/**
 * Paso 3: datos de contacto (C-08).
 *
 * Presentacional: recibe `form`, `errors` y `onChange(patch)`. La validación la
 * hace `nextStep`/`submit` (C-05); acá solo se renderizan los mensajes con
 * `aria-invalid` + `aria-describedby` + `role="alert"` (RN-VL-04).
 */
const inputClass = (hasError) =>
  `w-full rounded-md border bg-dark-card/60 px-3 py-2 text-sm text-white placeholder:text-gray-600 transition-colors focus:outline-none ${
    hasError
      ? 'border-accent-pink/60 focus:border-accent-pink/80'
      : 'border-dark-border focus:border-accent-green/60'
  }`

function FieldError({ id, error }) {
  if (!error) return null
  return (
    <p id={`${id}-error`} role="alert" className="mt-1 text-xs text-accent-pink">
      {error}
    </p>
  )
}

function Field({ id, label, required = false, error, className = '', ...props }) {
  return (
    <div>
      <label
        htmlFor={id}
        className="mb-1 block text-xs font-medium uppercase tracking-widest text-gray-400"
      >
        {label}
        {required && <span className="text-accent-pink"> *</span>}
      </label>
      <input
        id={id}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? `${id}-error` : undefined}
        className={`${inputClass(Boolean(error))} ${className}`}
        {...props}
      />
      <FieldError id={id} error={error} />
    </div>
  )
}

function TextArea({ id, label, error, className = '', ...props }) {
  return (
    <div>
      <label
        htmlFor={id}
        className="mb-1 block text-xs font-medium uppercase tracking-widest text-gray-400"
      >
        {label}
      </label>
      <textarea
        id={id}
        rows={3}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? `${id}-error` : undefined}
        className={`${inputClass(Boolean(error))} ${className}`}
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
          placeholder="+54 9 11 ..."
          value={form.phone ?? ''}
          onChange={set('phone')}
        />
        <div className="hidden sm:block" aria-hidden="true" />
      </div>

      <TextArea
        id="project"
        label="Descripción del proyecto"
        placeholder="Contame brevemente qué necesitás..."
        value={form.project ?? ''}
        onChange={set('project')}
      />

      {/* Campo trampa (RN-AB-01): invisible para personas, presente para bots.
          El guard activo (descarte silencioso) lo implementa C-11. */}
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