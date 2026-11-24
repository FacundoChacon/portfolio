/**
 * Guardas estáticas de la card enlazada con foil 2.5D (design D13): enlace único
 * (stretched link), capas del foil, CSS del efecto y ciclo de vida del hook.
 */
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'

import { ruleBody } from './lib/css-rules.mjs'

const ROOT = new URL('../', import.meta.url)
const read = (path) => readFileSync(new URL(path, ROOT), 'utf8')
const css = () => read('src/index.css')
const card = () => read('src/components/proyectos/ProyectoCard.jsx')

test('ProyectoCard.jsx: un solo enlace a la demo por card (stretched link), sin anidar ni enlazar la foto', () => {
  const src = card()
  const aperturas = [...src.matchAll(/<a\b[^>]*>/gs)]
  const demo = aperturas.filter((m) => /href=\{project\.live\}/.test(m[0]))
  assert.equal(demo.length, 1, 'exactamente un <a href={project.live}>')
  assert.match(demo[0][0], /after:absolute after:inset-0/, '::after cubre la card')
  assert.match(demo[0][0], /proyecto-enlace/)
  assert.match(demo[0][0], /target="_blank"/)
  assert.match(demo[0][0], /rel="noopener noreferrer"/)
  let profundidad = 0
  for (const m of src.matchAll(/<a\b[^>]*>|<\/a>/gs)) {
    profundidad += m[0] === '</a>' ? -1 : 1
    assert.ok(profundidad <= 1, 'enlaces anidados')
  }
  assert.doesNotMatch(src, /<a\b[^>]*>\s*\{?foto\}?\s*<\/a>/s, 'la foto no es un enlace aparte')
  assert.match(src, /alt=""/)
  assert.ok(src.includes('NEW_TAB_NOTE = "(abre el sitio en una pestaña nueva)"'))
  // nombre accesible del enlace = título + aviso
  assert.match(src, /\{project\.title\}\s*<span className="sr-only">\s*(?:\{" "\}\s*)?\{NEW_TAB_NOTE\}/s)
})


test('ProyectoCard.jsx: el botón de repositorio queda por encima del enlace estirado y fuera de él', () => {
  const src = card()
  const accion = src.match(/const accion =\s*"([^"]*)"/)?.[1] ?? ''
  assert.ok(accion.split(' ').includes('relative') && accion.split(' ').includes('z-10'), 'accion con relative z-10')
  const repo = [...src.matchAll(/<a\b[^>]*>/gs)].find((m) => /repositorio\.href/.test(m[0]))
  assert.ok(repo && repo[0].includes('${accion}'), 'Repositorio usa accion')
  const privado = src.match(/<button\b[^>]*disabled[^>]*>/s)?.[0] ?? ''
  assert.ok(privado.includes('${accion}'), 'Repo privado usa accion')
})

test('ProyectoCard.jsx: envoltorio de perspectiva, cara y capas del foil encima del contenido', () => {
  const src = card()
  assert.ok(src.includes('proyecto-foil') && src.includes('useFoil'))
  for (const capa of ['foil-brillo', 'foil-iris']) {
    const tag = src.match(new RegExp(`<span[^>]*${capa}[^>]*>`, 's'))?.[0] ?? ''
    assert.match(tag, /aria-hidden="true"/, capa)
    assert.ok(src.indexOf(capa) > src.indexOf('<h3'), `${capa} va después del contenido`)
  }
})

test('index.css: perspectiva, orden de transform, sombra reactiva y transición solo con no-preference', () => {
  const source = css()
  assert.match(ruleBody(source, '.proyecto-foil') ?? '', /perspective:\s*1500px/)
  const cara = ruleBody(source, '.proyecto-card') ?? ''
  assert.match(cara, /transform:\s*translateZ\(var\(--tz, 0px\)\) rotateX\(var\(--rx, 0deg\)\) rotateY\(var\(--ry, 0deg\)\) scale\(var\(--s, 1\)\)/)
  assert.match(cara, /overflow:\s*clip/)
  assert.match(
    cara,
    /filter:\s*drop-shadow\(0 calc\(8px \+ 26px \* var\(--hover, 0\)\) calc\(16px \+ 34px \* var\(--hover, 0\)\) rgb\(0 0 0 \/ calc\(0\.28 \+ 0\.32 \* var\(--hover, 0\)\)\)\)/,
  )
  assert.match(cara, /box-shadow:[^;]*inset[^;]*calc\(0\.5 \* var\(--hover, 0\)\)/)
  assert.match(cara, /box-shadow:[^;]*calc\(18px \* var\(--hover, 0\)\)[^;]*calc\(0\.18 \* var\(--hover, 0\)\)/)
  assert.doesNotMatch(cara, /transition/)
  const anim = ruleBody(source, '.proyecto-card', { within: '@media (prefers-reduced-motion: no-preference)' }) ?? ''
  assert.match(anim, /transition:[^;]*transform 0?\.2s cubic-bezier\(0?\.22, 1, 0?\.36, 1\)/)
})

test('index.css: capas del foil cristalinas (brillo blanco y velo helado), sin tonos de color y sin eventos de puntero', () => {
  const source = css()
  const brillo = ruleBody(source, '.foil-brillo') ?? ''
  assert.match(brillo, /linear-gradient\(102deg, transparent 36%, rgb\(255 255 255 \/ 0?\.2\) 46%, rgb\(255 255 255 \/ 0?\.45\) 50%, rgb\(255 255 255 \/ 0?\.2\) 54%, transparent 64%\)/)
  assert.match(brillo, /background-size:\s*260% 100%/)
  assert.match(brillo, /background-position-x:\s*calc\(var\(--mxf, 0\.5\) \* 100%\)/)
  assert.match(brillo, /mix-blend-mode:\s*screen/)
  assert.match(brillo, /opacity:\s*calc\(0\.7 \* var\(--hover, 0\)\)/)
  assert.match(ruleBody(source, '.foil-brillo, .foil-iris') ?? '', /pointer-events:\s*none/)
  const iris = ruleBody(source, '.foil-iris') ?? ''
  assert.match(iris, /linear-gradient\(115deg, rgb\(255 255 255 \/ 0\) 0%, rgb\(235 245 255 \/ 0?\.35\) 40%, rgb\(200 235 255 \/ 0?\.18\) 55%, transparent 70%\)/)
  assert.match(iris, /mix-blend-mode:\s*(?:soft-light|overlay)/)
  assert.doesNotMatch(iris, /color-dodge/)
  assert.match(iris, /opacity:\s*calc\(0\.[3-6]\d* \* var\(--hover, 0\)\)/)
  // nada que añada tono: ni los roles de color ni nombres de color en las capas
  assert.doesNotMatch(brillo + iris, /--eva-|violet|orange|aqua|pink|cyan/)
})

test('index.css: borde cristalino blanco de 1px y resplandor helado además del violeta', () => {
  const cara = ruleBody(css(), '.proyecto-card') ?? ''
  assert.match(cara, /inset 0 0 0 2px rgb\(255 255 255 \/ calc\(0\.25 \* var\(--hover, 0\)\)\)/)
  assert.match(cara, /inset 0 0 calc\(24px \* var\(--hover, 0\)\) rgb\(255 255 255 \/ calc\(0\.08 \* var\(--hover, 0\)\)\)/)
  assert.match(cara, /inset 0 0 0 1px rgb\(155 92 240 \/ calc\(0\.5 \* var\(--hover, 0\)\)\)/)
})

test('index.css: foco de teclado levanta la card sin giro y con anillo; movimiento reducido apaga el foil', () => {
  const source = css()
  assert.match(source, /\.proyecto-card:has\(\.proyecto-enlace:focus-visible\):not\(\[data-reposo\]\)\s*\{[^}]*--tz:\s*46px[^}]*--s:\s*1\.05[^}]*--hover:\s*1/)
  assert.match(ruleBody(source, '.proyecto-card:has(.proyecto-enlace:focus-visible)') ?? '', /outline:\s*2px solid var\(--eva-focus\)/)
  const reducido = ruleBody(source, '.proyecto-card', { within: '@media (prefers-reduced-motion: reduce)' }) ?? ''
  assert.match(reducido, /transform:\s*none !important/)
  assert.match(ruleBody(source, '.foil-brillo, .foil-iris', { within: '@media (prefers-reduced-motion: reduce)' }) ?? '', /display:\s*none/)
})

test('index.css: la ventana deja margen para la elevación de las cards sin cambiar el layout', () => {
  const v = ruleBody(css(), '.proyectos-ventana') ?? ''
  assert.match(v, /padding-block:\s*1\.5rem/)
  assert.match(v, /margin-block:\s*-1\.5rem/)
  assert.match(v, /padding-inline:\s*0\.9rem/)
  assert.match(v, /margin-inline:\s*-0\.9rem/)
})

test('useFoil.js: puntero fino, variables CSS directas, reinicio en leave/blur/cancel/Escape y limpieza', () => {
  const src = read('src/hooks/useFoil.js')
  for (const f of [
    'tiltDesdePuntero',
    'estadoReposo',
    'estadoActivo',
    'propiedadesCss',
    'setProperty',
    'removeProperty',
    'getBoundingClientRect',
    '(hover: hover) and (pointer: fine)',
    'REDUCED_MOTION_QUERY',
    "'pointermove'",
    "'pointerleave'",
    "'pointercancel'",
    "'focusout'",
    "'Escape'",
    'removeEventListener',
    'dataset.reposo',
  ]) {
    assert.ok(src.includes(f), `falta ${f}`)
  }
  assert.doesNotMatch(src, /preventDefault|requestAnimationFrame|setInterval|Math\.random/)
  for (const m of src.matchAll(/addEventListener\('pointermove'[^)]*\)/g)) assert.match(m[0], /passive:\s*true/)
})
