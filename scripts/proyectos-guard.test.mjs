/**
 * Guardas estáticas de la sección de proyectos (design D10): evitan regresiones
 * que rompen `position: sticky`, la accesibilidad de la lista, la carga diferida
 * de Three.js o el rendimiento.
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

// ───────── three: versión exacta y carga diferida ─────────

test('package.json: three 0.187.0 exacto y en dependencies', () => {
  const pkg = JSON.parse(read('package.json'))
  assert.equal(pkg.dependencies.three, '0.187.0')
  assert.ok(!pkg.devDependencies?.three)
})

test('solo src/three/carreteEscena.js importa three', () => {
  const importers = srcFiles()
    .filter((f) => f.endsWith('.js') || f.endsWith('.jsx'))
    .filter((f) => /from\s+['"]three(\/[^'"]*)?['"]|import\(\s*['"]three/.test(read(f)))
  assert.deepEqual(importers, ['src/three/carreteEscena.js'])
})

test('useCarrete importa el adaptador con import() dinámico y nadie lo importa estáticamente', () => {
  assert.ok(/import\(\s*['"]\.\.\/three\/carreteEscena\.js['"]\s*\)/.test(read('src/hooks/useCarrete.js')))
  for (const file of srcFiles().filter((f) => /\.(js|jsx)$/.test(f))) {
    assert.ok(!/(^|\n)\s*import[^('"]*from\s+['"][^'"]*carreteEscena/.test(read(file)), `${file} importa el adaptador de forma estática`)
  }
})

test('adaptador: libera geometría, materiales, texturas y renderer', () => {
  const src = read('src/three/carreteEscena.js')
  assert.ok(/geometry\.dispose\(\)/.test(src), 'falta geometry.dispose()')
  assert.ok(/material\.dispose\(\)/.test(src) || /materials?\b[^;]*\.dispose\(\)/.test(src), 'falta material.dispose()')
  assert.ok(/texture\.dispose\(\)/.test(src), 'falta texture.dispose()')
  assert.ok(/renderer\.dispose\(\)/.test(src), 'falta renderer.dispose()')
  assert.ok(/forceContextLoss\(\)/.test(src), 'falta forceContextLoss()')
  assert.ok(/webglcontextlost/.test(src), 'falta la escucha de webglcontextlost')
})

test('adaptador: sin eval ni new Function', () => {
  const src = read('src/three/carreteEscena.js')
  assert.ok(!/\beval\s*\(|new\s+Function\b/.test(src))
})

test('src: sin recursos ni mensajes de la galería ajena', () => {
  for (const file of srcFiles()) {
    const src = read(file)
    assert.ok(!/thepromptsfactory/i.test(src), `${file} referencia thepromptsfactory`)
    assert.ok(!/postMessage/.test(src), `${file} usa postMessage`)
    assert.ok(!/\?gallery|gallery=/i.test(src), `${file} usa ?gallery`)
  }
})

// ───────── ciclo de vida del hook ─────────

test('useCarrete: rueda pasiva, sin historial, con rAF cancelable y visibilitychange', () => {
  const src = read('src/hooks/useCarrete.js')
  for (const m of src.matchAll(/addEventListener\(\s*['"]wheel['"][^)]*\)/g)) {
    assert.ok(!/passive:\s*false/.test(m[0]), `rueda no pasiva: ${m[0]}`)
  }
  assert.ok(!/onWheel/.test(src))
  assert.ok(!/pushState|replaceState/.test(src))
  assert.ok(/cancelAnimationFrame/.test(src))
  assert.ok(/visibilitychange/.test(src))
  assert.ok(/IntersectionObserver/.test(src))
  assert.ok(/setPointerCapture/.test(src))
  assert.ok(/pointercancel/.test(src) && /lostpointercapture/.test(src))
})

test('useModoProyectos: sin historial y sin la API vieja de modos', () => {
  const src = read('src/hooks/useModoProyectos.js')
  assert.ok(!/pushState|replaceState/.test(src))
  assert.ok(!/layoutMode/.test(src))
  assert.ok(/projectsMode/.test(src))
})

test('usePinHorizontal ya no existe ni se importa', () => {
  assert.ok(!existsSync(new URL('src/hooks/usePinHorizontal.js', ROOT)))
  for (const file of srcFiles().filter((f) => /\.(js|jsx)$/.test(f))) {
    assert.ok(!/usePinHorizontal/.test(read(file)), `${file} usa usePinHorizontal`)
  }
})

test('funciones de paginación eliminadas: nada en src las usa', () => {
  const viejas = ['PER_PAGE', 'pageCount', 'ctaPlacement', 'trackItemCount', 'pageStride', 'trackOffset', 'pageOfItem', 'currentPage', 'layoutMode']
  for (const file of srcFiles().filter((f) => /\.(js|jsx)$/.test(f))) {
    const src = read(file)
    for (const name of viejas) assert.ok(!new RegExp(`\\b${name}\\b`).test(src), `${file} usa ${name}`)
  }
})

// ───────── marcado del carrete ─────────

test('Carrete3D.jsx: marcado accesible y escenario despojado', () => {
  const file = 'src/components/proyectos/Carrete3D.jsx'
  assert.ok(existsSync(new URL(file, ROOT)), `falta ${file}`)
  const src = read(file)
  assert.ok(!/UNIT-/.test(src), 'contiene UNIT-')
  assert.ok(!/\/\s*0\b/.test(src), 'contiene un indicador "/ 0"')
  assert.ok(!/aria-live/.test(src), 'contiene aria-live')
  assert.ok(src.includes('role="img"'))
  assert.ok(src.includes('Ver proyecto'))
  assert.ok(src.includes('Más en GitHub'))
  assert.ok(src.includes('Scrolleá o arrastrá para explorar'))
  assert.ok(src.includes('03 //'))
  assert.ok(src.includes('Proyectos'))
  for (const tag of src.match(/<a\b[^>]*>/g) ?? []) {
    if (/target="_blank"/.test(tag)) assert.ok(/rel="noreferrer"/.test(tag), `enlace externo sin rel: ${tag}`)
  }
  assert.ok((src.match(/target="_blank"/g) ?? []).length >= 2)
})

test('Projects.jsx: modos reel y carousel, sin indicador ni barra de páginas', () => {
  const src = read('src/components/Projects.jsx')
  assert.ok(/reel/.test(src) && /data-mode/.test(src) && /ProyectosCierre/.test(src) && /useCarrete/.test(src))
  assert.ok(!/01 \//.test(src), 'queda el indicador 01 / 02')
  assert.ok(!/proyectos-barra/.test(src))
})

test('index.css: sin los modos pin y row ni el indicador de páginas', () => {
  const css = read('src/index.css')
  assert.ok(!/data-mode="pin"/.test(css))
  assert.ok(!/data-mode="row"/.test(css))
  assert.ok(!/proyectos-indicador-pin/.test(css))
  assert.ok(/data-mode="reel"/.test(css))
  assert.ok(/data-mode="carousel"/.test(css))
  assert.ok(/touch-action:\s*pan-y/.test(css))
})

// --- jerarquia-color-violeta: roles en la sección de proyectos ---

test('proyectos: eyebrow en primary-light, tarjeta con sombra secondary, badges demo=secondary y live=tertiary', () => {
  const card = read('src/components/proyectos/ProyectoCard.jsx')
  const cierre = read('src/components/proyectos/ProyectosCierre.jsx')
  const esperado = {
    'src/components/Projects.jsx': ['tracking-[0.18em] text-eva-primary-light'],
    'src/components/proyectos/Carrete3D.jsx': ['carrete-titulo-linea text-eva-primary-light'],
    'src/components/proyectos/ProyectoCard.jsx': [
      'demo: "border-eva-secondary text-eva-secondary"',
      'live: "border-eva-tertiary text-eva-tertiary"',
      'shadow-[6px_6px_0_0_theme(colors.eva.secondary)]',
      'hover:border-eva-secondary hover:shadow-[8px_8px_0_0_theme(colors.eva.secondary)]',
      'group-hover:text-eva-secondary',
    ],
    'src/components/proyectos/ProyectosCierre.jsx': [
      'border-eva-primary bg-eva-primary text-eva-black',
      'hover:border-eva-secondary hover:bg-eva-secondary hover:text-eva-black',
    ],
  }
  const faltan = []
  for (const [file, fragmentos] of Object.entries(esperado)) {
    const source = read(file)
    for (const f of fragmentos) if (!source.includes(f)) faltan.push(`${file}: falta ${f}`)
    assert.doesNotMatch(source, /eva-(?:orange|purple|green)/, file)
  }
  assert.deepEqual(faltan, [])
  assert.ok(card && cierre)
})

test('carrete: el shader no usa colores de acento (las texturas son capturas y el fondo es el panel)', () => {
  const escena = read('src/three/carreteEscena.js')
  assert.doesNotMatch(escena, /eva-(?:orange|purple|green|primary|secondary|tertiary)|#FF7A1A|#9B5CF0|#74F8D4/i)
})
