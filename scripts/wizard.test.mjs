/**
 * Tests unitarios del núcleo de estado del wizard (C-05).
 * Runner nativo de Node (`node:test`); sin dependencias.
 *
 * Uso: npm run test
 */
import assert from 'node:assert/strict'
import test from 'node:test'

import {
  FIELD_MAX_LENGTH,
  FIRST_STEP,
  HONEYPOT_FIELD,
  LAST_STEP,
  STATUS,
  STEPS,
  TOTAL_STEPS,
  clearSubmitError,
  createInitialState,
  getSelectedExtras,
  getService,
  goToStep,
  isLikelyBot,
  nextStep,
  prevStep,
  resolveSubmit,
  setForm,
  setQuantity,
  setService,
  setStatus,
  submit,
  toggleExtra,
  validateForm,
} from '../src/utils/wizard.js'

const SERVICES = [{ id: 'landing' }, { id: 'custom' }]
const EXTRAS = [
  { id: 'seo', recommended: false },
  { id: 'hosting', recommended: true },
  { id: 'maintenance', recommended: false },
]

const withContact = (form, patch = {}) =>
  setForm({ ...createInitialState(SERVICES, EXTRAS), step: STEPS.CONTACT, ...patch }, form)

// --- 3.1 Estado inicial -----------------------------------------------------

test('createInitialState: primer servicio, extras recommended, cantidad 1, paso 0', () => {
  const state = createInitialState(SERVICES, EXTRAS)
  assert.equal(state.serviceId, 'landing')
  assert.deepEqual(state.extras, ['hosting'])
  assert.equal(state.quantity, 1)
  assert.equal(state.step, FIRST_STEP)
  assert.deepEqual(state.form, { name: '', email: '', phone: '', project: '' })
  assert.equal(state.submitted, false)
  assert.equal(state.status, STATUS.IDLE)
})

test('createInitialState: sin catálogo no falla', () => {
  const state = createInitialState()
  assert.equal(state.serviceId, '')
  assert.deepEqual(state.extras, [])
})

test('constantes de pasos', () => {
  assert.equal(FIRST_STEP, 0)
  assert.equal(LAST_STEP, 3)
  assert.equal(TOTAL_STEPS, 4)
})

// --- 3.2 Selección y extras -------------------------------------------------

test('setService: cambia el servicio y conserva los extras (RN-PR-06)', () => {
  const before = createInitialState(SERVICES, EXTRAS)
  const after = setService(before, 'custom')
  assert.equal(after.serviceId, 'custom')
  assert.deepEqual(after.extras, before.extras)
})

test('setService: ignora un id inválido', () => {
  const state = createInitialState(SERVICES, EXTRAS)
  assert.equal(setService(state, '').serviceId, 'landing')
  assert.equal(setService(state, null).serviceId, 'landing')
})

test('toggleExtra: agrega, quita y no duplica', () => {
  const base = createInitialState(SERVICES, EXTRAS) // ['hosting']
  const added = toggleExtra(base, 'seo')
  assert.deepEqual(added.extras, ['hosting', 'seo'])

  const removed = toggleExtra(added, 'seo')
  assert.deepEqual(removed.extras, ['hosting'])

  const twice = toggleExtra(toggleExtra(base, 'seo'), 'seo')
  assert.deepEqual(twice.extras, ['hosting'])
})

// --- 3.3 Cantidad y formulario ----------------------------------------------

test('setQuantity: normaliza a entero ≥ 1', () => {
  const base = createInitialState(SERVICES, EXTRAS)
  assert.equal(setQuantity(base, 0).quantity, 1)
  assert.equal(setQuantity(base, -3).quantity, 1)
  assert.equal(setQuantity(base, 'abc').quantity, 1)
  assert.equal(setQuantity(base, null).quantity, 1)
  assert.equal(setQuantity(base, 2.7).quantity, 2)
  assert.equal(setQuantity(base, 5).quantity, 5)
})

test('setForm: actualiza un campo sin pisar el resto', () => {
  const base = createInitialState(SERVICES, EXTRAS)
  const withName = setForm(base, { name: 'Ana' })
  assert.equal(withName.form.name, 'Ana')
  assert.equal(withName.form.email, '')

  const withEmail = setForm(withName, { email: 'ana@example.com' })
  assert.deepEqual(withEmail.form, {
    name: 'Ana',
    email: 'ana@example.com',
    phone: '',
    project: '',
  })
})

// --- 3.4 Validación y navegación --------------------------------------------

test('FIELD_MAX_LENGTH: coincide con los límites del Apps Script desplegado (v2/v3)', () => {
  assert.deepEqual(FIELD_MAX_LENGTH, { name: 120, email: 254, phone: 40, project: 2000 })
})

const VALID = { name: 'Ana', email: 'ana@b.com', phone: '', project: '' }

test('validateForm: nombre pasado del límite da error y en el límite no', () => {
  assert.equal(validateForm({ ...VALID, name: 'a'.repeat(120) }).name, undefined)
  assert.equal(validateForm({ ...VALID, name: 'a'.repeat(121) }).name, 'Máximo 120 caracteres.')
})

test('validateForm: email pasado del límite da error y en el límite no', () => {
  const emailOf = (len) => `${'a'.repeat(len - 6)}@b.com`
  assert.equal(validateForm({ ...VALID, email: emailOf(254) }).email, undefined)
  assert.equal(validateForm({ ...VALID, email: emailOf(255) }).email, 'Máximo 254 caracteres.')
})

test('validateForm: teléfono pasado del límite da error y en el límite no', () => {
  assert.equal(validateForm({ ...VALID, phone: '1'.repeat(40) }).phone, undefined)
  assert.equal(validateForm({ ...VALID, phone: '1'.repeat(41) }).phone, 'Máximo 40 caracteres.')
})

test('validateForm: descripción pasada del límite da error y en el límite no', () => {
  assert.equal(validateForm({ ...VALID, project: 'x'.repeat(2000) }).project, undefined)
  assert.equal(validateForm({ ...VALID, project: 'x'.repeat(2001) }).project, 'Máximo 2000 caracteres.')
})

test('validateForm: el largo se mide sobre el valor recortado (igual que el payload)', () => {
  assert.equal(validateForm({ ...VALID, project: `  ${'x'.repeat(2000)}  ` }).project, undefined)
  assert.equal(validateForm({ ...VALID, name: `${'a'.repeat(121)}   ` }).name, 'Máximo 120 caracteres.')
})

test('validateForm: nombre vacío y email inválido', () => {
  assert.ok(validateForm({ name: '   ', email: 'a@b.com' }).name)
  assert.equal(validateForm({ name: '   ', email: 'a@b.com' }).email, undefined)
  assert.ok(validateForm({ name: 'Ana', email: 'no-es-email' }).email)
  assert.deepEqual(validateForm({ name: 'Ana', email: 'ana@b.com' }), {})
})

test('nextStep: avanza sin validar en los pasos de servicio y extras', () => {
  const service = createInitialState(SERVICES, EXTRAS)
  const extras = nextStep(service)
  assert.equal(extras.step, STEPS.EXTRAS)
  assert.equal(nextStep(extras).step, STEPS.CONTACT)
})

test('nextStep: bloquea en el paso de contacto con nombre vacío', () => {
  const state = withContact({ name: '', email: 'ana@example.com' })
  const result = nextStep(state)
  assert.equal(result.step, STEPS.CONTACT)
  assert.ok(result.errors.name)
})

test('nextStep: bloquea en el paso de contacto con email inválido', () => {
  const state = withContact({ name: 'Ana', email: 'no-es-email' })
  const result = nextStep(state)
  assert.equal(result.step, STEPS.CONTACT)
  assert.ok(result.errors.email)
  assert.equal(result.errors.name, undefined)
})

test('nextStep: avanza con datos válidos y limpia errores previos', () => {
  const state = withContact(
    { name: 'Ana', email: 'ana@example.com' },
    { errors: { name: 'Ingresá tu nombre.' } },
  )
  const result = nextStep(state)
  assert.equal(result.step, STEPS.REVIEW)
  assert.deepEqual(result.errors, {})
})

test('nextStep: no avanza más allá del último paso', () => {
  const state = { ...createInitialState(SERVICES, EXTRAS), step: LAST_STEP }
  assert.equal(nextStep(state).step, LAST_STEP)
})

test('prevStep: retrocede y no baja del primer paso (RN-EX-03)', () => {
  const state = { ...createInitialState(SERVICES, EXTRAS), step: STEPS.CONTACT }
  assert.equal(prevStep(state).step, STEPS.EXTRAS)
  assert.equal(prevStep({ ...state, step: FIRST_STEP }).step, FIRST_STEP)
})

test('prevStep: conserva el estado cargado', () => {
  let state = { ...createInitialState(SERVICES, EXTRAS), step: STEPS.REVIEW }
  state = setQuantity(state, 4)
  state = toggleExtra(state, 'seo')
  state = setForm(state, { name: 'Ana' })

  const back = prevStep(state)
  assert.equal(back.quantity, 4)
  assert.deepEqual(back.extras, ['hosting', 'seo'])
  assert.equal(back.form.name, 'Ana')
  assert.equal(back.serviceId, 'landing')
})

// --- Salto de paso (C-08) ---------------------------------------------------

test('goToStep: salta al paso pedido (Editar)', () => {
  const state = createInitialState(SERVICES, EXTRAS)
  assert.equal(goToStep(state, STEPS.EXTRAS).step, STEPS.EXTRAS)
  assert.equal(goToStep(state, STEPS.CONTACT).step, STEPS.CONTACT)
  assert.equal(goToStep(state, STEPS.REVIEW).step, STEPS.REVIEW)
})

test('goToStep: acota fuera de rango (RN-EX-03)', () => {
  const state = createInitialState(SERVICES, EXTRAS)
  assert.equal(goToStep(state, -5).step, FIRST_STEP)
  assert.equal(goToStep(state, 99).step, LAST_STEP)
})

test('goToStep: ignora valores no numéricos', () => {
  const state = { ...createInitialState(SERVICES, EXTRAS), step: STEPS.CONTACT }
  assert.equal(goToStep(state, 'abc').step, STEPS.CONTACT)
  assert.equal(goToStep(state, null).step, STEPS.CONTACT)
  assert.equal(goToStep(state, undefined).step, STEPS.CONTACT)
})

// --- 3.5 Envío --------------------------------------------------------------

const validState = () =>
  setForm(createInitialState(SERVICES, EXTRAS), { name: 'Ana', email: 'ana@example.com' })

test('submit: con datos válidos pasa a submitting sin marcar enviado', () => {
  const result = submit(validState())
  assert.equal(result.submitted, false)
  assert.equal(result.submitting, true)
  assert.equal(result.status, STATUS.SUBMITTING)
  assert.deepEqual(result.errors, {})
})

test('submit: campo trampa completo descarta en silencio', () => {
  const state = setForm(validState(), { [HONEYPOT_FIELD]: 'http://spam' })
  const result = submit(state)
  assert.equal(result.status, STATUS.SUCCESS)
  assert.equal(result.submitted, true)
  assert.equal(result.submitting, false)
  assert.deepEqual(result.errors, {})
})

test('submit: campo trampa completo con datos inválidos también devuelve success sin errores', () => {
  const state = setForm(createInitialState(SERVICES, EXTRAS), { [HONEYPOT_FIELD]: 'spam' })
  const result = submit(state)
  assert.equal(result.status, STATUS.SUCCESS)
  assert.equal(result.submitted, true)
  assert.deepEqual(result.errors, {})
})

test('submit: campo trampa vacío, con espacios o ausente sigue el flujo normal', () => {
  for (const value of ['', '   ']) {
    const valid = submit(setForm(validState(), { [HONEYPOT_FIELD]: value }))
    assert.equal(valid.status, STATUS.SUBMITTING)
    assert.equal(valid.submitting, true)

    const invalid = submit(setForm(createInitialState(SERVICES, EXTRAS), { [HONEYPOT_FIELD]: value }))
    assert.equal(invalid.status, STATUS.IDLE)
    assert.ok(invalid.errors.name)
  }
  assert.equal(submit(validState()).status, STATUS.SUBMITTING)
})

test('submit: campo trampa completo respeta los guards de envío en curso y ya enviado', () => {
  const trap = { [HONEYPOT_FIELD]: 'spam' }
  const sending = setForm({ ...validState(), submitting: true, status: STATUS.SUBMITTING }, trap)
  assert.equal(submit(sending), sending)
  const done = setForm({ ...validState(), submitted: true, status: STATUS.SUCCESS }, trap)
  assert.equal(submit(done), done)
})

test('isLikelyBot: solo un string con contenido dispara el descarte', () => {
  assert.equal(isLikelyBot({ [HONEYPOT_FIELD]: 'http://spam' }), true)
  assert.equal(isLikelyBot({ [HONEYPOT_FIELD]: '  x  ' }), true)
  assert.equal(isLikelyBot({ [HONEYPOT_FIELD]: '   ' }), false)
  assert.equal(isLikelyBot({ [HONEYPOT_FIELD]: 42 }), false)
  assert.equal(isLikelyBot({ [HONEYPOT_FIELD]: null }), false)
  assert.equal(isLikelyBot({}), false)
  assert.equal(isLikelyBot(undefined), false)
})

test('HONEYPOT_FIELD: no es un nombre que el autocompletado del navegador pueda llenar', () => {
  const AUTOFILLABLE = [
    'company', 'organization', 'name', 'email', 'phone', 'tel',
    'address', 'given-name', 'family-name',
  ]
  assert.equal(AUTOFILLABLE.includes(HONEYPOT_FIELD), false)
  assert.equal(typeof HONEYPOT_FIELD, 'string')
  assert.ok(HONEYPOT_FIELD.length > 0)
})

test('submit: con datos inválidos no envía y expone errores', () => {
  const result = submit(createInitialState(SERVICES, EXTRAS))
  assert.equal(result.submitted, false)
  assert.equal(result.submitting, false)
  assert.equal(result.status, STATUS.IDLE)
  assert.ok(result.errors.name)
  assert.ok(result.errors.email)
})

test('submit: con datos válidos limpia errores previos', () => {
  const state = { ...validState(), errors: { name: 'x', email: 'y' } }
  assert.deepEqual(submit(state).errors, {})
})

test('submit: no-op si ya hay un envío en curso', () => {
  const state = { ...validState(), submitting: true, status: STATUS.SUBMITTING }
  assert.equal(submit(state), state)
})

test('submit: no-op si ya fue enviado con éxito', () => {
  const state = { ...validState(), submitted: true, status: STATUS.SUCCESS }
  assert.equal(submit(state), state)
})

test('submit: con envío en curso y datos inválidos sigue siendo no-op', () => {
  const state = { ...createInitialState(SERVICES, EXTRAS), submitting: true, status: STATUS.SUBMITTING }
  const result = submit(state)
  assert.equal(result, state)
  assert.deepEqual(result.errors, {})
})

test('resolveSubmit: success marca enviado y libera el envío en curso', () => {
  const result = resolveSubmit(submit(validState()), 'success')
  assert.equal(result.status, STATUS.SUCCESS)
  assert.equal(result.submitted, true)
  assert.equal(result.submitting, false)
})

test('resolveSubmit: error libera el envío, no marca enviado y conserva datos', () => {
  const sending = submit({ ...validState(), serviceId: 'custom', quantity: 3 })
  const result = resolveSubmit(sending, 'error')
  assert.equal(result.status, STATUS.ERROR)
  assert.equal(result.submitted, false)
  assert.equal(result.submitting, false)
  assert.equal(result.serviceId, 'custom')
  assert.equal(result.quantity, 3)
  assert.deepEqual(result.extras, sending.extras)
  assert.deepEqual(result.form, sending.form)
})

test('resolveSubmit: resultado desconocido devuelve el mismo estado', () => {
  const sending = submit(validState())
  assert.equal(resolveSubmit(sending, 'nope'), sending)
  assert.equal(resolveSubmit(sending, undefined), sending)
})

test('reintento: tras un error submit vuelve a submitting', () => {
  const failed = resolveSubmit(submit(validState()), STATUS.ERROR)
  const retry = submit(failed)
  assert.equal(retry.status, STATUS.SUBMITTING)
  assert.equal(retry.submitting, true)
})

test('reintento: tras un éxito submit es no-op', () => {
  const done = resolveSubmit(submit(validState()), STATUS.SUCCESS)
  assert.equal(submit(done), done)
})

test('clearSubmitError: desde error vuelve a idle en revisión conservando datos', () => {
  const failed = resolveSubmit(
    submit({ ...validState(), step: STEPS.CONTACT, quantity: 2 }),
    STATUS.ERROR,
  )
  const result = clearSubmitError(failed)
  assert.equal(result.status, STATUS.IDLE)
  assert.equal(result.step, STEPS.REVIEW)
  assert.equal(result.submitted, false)
  assert.equal(result.quantity, 2)
  assert.deepEqual(result.form, failed.form)
})

test('clearSubmitError: fuera de error devuelve el mismo estado', () => {
  const idle = validState()
  const sending = submit(idle)
  const done = resolveSubmit(sending, STATUS.SUCCESS)
  for (const state of [idle, sending, done]) {
    assert.equal(clearSubmitError(state), state)
  }
})

// --- Bloqueo de navegación y edición durante el envío (D6) -------------------

const sendingState = (patch = {}) => submit({ ...validState(), step: STEPS.REVIEW, ...patch })

test('bloqueo: nextStep, prevStep y goToStep son no-op (mismo objeto) con submitting', () => {
  const sending = sendingState()
  assert.equal(sending.submitting, true)
  assert.equal(nextStep(sending), sending)
  assert.equal(prevStep(sending), sending)
  assert.equal(goToStep(sending, STEPS.SERVICE), sending)
  const midway = { ...sending, step: STEPS.EXTRAS }
  assert.equal(nextStep(midway), midway)
  assert.equal(prevStep(midway), midway)
})

test('bloqueo: nextStep, prevStep y goToStep siguen funcionando sin envío en curso', () => {
  const idle = { ...validState(), step: STEPS.EXTRAS }
  assert.equal(nextStep(idle).step, STEPS.CONTACT)
  assert.equal(prevStep(idle).step, STEPS.SERVICE)
  assert.equal(goToStep(idle, STEPS.REVIEW).step, STEPS.REVIEW)
})

test('bloqueo: setForm, setService, toggleExtra y setQuantity son no-op (mismo objeto) con submitting', () => {
  const sending = sendingState()
  assert.equal(setForm(sending, { name: 'Otra' }), sending)
  assert.equal(setService(sending, 'custom'), sending)
  assert.equal(toggleExtra(sending, 'seo'), sending)
  assert.equal(setQuantity(sending, 5), sending)
  assert.equal(sending.form.name, 'Ana')
  assert.equal(sending.serviceId, 'landing')
  assert.deepEqual(sending.extras, ['hosting'])
  assert.equal(sending.quantity, 1)
})

test('bloqueo: setForm, setService, toggleExtra y setQuantity siguen funcionando sin envío en curso', () => {
  const idle = validState()
  assert.equal(setForm(idle, { name: 'Otra' }).form.name, 'Otra')
  assert.equal(setService(idle, 'custom').serviceId, 'custom')
  assert.deepEqual(toggleExtra(idle, 'seo').extras, ['hosting', 'seo'])
  assert.equal(setQuantity(idle, 5).quantity, 5)
})

test('bloqueo: tras resolveSubmit con error la navegación y la edición vuelven a funcionar', () => {
  const failed = resolveSubmit(sendingState(), STATUS.ERROR)
  assert.equal(prevStep(failed).step, STEPS.CONTACT)
  assert.equal(goToStep(failed, STEPS.SERVICE).step, STEPS.SERVICE)
  assert.equal(setForm(failed, { name: 'Otra' }).form.name, 'Otra')
  assert.equal(setQuantity(failed, 3).quantity, 3)
})

test('bloqueo: no afecta a submit, resolveSubmit, clearSubmitError ni setStatus', () => {
  const sending = sendingState()
  assert.equal(submit(sending), sending)
  assert.equal(resolveSubmit(sending, STATUS.ERROR).status, STATUS.ERROR)
  assert.equal(setStatus(sending, STATUS.ERROR).status, STATUS.ERROR)
  const failed = resolveSubmit(sending, STATUS.ERROR)
  assert.equal(clearSubmitError(failed).status, STATUS.IDLE)
})

test('setStatus: resuelve el envío a success o error e ignora valores inválidos', () => {
  const state = submit(
    setForm(createInitialState(SERVICES, EXTRAS), { name: 'Ana', email: 'ana@example.com' }),
  )
  assert.equal(setStatus(state, STATUS.SUCCESS).status, STATUS.SUCCESS)
  assert.equal(setStatus(state, STATUS.ERROR).status, STATUS.ERROR)
  assert.equal(setStatus(state, 'nope').status, STATUS.SUBMITTING)
})

// --- Selectores y pureza ----------------------------------------------------

test('selectores: resuelven servicio y extras desde el catálogo', () => {
  const state = createInitialState(SERVICES, EXTRAS)
  assert.deepEqual(getService(state, SERVICES), { id: 'landing' })
  assert.deepEqual(getSelectedExtras(state, EXTRAS), [{ id: 'hosting', recommended: true }])
})

test('selectores: devuelven null/[] si el catálogo está vacío', () => {
  const state = createInitialState()
  assert.equal(getService(state, SERVICES), null)
  assert.deepEqual(getSelectedExtras(state, EXTRAS), [])
})

test('las acciones no mutan el estado previo', () => {
  const state = createInitialState(SERVICES, EXTRAS)
  const snapshot = structuredClone(state)

  setService(state, 'custom')
  toggleExtra(state, 'seo')
  setQuantity(state, 5)
  setForm(state, { name: 'Ana' })
  nextStep(state)
  prevStep(state)
  goToStep(state, STEPS.REVIEW)
  submit(state)
  submit(setForm(state, { [HONEYPOT_FIELD]: 'spam' }))
  resolveSubmit(state, 'error')
  clearSubmitError({ ...state, status: 'error' })

  assert.deepEqual(state, snapshot)
})
