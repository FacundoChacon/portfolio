#!/usr/bin/env node
/**
 * Smoke test de forma del catálogo del configurador (C-03).
 *
 * Valida el contrato de `src/data/configurador.js` sin depender de un framework
 * de tests ni de React. Falla con código de salida 1 si el catálogo se rompe.
 *
 * Uso: npm run verify:catalog
 */
import {
  CATEGORIES,
  CURRENCY,
  HOSTING_DISCLAIMER,
  extras,
  services,
} from '../src/data/configurador.js'

const failures = []
const fail = (msg) => failures.push(msg)

const isNonEmptyString = (v) => typeof v === 'string' && v.trim().length > 0
const isKebab = (v) => typeof v === 'string' && /^[a-z][a-z0-9]*(-[a-z0-9]+)*$/.test(v)
const isPrice = (v) => typeof v === 'number' && Number.isFinite(v) && v >= 0

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
  if (typeof s.quotable !== 'boolean') fail(`${tag}: quotable no es boolean`)
  if (s.quotable) {
    if (s.priceARS !== null) fail(`${tag}: quotable=true debe tener priceARS null`)
  } else if (!isPrice(s.priceARS)) {
    fail(`${tag}: priceARS debe ser un número >= 0`)
  }
  if (s.tag !== undefined && !isNonEmptyString(s.tag)) fail(`${tag}: tag presente pero vacío`)
}

const quotables = services.filter((s) => s.quotable)
if (quotables.length !== 1) {
  fail(`services: se esperaba exactamente 1 cotizable, hay ${quotables.length}`)
}
if (!services.some((s) => s.id === 'custom' && s.quotable === true && s.priceARS === null)) {
  fail('services: "custom" debe existir con quotable=true y priceARS=null')
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
  if (!isPrice(e.priceARS)) fail(`${tag}: priceARS debe ser un número >= 0`)
  if (typeof e.recurring !== 'boolean') fail(`${tag}: recurring no es boolean`)
  if (typeof e.recommended !== 'boolean') fail(`${tag}: recommended no es boolean`)
  if (e.disclaimer !== undefined && !isNonEmptyString(e.disclaimer)) {
    fail(`${tag}: disclaimer presente pero vacío`)
  }
}

const recommended = extras.filter((e) => e.recommended)
if (recommended.length !== 1 || recommended[0].id !== 'hosting') {
  const got = recommended.map((e) => e.id).join(', ') || 'ninguno'
  fail(`extras: el único "recommended" debe ser "hosting" -> ${got}`)
}

const recurring = extras.filter((e) => e.recurring)
if (recurring.length !== 1 || recurring[0].id !== 'maintenance') {
  const got = recurring.map((e) => e.id).join(', ') || 'ninguno'
  fail(`extras: el único "recurring" debe ser "maintenance" -> ${got}`)
}

const hosting = extras.find((e) => e.id === 'hosting')
if (!hosting) {
  fail('extras: falta "hosting"')
} else {
  if (hosting.priceARS !== 0) fail('extras[hosting]: priceARS debe ser 0')
  if (hosting.disclaimer !== HOSTING_DISCLAIMER) {
    fail('extras[hosting]: disclaimer debe ser idéntico a HOSTING_DISCLAIMER')
  }
}

// --- Metadatos ------------------------------------------------------------
if (CURRENCY !== 'ARS') fail(`CURRENCY: se esperaba "ARS", hay ${JSON.stringify(CURRENCY)}`)
if (CATEGORIES.length !== 5) fail(`CATEGORIES: se esperaban 5, hay ${CATEGORIES.length}`)

// --- Reporte --------------------------------------------------------------
if (failures.length > 0) {
  console.error(`\u2717 verify:catalog — ${failures.length} problema(s):`)
  for (const f of failures) console.error(`  - ${f}`)
  process.exit(1)
}

const priced = services.filter((s) => !s.quotable).length
console.log(
  `\u2713 verify:catalog — ${services.length} servicios (${priced} con precio, ${quotables.length} a cotizar), ` +
    `${extras.length} extras, ${recommended.length} recomendado, moneda ${CURRENCY}`,
)
