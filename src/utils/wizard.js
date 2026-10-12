/**
 * Núcleo de estado del wizard del Configurador de Presupuestos Web (C-05).
 *
 * Máquina de estados pura: sin React ni DOM. El hook `useConfigurador`
 * (`src/hooks/useConfigurador.js`) la envuelve con `useState`. Mantener el
 * núcleo separado permite testear las reglas con `node:test` sin
 * testing-library ni jsdom (que el proyecto no instala).
 *
 * @typedef {Object} ContactForm
 * @property {string} name     Nombre (obligatorio).
 * @property {string} email    Email (obligatorio, formato válido).
 * @property {string} phone    Teléfono (opcional).
 * @property {string} project  Descripción del proyecto (opcional).
 *
 * @typedef {Object} FormErrors
 * @property {string} [name]
 * @property {string} [email]
 *
 * @typedef {'idle'|'submitting'|'success'|'error'} Status
 *
 * @typedef {Object} WizardState
 * @property {number} step         Paso actual (0..3).
 * @property {string} serviceId    Tipo de sitio seleccionado.
 * @property {string[]} extras     Ids de los extras seleccionados.
 * @property {number} quantity     Unidades del servicio (entero ≥ 1).
 * @property {ContactForm} form    Datos de contacto.
 * @property {FormErrors} errors   Errores de validación vigentes.
 * @property {boolean} submitted   Si el presupuesto fue enviado.
 * @property {Status} status       Estado del ciclo de envío.
 */

/** Pasos del wizard (0-indexados). */
export const STEPS = {
  SERVICE: 0,
  EXTRAS: 1,
  CONTACT: 2,
  REVIEW: 3,
}

/** Primer paso del wizard. */
export const FIRST_STEP = 0
/** Último paso del wizard (resumen). */
export const LAST_STEP = 3
/** Cantidad total de pasos. */
export const TOTAL_STEPS = 4

/** Estados del ciclo de envío. */
export const STATUS = {
  IDLE: 'idle',
  SUBMITTING: 'submitting',
  SUCCESS: 'success',
  ERROR: 'error',
}

/**
 * Nombre del campo trampa (honeypot, RN-AB-01). Es la única fuente de verdad:
 * el formulario (C-08) lo renderiza oculto y el guard antiabuso (C-11) lo lee.
 * No forma parte del modelo `ContactForm` a propósito (el test de C-05 hace
 * `deepEqual` del formulario vacío); se lee como `form[HONEYPOT_FIELD]`
 * (ausente → `undefined` → no dispara). `setForm` ya hace merge de parches, así
 * que el valor se persiste sin tocar el modelo.
 */
export const HONEYPOT_FIELD = 'company'

/** Formato de email aceptado por RN-VL-01 (no exhaustivo, suficiente por diseño). */
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

/** Estados de envío válidos. */
const VALID_STATUSES = Object.values(STATUS)

/**
 * Crea un formulario de contacto vacío.
 * @returns {ContactForm}
 */
const createEmptyForm = () => ({ name: '', email: '', phone: '', project: '' })

/**
 * Devuelve el estado inicial del wizard (RN-VL-03 / preselección del roadmap):
 * primer tipo de sitio, extras marcados como `recommended`, cantidad 1, primer
 * paso, formulario vacío y estado `idle`.
 *
 * @param {{id: string, recommended?: boolean}[]} [services]
 * @param {{id: string, recommended?: boolean}[]} [extras]
 * @returns {WizardState}
 */
export function createInitialState(services = [], extras = []) {
  return {
    step: FIRST_STEP,
    serviceId: services[0]?.id ?? '',
    extras: extras.filter((extra) => extra?.recommended === true).map((extra) => extra.id),
    quantity: 1,
    form: createEmptyForm(),
    errors: {},
    submitted: false,
    status: STATUS.IDLE,
  }
}

/**
 * Valida los datos de contacto (RN-VL-01/02): nombre no vacío y email con
 * formato válido. Teléfono y descripción son opcionales.
 *
 * @param {Partial<ContactForm>} [form]
 * @returns {FormErrors}
 */
export function validateForm(form = {}) {
  const errors = {}
  const name = typeof form.name === 'string' ? form.name.trim() : ''
  const email = typeof form.email === 'string' ? form.email.trim() : ''

  if (!name) errors.name = 'Ingresá tu nombre.'
  if (!email) errors.email = 'Ingresá tu email.'
  else if (!EMAIL_RE.test(email)) errors.email = 'Ingresá un email válido.'

  return errors
}

/**
 * Selecciona un tipo de sitio (exactamente uno). No altera los extras ya
 * seleccionados (RN-PR-06).
 *
 * @param {WizardState} state
 * @param {string} serviceId
 * @returns {WizardState}
 */
export function setService(state, serviceId) {
  if (typeof serviceId !== 'string' || serviceId.length === 0) return state
  return { ...state, serviceId }
}

/**
 * Marca o desmarca un extra por alternancia, sin duplicados.
 *
 * @param {WizardState} state
 * @param {string} extraId
 * @returns {WizardState}
 */
export function toggleExtra(state, extraId) {
  if (typeof extraId !== 'string' || extraId.length === 0) return state
  const selected = state.extras.includes(extraId)
  return {
    ...state,
    extras: selected
      ? state.extras.filter((id) => id !== extraId)
      : [...state.extras, extraId],
  }
}

/**
 * Fija la cantidad como entero ≥ 1 (RN-QT-01). Valores no numéricos, menores a
 * 1 o con decimales se normalizan (`Math.floor`, mínimo 1).
 *
 * @param {WizardState} state
 * @param {unknown} quantity
 * @returns {WizardState}
 */
export function setQuantity(state, quantity) {
  const normalized = Math.floor(Number(quantity))
  return {
    ...state,
    quantity: Number.isFinite(normalized) && normalized >= 1 ? normalized : 1,
  }
}

/**
 * Actualiza parcialmente los datos de contacto sin pisar el resto.
 *
 * @param {WizardState} state
 * @param {Partial<ContactForm>} [patch]
 * @returns {WizardState}
 */
export function setForm(state, patch = {}) {
  return { ...state, form: { ...state.form, ...patch } }
}

/**
 * Avanza un paso. Desde el paso de contacto (2) valida los datos: si hay
 * errores no avanza y los expone (RN-VL-01/04); con datos válidos avanza y los
 * limpia. En el último paso es no-op.
 *
 * @param {WizardState} state
 * @returns {WizardState}
 */
export function nextStep(state) {
  if (state.step >= LAST_STEP) return state

  if (state.step === STEPS.CONTACT) {
    const errors = validateForm(state.form)
    if (Object.keys(errors).length > 0) return { ...state, errors }
    return { ...state, errors: {}, step: state.step + 1 }
  }

  return { ...state, step: state.step + 1 }
}

/**
 * Retrocede un paso sin perder el estado cargado, sin bajar del primer paso
 * (RN-EX-03).
 *
 * @param {WizardState} state
 * @returns {WizardState}
 */
export function prevStep(state) {
  return { ...state, step: Math.max(FIRST_STEP, state.step - 1) }
}

/**
 * Salta a un paso arbitrario (usado por los botones "Editar" del paso de
 * revisión, RN-EX-03). Solo acepta pasos numéricos enteros y acota al rango
 * del wizard; cualquier otro valor (incluido `null`, que en JavaScript coerci
 * a 0) es no-op. No valida: quien salta sabe a dónde va, y RN-EX-03 garantiza
 * que el estado cargado no se pierde.
 *
 * @param {WizardState} state
 * @param {unknown} target
 * @returns {WizardState}
 */
export function goToStep(state, target) {
  if (typeof target !== 'number' || !Number.isInteger(target)) return state
  const step = Math.min(LAST_STEP, Math.max(FIRST_STEP, target))
  return { ...state, step }
}

/**
 * Inicia el envío. Con datos válidos marca el presupuesto como enviado y pasa a
 * `submitting`; con datos inválidos no lo envía y expone los errores. La
 * resolución (`success`/`error`) la informa la capa de transporte con
 * `setStatus` (C-10).
 *
 * @param {WizardState} state
 * @returns {WizardState}
 */
export function submit(state) {
  const errors = validateForm(state.form)
  if (Object.keys(errors).length > 0) {
    return { ...state, errors, submitted: false, status: STATUS.IDLE }
  }
  return { ...state, errors: {}, submitted: true, status: STATUS.SUBMITTING }
}

/**
 * Fija el estado del ciclo de envío. Ignora valores desconocidos.
 *
 * @param {WizardState} state
 * @param {Status|string} status
 * @returns {WizardState}
 */
export function setStatus(state, status) {
  return VALID_STATUSES.includes(status) ? { ...state, status } : state
}

/**
 * Resuelve el objeto del tipo de sitio seleccionado a partir del catálogo.
 *
 * @param {WizardState} state
 * @param {{id: string}[]} [services]
 * @returns {object|null}
 */
export function getService(state, services = []) {
  return services.find((service) => service.id === state.serviceId) ?? null
}

/**
 * Resuelve los objetos de los extras seleccionados, en el orden del catálogo.
 *
 * @param {WizardState} state
 * @param {{id: string}[]} [extras]
 * @returns {object[]}
 */
export function getSelectedExtras(state, extras = []) {
  return extras.filter((extra) => state.extras.includes(extra.id))
}
