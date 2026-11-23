/**
 * Guardas estáticas de la sección de proyectos (design D8): evitan regresiones
 * que rompen `position: sticky`, la accesibilidad de la lista o el rendimiento.
 */
import assert from 'node:assert/strict'
import { existsSync, readFileSync, readdirSync } from 'node:fs'
import test from 'node:test'

const ROOT = new URL('../', import.meta.url)
const read = (path) => readFileSync(new URL(path, ROOT), 'utf8')

/** Tokeniza el marcado en clases/atributos para comparar por token completo. */
function tokens(source) {
  return source.split(/[\s"'`{}<>=]+/).filter(Boolean)
}

/**
 * Devuelve los tokens de `forbidden` presentes en `source` (con o sin variante).
 * @param {string} source
 * @param {string[]} forbidden
 */
function findForbiddenClasses(source, forbidden) {
  const found = tokens(source)
  return forbidden.filter((cls) => found.some((t) => t === cls || t.endsWith(`:${cls}`)))
}

test('findForbiddenClasses: positivo y negativo', () => {
  assert.deepEqual(findForbiddenClasses('<main className="a overflow-x-hidden b">', ['overflow-x-hidden']), ['overflow-x-hidden'])
  assert.deepEqual(findForbiddenClasses('className="md:overflow-hidden x"', ['overflow-hidden']), ['overflow-hidden'])
  assert.deepEqual(findForbiddenClasses('className="overflow-x-clip overflow-hidden-no"', ['overflow-hidden']), [])
})

function proyectosSources() {
  const dir = new URL('src/components/proyectos/', ROOT)
  const extra = existsSync(dir) ? readdirSync(dir).filter((f) => f.endsWith('.jsx')).map((f) => `src/components/proyectos/${f}`) : []
  return ['src/components/Projects.jsx', ...extra]
}

test('Home.jsx: <main> recorta con overflow-x-clip y no con hidden (sticky)', () => {
  const home = read('src/pages/Home.jsx')
  const main = home.match(/<main[^>]*>/)?.[0] ?? ''
  assert.ok(main, 'no se encontró <main>')
  assert.deepEqual(findForbiddenClasses(main, ['overflow-x-hidden', 'overflow-hidden', 'overflow-y-hidden']), [])
  assert.deepEqual(findForbiddenClasses(main, ['overflow-x-clip']), ['overflow-x-clip'])
})

test('proyectos: sin backdrop-*, setInterval ni aria-hidden/inert en li/article', () => {
  for (const file of proyectosSources()) {
    const src = read(file)
    assert.ok(!/backdrop-/.test(src), `${file} usa backdrop-`)
    assert.ok(!/setInterval/.test(src), `${file} usa setInterval`)
    for (const tag of src.match(/<(li|article)\b[^>]*>/g) ?? []) {
      assert.ok(!/aria-hidden|inert/.test(tag), `${file}: ${tag} oculta contenido a tecnologías asistivas`)
    }
  }
})

test('index.css: sin el glitch de RepoButton', () => {
  assert.ok(!/repo-glitch|repo-block-flicker/.test(read('src/index.css')))
})

test('package.json: sin librerías de animación', () => {
  const pkg = JSON.parse(read('package.json'))
  const deps = Object.keys({ ...pkg.dependencies, ...pkg.devDependencies })
  for (const lib of ['gsap', 'motion', 'framer-motion']) assert.ok(!deps.includes(lib), `dependencia prohibida: ${lib}`)
})

test('hooks de proyectos: sin pushState/replaceState', () => {
  for (const file of ['src/hooks/usePinHorizontal.js', 'src/hooks/useModoProyectos.js']) {
    assert.ok(existsSync(new URL(file, ROOT)), `falta ${file}`)
    assert.ok(!/pushState|replaceState/.test(read(file)), `${file} toca el historial`)
  }
})
