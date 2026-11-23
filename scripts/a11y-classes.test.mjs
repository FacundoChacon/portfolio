/**
 * Guard estático de accesibilidad del configurador (C-11): falla si vuelven
 * clases que anulan el foco visible o que no cumplen contraste AA en texto
 * chico. Es una red de regresión sobre clases literales, no una medición de
 * contraste en runtime.
 */
import assert from 'node:assert/strict'
import { readFileSync, readdirSync } from 'node:fs'
import test from 'node:test'

const DIR = new URL('../src/components/configurador/', import.meta.url)
const PAGE = new URL('../src/pages/Configurador.jsx', import.meta.url)
const NAV_COMPONENTS = ['SiteNav.jsx', 'NavBrand.jsx', 'Hero.jsx', 'Contact.jsx'] // también inspecciona el hero (hero-brutalista) y contacto (contacto-brutalista)
const SECTION_COMPONENTS = ['Stack.jsx'] // secciones de la home que también pasan el guard (stack-neumorfico-oscuro)

/**
 * Clases prohibidas en `src/components/configurador/*.jsx` y `src/pages/Configurador.jsx` (design D6/D7).
 * Las variantes (`placeholder:`, `hover:`…) se detectan por sufijo.
 */
const FORBIDDEN = [
  'focus:outline-none',
  'focus-visible:outline-none',
  'focus:outline-0',
  'focus-visible:outline-0',
  'focus:ring-0',
  'focus-visible:ring-0',
  'text-gray-500',
  'text-gray-600',
  'text-eva-gray-dim', // `gray-dim` es solo para bordes de UI (3:1), nunca texto (incluye `placeholder:`)
]

/** Prefijos prohibidos: `disabled:opacity-*` vuelve ilegible el texto (configurador-estilo-eva). */
const FORBIDDEN_PREFIXES = ['disabled:opacity-']

/**
 * Devuelve las clases prohibidas presentes en `source`. Compara por token
 * completo (también con variantes como `hover:` y con sufijo de opacidad), de
 * modo que `text-gray-5000` o `outline-none` a secas no cuentan.
 * @param {string} source
 * @returns {string[]}
 */
function findForbiddenClasses(source) {
  const tokens = source.split(/[\s"'`{}<>=]+/).map((token) => token.replace(/\/\d+$/, ''))
  const exact = FORBIDDEN.filter((cls) =>
    tokens.some((token) => token === cls || token.endsWith(`:${cls}`)),
  )
  const byPrefix = FORBIDDEN_PREFIXES.filter((prefix) =>
    tokens.some((token) => token.startsWith(prefix) || token.includes(`:${prefix}`)),
  ).map((prefix) => `${prefix}*`)
  return [...exact, ...byPrefix]
}

test('findForbiddenClasses: detecta disabled:opacity-* y text-eva-gray-dim, acepta alternativas', () => {
  assert.deepEqual(findForbiddenClasses('<button className="disabled:opacity-50">'), ['disabled:opacity-*'])
  assert.deepEqual(findForbiddenClasses('<button className="hover:disabled:opacity-30 x">'), ['disabled:opacity-*'])
  assert.deepEqual(findForbiddenClasses('<p className="placeholder:text-eva-gray-dim">'), ['text-eva-gray-dim'])
  assert.deepEqual(
    findForbiddenClasses('<button className="disabled:bg-eva-line border-eva-gray-dim text-eva-gray opacity-50">'),
    [],
  )
})

test('findForbiddenClasses: detecta una clase prohibida y acepta una permitida', () => {
  assert.deepEqual(findForbiddenClasses('<p className="mt-1 text-gray-500 text-xs">'), ['text-gray-500'])
  assert.deepEqual(findForbiddenClasses('className="placeholder:text-gray-600 focus:outline-none"'), [
    'focus:outline-none',
    'text-gray-600',
  ])
  assert.deepEqual(findForbiddenClasses('className="hover:text-gray-500/80"'), ['text-gray-500'])
  assert.deepEqual(findForbiddenClasses('<p className="text-gray-400 text-gray-5000 outline-none">'), [])
})

test('findForbiddenClasses: detecta las demás formas de anular el foco visible', () => {
  for (const cls of [
    'focus-visible:outline-none',
    'focus:outline-0',
    'focus-visible:outline-0',
    'focus:ring-0',
    'focus-visible:ring-0',
  ]) {
    assert.deepEqual(findForbiddenClasses(`<input className="px-3 ${cls}" />`), [cls])
  }
})

test('findForbiddenClasses: permite outline-none sin prefijo de foco (títulos tabIndex=-1)', () => {
  assert.deepEqual(findForbiddenClasses('<h2 tabIndex={-1} className="text-2xl outline-none">'), [])
  assert.deepEqual(findForbiddenClasses('<h2 className="outline-0 ring-0 focus:ring-2">'), [])
})

test('los componentes y la página del configurador no usan clases que rompen foco o contraste', () => {
  const files = readdirSync(DIR).filter((name) => /\.jsx?$/.test(name)) // .jsx y .js (las clases viven en estilos.js)
  assert.ok(files.length > 0, 'no se encontraron .jsx/.js para inspeccionar')

  const sources = [
    ...files.map((name) => [name, readFileSync(new URL(name, DIR), 'utf8')]),
    ['pages/Configurador.jsx', readFileSync(PAGE, 'utf8')],
    ...[...NAV_COMPONENTS, ...SECTION_COMPONENTS].map((name) => [
      `components/${name}`,
      readFileSync(new URL(`../src/components/${name}`, import.meta.url), 'utf8'),
    ]),
  ]
  const offenders = sources.flatMap(([name, source]) =>
    findForbiddenClasses(source).map((cls) => `${name}: ${cls}`),
  )
  assert.deepEqual(offenders, [])
})
