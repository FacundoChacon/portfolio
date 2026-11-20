/**
 * Tests de los helpers de vista del wizard (C-11): clave de vista, movimiento
 * de foco, mensaje de región viva y copy de éxito. Runner nativo `node:test`.
 */
import assert from 'node:assert/strict'
import test from 'node:test'

import { buildSuccessMessage, getLiveMessage, getViewKey, shouldMoveFocus } from '../src/utils/wizardView.js'

test('getViewKey: un paso en idle devuelve step-N', () => {
  assert.equal(getViewKey({ step: 2, status: 'idle' }), 'step-2')
})

test('getViewKey: success y error priorizan sobre el paso', () => {
  assert.equal(getViewKey({ step: 3, status: 'success' }), 'success')
  assert.equal(getViewKey({ step: 3, status: 'error' }), 'error')
  assert.equal(getViewKey({ step: 3, status: 'submitting' }), 'step-3')
})

test('shouldMoveFocus: solo cuando la vista cambia entre claves existentes', () => {
  assert.equal(shouldMoveFocus('step-0', 'step-1'), true)
  assert.equal(shouldMoveFocus('step-1', 'step-1'), false)
  assert.equal(shouldMoveFocus(null, 'step-0'), false)
  assert.equal(shouldMoveFocus(undefined, 'step-0'), false)
  assert.equal(shouldMoveFocus('step-3', 'success'), true)
  assert.equal(shouldMoveFocus('error', 'step-3'), true)
})

test('getLiveMessage: anuncia solo el envío en curso', () => {
  assert.equal(getLiveMessage({ submitting: true, status: 'submitting' }), 'Enviando tu solicitud…')
  assert.equal(getLiveMessage({ submitting: false, status: 'idle' }), '')
  assert.equal(getLiveMessage({ submitting: false, status: 'success' }), '')
  assert.equal(getLiveMessage({ submitting: false, status: 'error' }), '')
})

test('buildSuccessMessage: saluda por el nombre recortado, en primera persona', () => {
  assert.deepEqual(buildSuccessMessage('Martina'), {
    title: '¡Solicitud enviada!',
    body: '¡Gracias, Martina! Te respondo por email a la brevedad.',
  })
  assert.equal(
    buildSuccessMessage('  Ana  ').body,
    '¡Gracias, Ana! Te respondo por email a la brevedad.',
  )
})

test('buildSuccessMessage: sin nombre válido no usa texto de relleno', () => {
  for (const name of ['', '   ', undefined, 42]) {
    const { body } = buildSuccessMessage(name)
    assert.equal(body, '¡Gracias! Te respondo por email a la brevedad.')
    assert.equal(body.includes('el equipo'), false)
  }
})
