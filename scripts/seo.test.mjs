import test from 'node:test'
import assert from 'node:assert/strict'
import { OG_IMAGE, SITE_URL, ROUTES, canonicalUrl, resolveRouteMeta } from '../src/data/seo.js'

test('ROUTES: declara la home y el configurador', () => {
  const paths = ROUTES.map((r) => r.path)
  assert.deepEqual(paths, ['/', '/configurador'])
})

test('canonicalUrl: la home lleva barra final y el resto no', () => {
  assert.equal(canonicalUrl('/'), 'https://www.facucode.dev/')
  assert.equal(canonicalUrl('/configurador'), 'https://www.facucode.dev/configurador')
})

test('ROUTES: título <= 60, descripción <= 155 (incluidos los textos sociales)', () => {
  for (const route of ROUTES) {
    assert.ok(route.title.length <= 60, `${route.path}: título de ${route.title.length} caracteres`)
    for (const text of [route.description, route.socialDescription ?? route.description]) {
      assert.ok(text.length <= 155, `${route.path}: descripción de ${text.length} caracteres`)
    }
    assert.ok((route.socialTitle ?? route.title).length <= 60, `${route.path}: título social largo`)
  }
})

test('ROUTES: paths, títulos y canonical únicos entre rutas', () => {
  for (const key of ['path', 'title']) {
    assert.equal(new Set(ROUTES.map((r) => r[key])).size, ROUTES.length, `${key} repetido`)
  }
  assert.equal(new Set(ROUTES.map((r) => canonicalUrl(r.path))).size, ROUTES.length)
})

test('OG_IMAGE: URL absoluta del propio sitio y SITE_URL sin barra final', () => {
  assert.equal(OG_IMAGE, 'https://www.facucode.dev/og-image.png')
  assert.equal(SITE_URL.endsWith('/'), false)
})

test('ROUTES: la home conserva los textos vigentes y el configurador el copy confirmado', () => {
  const [home, configurador] = ROUTES
  assert.equal(home.title, 'Facundo Chacón | Desarrollador Full Stack Java / React')
  assert.equal(configurador.title, 'Armá tu presupuesto web | Facundo Chacón')
  assert.equal(
    configurador.description,
    'Elegí el tipo de sitio, sumá extras y pedime un presupuesto para tu página web. Te respondo por email.',
  )
})

test('resolveRouteMeta: /configurador con y sin barra final devuelve el configurador', () => {
  assert.equal(resolveRouteMeta('/configurador').path, '/configurador')
  assert.equal(resolveRouteMeta('/configurador/').path, '/configurador')
  assert.equal(resolveRouteMeta('/configurador/').canonical, 'https://www.facucode.dev/configurador')
})

test('resolveRouteMeta: home y rutas desconocidas devuelven la home', () => {
  assert.equal(resolveRouteMeta('/').canonical, 'https://www.facucode.dev/')
  assert.equal(resolveRouteMeta('/foo').path, '/')
  assert.equal(resolveRouteMeta('/configurador/extra').path, '/')
})

test('resolveRouteMeta: los textos sociales faltantes caen en title/description', () => {
  const configurador = resolveRouteMeta('/configurador')
  assert.equal(configurador.socialTitle, configurador.title)
  assert.equal(configurador.socialDescription, configurador.description)
  const home = resolveRouteMeta('/')
  assert.equal(home.socialTitle, home.title)
  assert.equal(home.socialDescription, 'Desarrollador Full Stack Java / React. Proyectos, stack y creación de sitios web a medida.')
  assert.notEqual(home.socialDescription, home.description)
})

test('resolveRouteMeta: incluye la imagen OG absoluta', () => {
  assert.equal(resolveRouteMeta('/').image, OG_IMAGE)
})
