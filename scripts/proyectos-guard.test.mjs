/**
 * Guardas estáticas de la sección de proyectos (design D10): evitan regresiones
 * de estructura, accesibilidad de la lista y la vuelta del motor 3D. El contraste,
 * el CSS y el marcado del panel están en `scripts/panel-guard.test.mjs`.
 */
import assert from 'node:assert/strict'
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs'
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

/** Todos los archivos de código de `src/` (rutas relativas a la raíz). */
function srcFiles(dir = 'src') {
  const out = []
  for (const name of readdirSync(new URL(`${dir}/`, ROOT))) {
    const rel = `${dir}/${name}`
    if (statSync(new URL(rel, ROOT)).isDirectory()) out.push(...srcFiles(rel))
    else if (/\.(js|jsx|css)$/.test(name)) out.push(rel)
  }
  return out
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

// ───────── estructura que no se debe romper ─────────

test('Home.jsx: <main> recorta con overflow-x-clip y no con hidden', () => {
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

test('src: sin recursos ni mensajes de la galería ajena', () => {
  for (const file of srcFiles()) {
    const src = read(file)
    assert.ok(!/thepromptsfactory/i.test(src), `${file} referencia thepromptsfactory`)
    assert.ok(!/postMessage/.test(src), `${file} usa postMessage`)
    assert.ok(!/\?gallery|gallery=/i.test(src), `${file} usa ?gallery`)
  }
})

// ───────── sin motor 3D ─────────

test('package.json y lockfile: sin three', () => {
  const pkg = JSON.parse(read('package.json'))
  assert.ok(!pkg.dependencies?.three && !pkg.devDependencies?.three)
  assert.ok(!read('package-lock.json').includes('node_modules/three"'), 'three sigue en package-lock.json')
})

test('src: nadie importa three ni menciona WebGL', () => {
  for (const file of srcFiles().filter((f) => /\.(js|jsx)$/.test(f))) {
    const src = read(file)
    assert.ok(!/from\s+['"]three(\/[^'"]*)?['"]|import\(\s*['"]three/.test(src), `${file} importa three`)
    assert.ok(!/WebGL/i.test(src), `${file} menciona WebGL`)
  }
})

test('archivos del carrete eliminados', () => {
  const borrados = [
    'src/components/proyectos/Carrete3D.jsx',
    'src/three',
    'src/utils/carrete3d.js',
    'src/utils/proyectosScroll.js',
    'src/hooks/useCarrete.js',
    'src/hooks/useModoProyectos.js',
    'scripts/carrete3d.test.mjs',
    'scripts/proyectos-scroll.test.mjs',
  ]
  for (const f of borrados) assert.ok(!existsSync(new URL(f, ROOT)), `${f} sigue existiendo`)
})

test('src: nada usa los nombres del carrete ni de la paginación vieja', () => {
  const viejos = ['useCarrete', 'useModoProyectos', 'proyectosScroll', 'Carrete3D', 'carreteEscena', 'pinHeightVh', 'PER_PAGE', 'usePinHorizontal']
  for (const file of srcFiles().filter((f) => /\.(js|jsx)$/.test(f))) {
    const src = read(file)
    for (const name of viejos) assert.ok(!src.includes(name), `${file} usa ${name}`)
  }
})

// ───────── Projects.jsx y CSS ─────────

test('Projects.jsx: ancla, encabezado, panel y cierre; sin modos', () => {
  const src = read('src/components/Projects.jsx')
  assert.ok(src.includes('id="proyectos"'))
  assert.ok(src.includes('aria-labelledby="proyectos-titulo"') && src.includes('id="proyectos-titulo"'))
  assert.ok(src.includes('03 //') && src.includes('Proyectos'))
  assert.ok(src.includes('eva-hex-grid'))
  assert.ok(/<PanelProyectos\b/.test(src) && /<ProyectosCierre\b/.test(src))
  assert.ok(!/data-mode/.test(src))
  assert.ok(!/DESLIZÁ/.test(src), 'la pista "DESLIZÁ →" se reemplazó por las flechas')
})

test('index.css: sin restos del carrete ni de los modos', () => {
  const css = read('src/index.css')
  assert.ok(!/\.carrete-/.test(css))
  assert.ok(!/proyectos-pin/.test(css))
  assert.ok(!/data-mode=/.test(css))
  assert.ok(!/proyectos-carrusel/.test(css))
})

// ───────── jerarquía de color ─────────

test('proyectos: eyebrow en primary-light y cierre con primary/secondary', () => {
  const esperado = {
    'src/components/Projects.jsx': ['tracking-[0.18em] text-eva-primary-light'],
    'src/components/proyectos/ProyectosCierre.jsx': [
      'border-eva-primary bg-eva-primary text-eva-black',
      'hover:border-eva-secondary hover:bg-eva-secondary hover:text-eva-black',
    ],
  }
  const faltan = []
  for (const [file, fragmentos] of Object.entries(esperado)) {
    const source = read(file)
    for (const f of fragmentos) if (!source.includes(f)) faltan.push(`${file}: falta ${f}`)
  }
  for (const file of proyectosSources()) assert.doesNotMatch(read(file), /eva-(?:orange|purple|green)/, file)
  assert.deepEqual(faltan, [])
})

test('cierre: enlaces externos con rel noopener noreferrer y contacto interno', () => {
  const src = read('src/components/proyectos/ProyectosCierre.jsx')
  assert.ok(src.includes('Ver GitHub') && src.includes('Contactame'))
  assert.ok(src.includes('CONTACTO_ANCLA') && src.includes('GITHUB_PERFIL_URL'))
  for (const tag of src.match(/<a\b[^>]*>/gs) ?? []) {
    if (/target="_blank"/.test(tag)) assert.match(tag, /rel="noopener noreferrer"/, tag)
  }
})
