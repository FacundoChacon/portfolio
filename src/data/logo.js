/**
 * Geometría única del logotipo (change `logo-eva`): datos puros que consumen el componente
 * `LogoEva`, la plantilla de `og-image` y el generador de favicon e ícono táctil
 * (`scripts/render-logo-assets.mjs`). Son los parámetros de `openspec/changes/logo-eva/bocetos/geometria.json`
 * tal cual fueron aprobados: los tests validan las reglas sobre estos parámetros y no sobre polígonos.
 */

/**
 * Aleta continua de una barra: rampa recta, meseta paralela y cierre perpendicular.
 * `inicio`, `rampa` y `meseta` son fracciones del largo `desde -> hasta`; `alto` va en unidades del viewBox;
 * `lado` 1 = normal `(-uy, ux)`, -1 = la opuesta.
 * @typedef {{ lado: 1|-1, inicio: number, rampa: number, meseta: number, alto: number }} AletaBarra
 */

/**
 * Aleta continua del anillo (borde exterior): ángulos en grados desde +x en sentido horario de pantalla.
 * @typedef {{ lado: 'exterior', inicio: number, rampa: number, meseta: number, alto: number }} AletaAnillo
 */

/**
 * Unión de un extremo: `inglete` con la barra que comparte el vértice o `T` sobre una barra anfitriona.
 * @typedef {{ tipo: 'inglete'|'T', con: string }} CorteBarra
 */

/**
 * Barra recta de ancho constante entre `desde` y `hasta`.
 * @typedef {{ id: string, desde: number[], hasta: number[], ancho: number, corteDesde: CorteBarra, corteHasta: CorteBarra, aletas: AletaBarra[] }} Barra
 */

/**
 * Anillo: círculo exterior y círculo interior apenas excéntrico (`evenodd`).
 * @typedef {{ id: string, centro: number[], radio: number, centroInterior: number[], radioInterior: number, aletas: AletaAnillo[] }} Anillo
 */

/**
 * Variante del glifo. `sombra` = desplazamiento de la capa de sombra; `filo` = ancho visible del
 * contorno (el `stroke-width` es el doble). `viewBoxSinFondo` recorta la variante simple sin fondo.
 * @typedef {{ viewBox: string, viewBoxSinFondo?: string, sombra: number, filo: number, trazos: (Barra|Anillo)[] }} VarianteLogo
 */

/** @type {{ completo: VarianteLogo, simple: VarianteLogo }} */
export const LOGO_VARIANTES = {
  completo: {
    viewBox: '0 0 112 243',
    sombra: 2.6,
    filo: 0.55,
    trazos: [
      { id: 'triangulo-lateral', desde: [59.2, 13], hasta: [59.2, 153.4], ancho: 6.4, corteDesde: { tipo: 'inglete', con: 'triangulo-derecho' }, corteHasta: { tipo: 'T', con: 'lomo' }, aletas: [{ lado: 1, inicio: 0.04, rampa: 0.12, meseta: 0.24, alto: 3.2 }] },
      { id: 'triangulo-derecho', desde: [59.2, 13], hasta: [104, 89], ancho: 6.2, corteDesde: { tipo: 'inglete', con: 'triangulo-lateral' }, corteHasta: { tipo: 'inglete', con: 'lomo' }, aletas: [{ lado: 1, inicio: 0.6, rampa: 0.12, meseta: 0.2, alto: 2.8 }] },
      { id: 'triangulo-interior', desde: [59.2, 64.6], hasta: [87.8, 112.3], ancho: 4.6, corteDesde: { tipo: 'T', con: 'triangulo-lateral' }, corteHasta: { tipo: 'T', con: 'lomo' }, aletas: [{ lado: 1, inicio: 0.1, rampa: 0.25, meseta: 0.45, alto: 2.3 }] },
      { id: 'lomo', desde: [104, 89], hasta: [16.4, 215], ancho: 7.2, corteDesde: { tipo: 'inglete', con: 'triangulo-derecho' }, corteHasta: { tipo: 'inglete', con: 'reloj-base' }, aletas: [{ lado: -1, inicio: 0.05, rampa: 0.1, meseta: 0.38, alto: 3.6 }] },
      { id: 'reloj-superior', desde: [11.6, 125.6], hasta: [64.4, 146], ancho: 5.2, corteDesde: { tipo: 'inglete', con: 'reloj-diagonal' }, corteHasta: { tipo: 'T', con: 'lomo' }, aletas: [] },
      { id: 'reloj-diagonal', desde: [11.6, 125.6], hasta: [99.6, 233.4], ancho: 6.8, corteDesde: { tipo: 'inglete', con: 'reloj-superior' }, corteHasta: { tipo: 'inglete', con: 'reloj-base' }, aletas: [{ lado: 1, inicio: 0.03, rampa: 0.1, meseta: 0.24, alto: 3.4 }] },
      { id: 'reloj-base', desde: [16.4, 215], hasta: [99.6, 233.4], ancho: 6.6, corteDesde: { tipo: 'inglete', con: 'lomo' }, corteHasta: { tipo: 'inglete', con: 'reloj-diagonal' }, aletas: [{ lado: 1, inicio: 0, rampa: 0.12, meseta: 0.38, alto: 3.3 }] },
      { id: 'chico-superior', desde: [63.8, 174.8], hasta: [95, 141.2], ancho: 4.6, corteDesde: { tipo: 'inglete', con: 'chico-inferior' }, corteHasta: { tipo: 'inglete', con: 'chico-vertical' }, aletas: [] },
      { id: 'chico-vertical', desde: [95, 141.2], hasta: [100.8, 211.6], ancho: 4.8, corteDesde: { tipo: 'inglete', con: 'chico-superior' }, corteHasta: { tipo: 'inglete', con: 'chico-inferior' }, aletas: [{ lado: -1, inicio: 0.2, rampa: 0.12, meseta: 0.45, alto: 2.2 }] },
      { id: 'chico-inferior', desde: [63.8, 174.8], hasta: [100.8, 211.6], ancho: 4.6, corteDesde: { tipo: 'inglete', con: 'chico-superior' }, corteHasta: { tipo: 'inglete', con: 'chico-vertical' }, aletas: [] },
      { id: 'anillo', centro: [29.6, 67.4], radio: 16.5, centroInterior: [30.4, 66.7], radioInterior: 10.6, aletas: [{ lado: 'exterior', inicio: 150, rampa: 30, meseta: 110, alto: 3 }] },
    ],
  },
  simple: {
    viewBox: '0 0 32 32',
    viewBoxSinFondo: '4.5 0 22 32',
    sombra: 0.7,
    filo: 0.15,
    trazos: [
      { id: 'triangulo-lateral', desde: [15.6, 5.6], hasta: [15.6, 26.9], ancho: 2.6, corteDesde: { tipo: 'inglete', con: 'triangulo-derecho' }, corteHasta: { tipo: 'inglete', con: 'triangulo-base' }, aletas: [] },
      { id: 'triangulo-derecho', desde: [15.6, 5.6], hasta: [22.9, 17.5], ancho: 2.5, corteDesde: { tipo: 'inglete', con: 'triangulo-lateral' }, corteHasta: { tipo: 'inglete', con: 'triangulo-base' }, aletas: [] },
      { id: 'triangulo-base', desde: [22.9, 17.5], hasta: [15.6, 26.9], ancho: 2.6, corteDesde: { tipo: 'inglete', con: 'triangulo-derecho' }, corteHasta: { tipo: 'inglete', con: 'triangulo-lateral' }, aletas: [] },
      { id: 'anillo', centro: [8.9, 14.1], radio: 3.6, centroInterior: [9.1, 13.9], radioInterior: 2, aletas: [] },
    ],
  },
}

const r1 = (n) => Math.round(n * 10) / 10
const sub = (a, b) => [a[0] - b[0], a[1] - b[1]]
const add = (a, b) => [a[0] + b[0], a[1] + b[1]]
const mul = (a, k) => [a[0] * k, a[1] * k]
const cross = (a, b) => a[0] * b[1] - a[1] * b[0]
const norm = (a) => {
  const l = Math.hypot(a[0], a[1])
  return [a[0] / l, a[1] / l]
}

/** Intersección de las rectas `p + t·d` y `q + s·e`. */
function intersect(p, d, q, e) {
  return add(p, mul(d, cross(sub(q, p), e) / cross(d, e)))
}

/**
 * Recta por la que se corta un extremo de la barra: bisectriz con la barra que comparte el vértice
 * (inglete), eje de la barra anfitriona (T) o perpendicular a la barra (sin unión).
 */
function corte(trazo, extremo, porId) {
  const v = trazo[extremo]
  const otro = trazo[extremo === 'desde' ? 'hasta' : 'desde']
  const haciaAdentro = norm(sub(otro, v))
  const union = trazo[extremo === 'desde' ? 'corteDesde' : 'corteHasta']
  if (!union) return { punto: v, dir: [-haciaAdentro[1], haciaAdentro[0]] }
  const host = porId[union.con]
  if (union.tipo === 'T') return { punto: v, dir: norm(sub(host.hasta, host.desde)) }
  const lejano = Math.hypot(...sub(host.desde, v)) < 1e-6 ? host.hasta : host.desde
  return { punto: v, dir: norm(add(haciaAdentro, norm(sub(lejano, v)))) }
}

/** `d` de una barra: lados paralelos al eje cortados por la recta de cada extremo, con su aleta continua. */
function barraPath(trazo, porId) {
  const { desde, hasta, ancho, aletas } = trazo
  const u = norm(sub(hasta, desde))
  const n = [-u[1], u[0]]
  const largo = Math.hypot(...sub(hasta, desde))
  const h = ancho / 2
  const c0 = corte(trazo, 'desde', porId)
  const c1 = corte(trazo, 'hasta', porId)
  const lado = (signo) => {
    const base = add(desde, mul(n, h * signo))
    const pts = [intersect(base, u, c0.punto, c0.dir)]
    for (const a of aletas.filter((f) => f.lado === signo)) {
      const en = (t, desvio) => add(add(desde, mul(u, t * largo)), mul(n, desvio * signo))
      const fin = a.inicio + a.rampa + a.meseta
      pts.push(en(a.inicio, h), en(a.inicio + a.rampa, h + a.alto), en(fin, h + a.alto), en(fin, h))
    }
    pts.push(intersect(base, u, c1.punto, c1.dir))
    return pts
  }
  const pts = [...lado(1), ...lado(-1).reverse()]
  return `M${pts.map(([x, y]) => `${r1(x)} ${r1(y)}`).join('L')}Z`
}

/** Círculo como dos arcos, desde su punto más a la izquierda. */
const circulo = (x, y, r) =>
  `M${r1(x - r)} ${r1(y)}a${r1(r)} ${r1(r)} 0 1 0 ${r1(2 * r)} 0a${r1(r)} ${r1(r)} 0 1 0 ${r1(-2 * r)} 0Z`

/**
 * `d` del anillo: contorno exterior (con su aleta: `M L A L A Z`, meseta concéntrica de radio
 * `radio + alto`) + círculo interior; se pinta con `evenodd`.
 */
function anilloPath({ centro: [cx, cy], radio, centroInterior: [ix, iy], radioInterior, aletas }) {
  const interior = circulo(ix, iy, radioInterior)
  const [a] = aletas
  if (!a) return circulo(cx, cy, radio) + interior
  const rad = (grados) => (grados * Math.PI) / 180
  const punto = (r, g) => `${r1(cx + r * Math.cos(rad(g)))} ${r1(cy + r * Math.sin(rad(g)))}`
  const rAleta = radio + a.alto
  const g0 = a.inicio
  const g1 = g0 + a.rampa
  const g2 = g1 + a.meseta
  const grande = (grados) => (grados > 180 ? 1 : 0)
  const exterior =
    `M${punto(radio, g0)}L${punto(rAleta, g1)}A${r1(rAleta)} ${r1(rAleta)} 0 ${grande(a.meseta)} 1 ${punto(rAleta, g2)}` +
    `L${punto(radio, g2)}A${r1(radio)} ${r1(radio)} 0 ${grande(360 - (g2 - g0))} 1 ${punto(radio, g0 + 360)}Z`
  return exterior + interior
}

/**
 * `d` de un trazo: barra (solo `M L Z`, coordenadas a 0.1) o anillo (`M L A L A Z` + círculo interior).
 * @param {Barra|Anillo} trazo
 * @param {Record<string, Barra|Anillo>} trazosPorId trazos de la variante por id (para resolver los cortes)
 * @returns {string}
 */
export function trazoPath(trazo, trazosPorId) {
  return trazo.radio === undefined ? barraPath(trazo, trazosPorId) : anilloPath(trazo)
}

/**
 * `d` de las dos formas que se pintan en cada capa: TODAS las barras en un solo `<path>` (mismo
 * sentido de giro, así `nonzero` da su unión sin costuras de antialias en los ingletes) y el
 * anillo aparte (`evenodd`).
 * @param {VarianteLogo} variante
 * @returns {{ barras: string, anillo: string }}
 */
export function logoPaths(variante) {
  const porId = Object.fromEntries(variante.trazos.map((t) => [t.id, t]))
  const esAnillo = (t) => t.radio !== undefined
  return {
    barras: variante.trazos.filter((t) => !esAnillo(t)).map((t) => trazoPath(t, porId)).join(''),
    anillo: variante.trazos.filter(esAnillo).map((t) => trazoPath(t, porId)).join(''),
  }
}

/**
 * Ancho del contorno (`stroke-width`) de las capas de sombra y filo: el doble del filo visible,
 * porque el relleno tapa la mitad interior.
 * @param {VarianteLogo} variante
 * @returns {number}
 */
export const trazoDelFilo = (variante) => Math.round(variante.filo * 2 * 100) / 100

/**
 * SVG del logotipo como texto (lo usan la plantilla de `og-image` y el generador del favicon).
 * Tres capas con las mismas formas: sombra desplazada, filo y relleno sin contorno encima, así
 * del filo solo queda visible la franja exterior de la silueta unida.
 * @param {{ variante: keyof typeof LOGO_VARIANTES, colores: { fill: string, edge: string }, fondo?: string, radioFondo?: number, conDimensiones?: boolean }} opciones
 *   `fondo` agrega un rectángulo de ese color (con esquinas de `radioFondo`, 4 por defecto) debajo de las capas
 * @returns {string}
 * @throws {Error} si `variante` no existe
 */
export function logoSvg({ variante, colores, fondo, radioFondo = 4, conDimensiones = false }) {
  const v = LOGO_VARIANTES[variante]
  if (!v) throw new Error(`logo: variante inexistente ${JSON.stringify(variante)}`)
  const { barras, anillo } = logoPaths(v)
  const formas = `    <path d="${barras}"/>\n    <path fill-rule="evenodd" d="${anillo}"/>`
  const contorno = `fill="${colores.edge}" stroke="${colores.edge}" stroke-width="${trazoDelFilo(v)}" stroke-linejoin="miter" stroke-miterlimit="2"`
  const [, , ancho, alto] = v.viewBox.split(' ')
  const dimensiones = conDimensiones ? ` width="${ancho}" height="${alto}"` : ''
  const esquinas = radioFondo > 0 ? ` rx="${radioFondo}"` : ''
  const rect = fondo ? `  <rect width="${ancho}" height="${alto}"${esquinas} fill="${fondo}"/>\n` : ''
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${v.viewBox}"${dimensiones}>
${rect}  <g ${contorno} transform="translate(${v.sombra} ${v.sombra})">
${formas}
  </g>
  <g ${contorno}>
${formas}
  </g>
  <g fill="${colores.fill}">
${formas}
  </g>
</svg>
`
}
