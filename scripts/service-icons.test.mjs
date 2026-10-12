/**
 * Tests de la resolución de iconos del catálogo (C-07).
 *
 * Cierra el riesgo que dejó abierto C-03: el catálogo guarda el icono como
 * string y el build NO valida que exista en `lucide-react`. Acá se verifica
 * contra el catálogo real.
 *
 * Uso: npm run test
 */
import assert from 'node:assert/strict'
import test from 'node:test'

import { services } from '../src/data/configurador.js'
import {
  FALLBACK_ICON,
  SERVICE_ICONS,
  resolveServiceIcon,
} from '../src/components/configurador/serviceIcons.js'

test('cada servicio del catálogo tiene un icono mapeado (ninguno cae al fallback)', () => {
  assert.ok(services.length > 0)

  for (const service of services) {
    assert.ok(service.icon, `el servicio "${service.id}" no tiene icono`)
    assert.ok(
      Object.prototype.hasOwnProperty.call(SERVICE_ICONS, service.icon),
      `el icono "${service.icon}" (servicio ${service.id}) no está en SERVICE_ICONS`,
    )
    assert.ok(resolveServiceIcon(service.icon), `el icono "${service.icon}" no resuelve`)
  }
})

test('resolveServiceIcon devuelve el componente mapeado', () => {
  assert.equal(resolveServiceIcon('Rocket'), SERVICE_ICONS.Rocket)
})

test('SERVICE_ICONS cubre exactamente los iconos del catálogo', () => {
  const catalogIcons = [...new Set(services.map((service) => service.icon))].sort()
  const mappedIcons = Object.keys(SERVICE_ICONS).sort()
  assert.deepEqual(mappedIcons, catalogIcons)
})

test('un nombre de icono desconocido devuelve el reemplazo', () => {
  assert.equal(resolveServiceIcon('NoExisteEsteIcono'), FALLBACK_ICON)
})

test('sin nombre de icono devuelve el reemplazo', () => {
  assert.equal(resolveServiceIcon(undefined), FALLBACK_ICON)
})
