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
const SECTION_COMPONENTS = ['About.jsx', 'Testimonials.jsx'] // secciones de cristal (acerca-testimonios-glass)

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
]

/**
 * Devuelve las clases prohibidas presentes en `source`. Compara por token
 * completo (también con variantes como `hover:` y con sufijo de opacidad), de
 * modo que `text-gray-5000` o `outline-none` a secas no cuentan.
 * @param {string} source
 * @returns {string[]}
 */
function findForbiddenClasses(source) {
  const tokens = source.split(/[\s"'`{}<>=]+/).map((token) => token.replace(/\/\d+$/, ''))
  return FORBIDDEN.filter((cls) =>
    tokens.some((token) => token === cls || token.endsWith(`:${cls}`)),
  )
}

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
  const files = readdirSync(DIR).filter((name) => name.endsWith('.jsx'))
  assert.ok(files.length > 0, 'no se encontraron .jsx para inspeccionar')

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
