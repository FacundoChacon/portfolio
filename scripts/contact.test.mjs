/**
 * Tests de los enlaces de contacto de respaldo (RN-AB-04).
 * Runner nativo de Node (`node:test`); sin dependencias.
 */
import assert from 'node:assert/strict'
import test from 'node:test'

import { buildWhatsAppUrl } from '../src/utils/contact.js'

test('buildWhatsAppUrl: arma wa.me con el número y el texto codificado', () => {
  assert.equal(
    buildWhatsAppUrl('5492615799062', 'Hola Facundo, ¿cómo va?'),
    'https://wa.me/5492615799062?text=Hola%20Facundo%2C%20%C2%BFc%C3%B3mo%20va%3F',
  )
})

test('buildWhatsAppUrl: normaliza el número dejando solo dígitos', () => {
  assert.equal(buildWhatsAppUrl('+54 9 261 579-9062', 'Hola'), 'https://wa.me/5492615799062?text=Hola')
})

test('buildWhatsAppUrl: sin texto no agrega el parámetro text', () => {
  assert.equal(buildWhatsAppUrl('5492615799062'), 'https://wa.me/5492615799062')
})

test('buildWhatsAppUrl: sin número válido devuelve null (no se muestra el botón)', () => {
  assert.equal(buildWhatsAppUrl(undefined, 'Hola'), null)
  assert.equal(buildWhatsAppUrl('', 'Hola'), null)
  assert.equal(buildWhatsAppUrl('  +  - ', 'Hola'), null)
})
