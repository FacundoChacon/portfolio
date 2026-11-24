import assert from 'node:assert/strict'
import test from 'node:test'

import { resolveHashTarget, shouldApplyHash } from '../src/utils/hashTarget.js'

test('resolveHashTarget: devuelve el id de un hash válido', () => {
  assert.equal(resolveHashTarget('#proyectos'), 'proyectos')
  assert.equal(resolveHashTarget('#contacto'), 'contacto')
  assert.equal(resolveHashTarget('#quien-soy'), 'quien-soy')
  assert.equal(resolveHashTarget('#proyectos-titulo'), 'proyectos-titulo')
})

test('resolveHashTarget: decodifica porcentajes y descarta lo vacío o inválido', () => {
  assert.equal(resolveHashTarget('#%70royectos'), 'proyectos')
  for (const bad of ['', '#', '#/', '#/ruta', '#a b', '#%E0%A4%A', '#<script>', '#a"b', '#a.b', "#a'b", undefined, null, 42, '#' + 'a'.repeat(100)]) {
    assert.equal(resolveHashTarget(bad), null, String(bad))
  }
})

test('shouldApplyHash: solo en una navegación nueva, no al volver/recargar', () => {
  assert.equal(shouldApplyHash('navigate'), true)
  assert.equal(shouldApplyHash(undefined), true)
  assert.equal(shouldApplyHash('back_forward'), false)
  assert.equal(shouldApplyHash('reload'), false)
  assert.equal(shouldApplyHash('prerender'), true)
})
