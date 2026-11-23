#!/usr/bin/env node
/**
 * Smoke test de forma de los testimonios de la home (C-13).
 *
 * Valida el contrato de `src/data/testimonios.js` sin depender de un framework
 * de tests ni de React. Falla con código de salida 1 si los datos se rompen.
 *
 * El array vacío es un estado válido y temporario: la sección queda oculta
 * hasta que se carguen testimonios reales (solo avisa, no falla).
 *
 * Uso: npm run verify:testimonials
 */
import testimonios from '../src/data/testimonios.js'
import { hasValidRating } from '../src/utils/testimonios.js'

const failures = []
const fail = (msg) => failures.push(msg)

const isNonEmptyString = (v) => typeof v === 'string' && v.trim().length > 0

if (!Array.isArray(testimonios)) {
  fail('testimonios: debe ser un array')
} else if (testimonios.length === 0) {
  console.warn('\u26a0 verify:testimonials — array vacío: sección inactiva hasta cargar testimonios reales')
} else {
  if (testimonios.length < 3 || testimonios.length > 6) {
    fail(`testimonios: se esperaban entre 3 y 6, hay ${testimonios.length}`)
  }

  const nombres = testimonios.map((t) => t.nombre)
  const dupes = [...new Set(nombres.filter((n, index) => nombres.indexOf(n) !== index))]
  if (dupes.length > 0) {
    fail(`testimonios: nombre duplicado (es el key de la grilla) -> ${dupes.join(', ')}`)
  }

  testimonios.forEach((t, index) => {
    const tag = `testimonios[${index}]`
    if (!isNonEmptyString(t.nombre)) fail(`${tag}: nombre vacío`)
    if (!isNonEmptyString(t.rol)) fail(`${tag}: rol vacío`)
    if (!isNonEmptyString(t.comentario)) fail(`${tag}: comentario vacío`)
    if (!hasValidRating(t.rating)) fail(`${tag}: rating debe ser entero 1-5 -> ${JSON.stringify(t.rating)}`)
  })
}

// --- Reporte --------------------------------------------------------------
if (failures.length > 0) {
  console.error(`\u2717 verify:testimonials — ${failures.length} problema(s):`)
  for (const f of failures) console.error(`  - ${f}`)
  process.exit(1)
}

console.log(`\u2713 verify:testimonials — ${testimonios.length} testimonio(s)`)
