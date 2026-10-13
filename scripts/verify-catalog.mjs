#!/usr/bin/env node
/**
 * Smoke test de forma del catálogo del configurador (C-03).
 *
 * Valida el contrato de `src/data/configurador.js` sin depender de un framework
 * de tests ni de React. Falla con código de salida 1 si el catálogo se rompe.
 *
 * El catálogo no expone precios: no se validan importes.
 *
 * Uso: npm run verify:catalog
 */
import { CATEGORIES, HOSTING_DISCLAIMER, extras, services } from '../src/data/configurador.js'

const failures = []
const fail = (msg) => failures.push(msg)

const isNonEmptyString = (v) => typeof v === 'string' && v.trim().length > 0
const isKebab = (v) => typeof v === 'string' && /^[a-z][a-z0-9]*(-[a-z0-9]+)*$/.test(v)

const assertUniqueIds = (items, label) => {
  const ids = items.map((i) => i.id)
  const dupes = [...new Set(ids.filter((id, index) => ids.indexOf(id) !== index))]
  if (dupes.length > 0) fail(`${label}: ids duplicados -> ${dupes.join(', ')}`)
  for (const id of ids) {
    if (!isKebab(id)) fail(`${label}: id no kebab-case o vacío -> ${JSON.stringify(id)}`)
  }
}

// --- Tipos de sitio -------------------------------------------------------
if (services.length !== 7) fail(`services: se esperaban 7, hay ${services.length}`)
assertUniqueIds(services, 'services')

for (const s of services) {
  const tag = `services[${s.id}]`
  if (!isNonEmptyString(s.name)) fail(`${tag}: name vacío`)
  if (!isNonEmptyString(s.description)) fail(`${tag}: description vacía`)
  if (!isNonEmptyString(s.icon)) fail(`${tag}: icon vacío`)
  if (s.tag !== undefined && !isNonEmptyString(s.tag)) fail(`${tag}: tag presente pero vacío`)
  if ('priceARS' in s) fail(`${tag}: el catálogo no debe exponer priceARS`)
  if ('quotable' in s) fail(`${tag}: el catálogo no debe exponer quotable`)
}

if (!services.some((s) => s.id === 'custom')) {
  fail('services: "custom" debe existir')
}

// --- Extras ---------------------------------------------------------------
if (extras.length !== 8) fail(`extras: se esperaban 8, hay ${extras.length}`)
assertUniqueIds(extras, 'extras')

for (const e of extras) {
  const tag = `extras[${e.id}]`
  if (!isNonEmptyString(e.name)) fail(`${tag}: name vacío`)
  if (!isNonEmptyString(e.description)) fail(`${tag}: description vacía`)
  if (!CATEGORIES.includes(e.category)) {
    fail(`${tag}: category inválida -> ${JSON.stringify(e.category)}`)
  }
  if (typeof e.recommended !== 'boolean') fail(`${tag}: recommended no es boolean`)
  if (e.disclaimer !== undefined && !isNonEmptyString(e.disclaimer)) {
    fail(`${tag}: disclaimer presente pero vacío`)
  }
  if ('priceARS' in e) fail(`${tag}: el catálogo no debe exponer priceARS`)
  if ('recurring' in e) fail(`${tag}: el catálogo no debe exponer recurring`)
}

const recommended = extras.filter((e) => e.recommended)
if (recommended.length !== 1 || recommended[0].id !== 'hosting') {
  const got = recommended.map((e) => e.id).join(', ') || 'ninguno'
  fail(`extras: el único "recommended" debe ser "hosting" -> ${got}`)
}

const hosting = extras.find((e) => e.id === 'hosting')
if (!hosting) {
  fail('extras: falta "hosting"')
} else if (hosting.disclaimer !== HOSTING_DISCLAIMER) {
  fail('extras[hosting]: disclaimer debe ser idéntico a HOSTING_DISCLAIMER')
}

// --- Metadatos ------------------------------------------------------------
if (CATEGORIES.length !== 5) fail(`CATEGORIES: se esperaban 5, hay ${CATEGORIES.length}`)

// --- Reporte --------------------------------------------------------------
if (failures.length > 0) {
  console.error(`\u2717 verify:catalog — ${failures.length} problema(s):`)
  for (const f of failures) console.error(`  - ${f}`)
  process.exit(1)
}

console.log(
  `\u2713 verify:catalog — ${services.length} servicios, ${extras.length} extras, ` +
    `${recommended.length} recomendado (sin precios)`,
)
