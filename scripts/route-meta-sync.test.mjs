import test from 'node:test'
import assert from 'node:assert/strict'
import { applyRouteMeta } from '../src/utils/routeMeta.js'
import { resolveRouteMeta } from '../src/data/seo.js'

/** Documento falso: `title` + `querySelector` sobre un mapa de elementos con atributos. */
function fakeDoc({ canonical = true, description = true } = {}) {
  const elements = {}
  if (description) elements['meta[name="description"]'] = { content: 'vieja', setAttribute(n, v) { this[n] = v } }
  if (canonical) elements['link[rel="canonical"]'] = { href: 'vieja', setAttribute(n, v) { this[n] = v } }
  return { title: 'vieja', elements, querySelector: (selector) => elements[selector] ?? null }
}

test('applyRouteMeta: actualiza title, description y canonical', () => {
  const doc = fakeDoc()
  applyRouteMeta(doc, resolveRouteMeta('/configurador'))
  assert.equal(doc.title, 'Armá tu presupuesto web | Facundo Chacón')
  assert.match(doc.elements['meta[name="description"]'].content, /^Elegí el tipo de sitio/)
  assert.equal(doc.elements['link[rel="canonical"]'].href, 'https://www.facucode.dev/configurador')
})

test('applyRouteMeta: home -> configurador -> home restaura los valores de la home', () => {
  const doc = fakeDoc()
  const home = resolveRouteMeta('/')
  applyRouteMeta(doc, home)
  applyRouteMeta(doc, resolveRouteMeta('/configurador'))
  applyRouteMeta(doc, resolveRouteMeta('/'))
  assert.equal(doc.title, home.title)
  assert.equal(doc.elements['meta[name="description"]'].content, home.description)
  assert.equal(doc.elements['link[rel="canonical"]'].href, 'https://www.facucode.dev/')
})

test('applyRouteMeta: sin canonical ni description no lanza ni crea elementos', () => {
  const doc = fakeDoc({ canonical: false, description: false })
  assert.doesNotThrow(() => applyRouteMeta(doc, resolveRouteMeta('/configurador')))
  assert.equal(doc.title, 'Armá tu presupuesto web | Facundo Chacón')
  assert.deepEqual(Object.keys(doc.elements), [])
})

test('applyRouteMeta: ruta desconocida deja la meta de la home', () => {
  const doc = fakeDoc()
  applyRouteMeta(doc, resolveRouteMeta('/foo'))
  assert.equal(doc.title, resolveRouteMeta('/').title)
})
