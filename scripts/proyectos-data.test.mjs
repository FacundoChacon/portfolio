import assert from 'node:assert/strict'
import { existsSync } from 'node:fs'
import test from 'node:test'

import { CONTACTO_ANCLA, GITHUB_PERFIL_URL, PROYECTOS } from '../src/data/proyectos.js'

const ESTADOS = new Set(['demo', 'live', 'inprogress'])

test('PROYECTOS: los cinco títulos en el orden actual', () => {
  assert.deepEqual(
    PROYECTOS.map((p) => p.title),
    ['Tienda-Electronica', 'CIMMA-Dentistry', 'Bodega', 'Odontologia-Carolina', '3-Esquinas'],
  )
})

for (const proyecto of PROYECTOS) {
  test(`PROYECTOS: ${proyecto.title} tiene los campos requeridos`, () => {
    assert.ok(ESTADOS.has(proyecto.status), `status inválido "${proyecto.status}" en ${proyecto.title}`)
    assert.ok(proyecto.description.trim().length > 0, 'description vacía')
    assert.ok(Array.isArray(proyecto.tags) && proyecto.tags.length > 0, 'tags vacío')
    assert.ok(proyecto.live || proyecto.repo, 'necesita live o repo')
    for (const url of [proyecto.live, proyecto.repo].filter(Boolean)) {
      assert.ok(url.startsWith('https://'), `URL no https en ${proyecto.title}: ${url}`)
    }
  })

  test(`PROYECTOS: ${proyecto.title} tiene imagen existente y dimensiones`, () => {
    assert.ok(proyecto.image.startsWith('/'), 'image debe empezar con /')
    assert.ok(existsSync(new URL(`../public${proyecto.image}`, import.meta.url)), `no existe public${proyecto.image}`)
    assert.ok(Number.isInteger(proyecto.imageWidth) && proyecto.imageWidth > 0, 'imageWidth inválido')
    assert.ok(Number.isInteger(proyecto.imageHeight) && proyecto.imageHeight > 0, 'imageHeight inválido')
  })
}

test('PROYECTOS: 3-Esquinas no tiene repositorio y Tienda-Electronica sí', () => {
  assert.equal(PROYECTOS.find((p) => p.title === '3-Esquinas').repo, undefined)
  assert.ok(PROYECTOS.find((p) => p.title === 'Tienda-Electronica').repo)
})

test('constantes de enlace', () => {
  assert.equal(GITHUB_PERFIL_URL, 'https://github.com/FacundoChacon')
  assert.equal(CONTACTO_ANCLA, '#contacto')
})
