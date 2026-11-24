/**
 * Paleta `eva`: única fuente de verdad de los colores del rediseño. La consumen
 * `tailwind.config.js` (clases `eva-*`), las variables CSS `--eva-*` y los
 * tests de contraste (`scripts/contrast.test.mjs`).
 */
export const EVA_COLORS = {
  black: '#050505', // fondo principal
  panel: '#100E0C', // fondo de paneles
  line: '#2B2620', // divisores/bordes decorativos (no componente de UI)
  paper: '#EDE6D6', // texto principal
  gray: '#A39C8E', // texto secundario
  'gray-dim': '#6B655B', // bordes de componentes de UI, nunca texto
  violet: '#9B5CF0', // primary: rellenos y bordes de UI (texto negro encima), nunca texto chico
  'violet-light': '#B08AFF', // primary-light: texto de acento
  orange: '#FF7A1A', // secondary: sombras, hover y franjas que acompañan al violeta
  aqua: '#74F8D4', // tertiary y focus: detalles de estado y anillo de foco
  sky: '#7CC8FF', // success (estado del configurador, fuera de la jerarquía)
  'red-light': '#FF8A9A', // error (estado del configurador, fuera de la jerarquía)
}

/**
 * Roles de la jerarquía de color: los componentes nombran el ROL (`eva-primary`),
 * nunca el color. Cambiar el color de un rol se hace acá y no obliga a tocar
 * componentes. Jerarquía: primary (violeta) > secondary (naranja) > tertiary (agua).
 */
export const EVA_ROLES = {
  primary: 'violet',
  'primary-light': 'violet-light',
  secondary: 'orange',
  tertiary: 'aqua',
  focus: 'aqua',
}

/** Roles semánticos de estado: fuera de la jerarquía y solo para el configurador. */
export const EVA_STATUS_ROLES = { success: 'sky', error: 'red-light' }

const NEUTRALS = ['black', 'panel', 'line', 'paper', 'gray', 'gray-dim']

/**
 * Colores que consume `tailwind.config.js` (`colors.eva`): neutros + roles +
 * roles de estado resueltos a hex. Los nombres de color (`violet`, `orange`,
 * `aqua`...) no generan clases: los componentes nombran el rol.
 */
export const EVA_THEME_COLORS = {
  ...Object.fromEntries(NEUTRALS.map((name) => [name, EVA_COLORS[name]])),
  ...Object.fromEntries(Object.entries(EVA_ROLES).map(([role, color]) => [role, EVA_COLORS[color]])),
  ...Object.fromEntries(Object.entries(EVA_STATUS_ROLES).map(([role, color]) => [role, EVA_COLORS[color]])),
}

/**
 * Pila de la sans-serif del cuerpo: fuente del sistema operativo, sin archivos que
 * descargar (sin swap ni CLS). La identidad la dan la serif condensada y la mono.
 */
export const EVA_FONT_SANS = [
  'system-ui',
  '-apple-system',
  'BlinkMacSystemFont',
  '"Segoe UI"',
  'Roboto',
  '"Helvetica Neue"',
  'Arial',
  '"Noto Sans"',
  'sans-serif',
]

/**
 * Pares texto/fondo declarados y su nivel: `normal` >= 4.5, `large` >= 3,
 * `ui` >= 3 (componentes de interfaz). Si un token cambia y un par baja de su
 * umbral, el test de contraste falla.
 * @type {{ fg: string, bg: string, level: 'normal'|'large'|'ui' }[]}
 */
export const EVA_CONTRAST_PAIRS = [
  ...['paper', 'gray', 'violet-light', 'orange', 'aqua', 'sky', 'red-light'].flatMap((fg) =>
    ['black', 'panel', 'line'].map((bg) => ({ fg, bg, level: 'normal' })),
  ),
  // violet: UI y texto grande, nunca texto normal (3.69 sobre línea).
  ...['black', 'panel', 'line'].map((bg) => ({ fg: 'violet', bg, level: 'ui' })),
  // El foco (aqua) también contrasta con el relleno violeta de los CTA.
  { fg: 'aqua', bg: 'violet', level: 'ui' },
  ...['violet', 'violet-light', 'orange', 'aqua', 'sky', 'red-light'].map((bg) => ({
    fg: 'black',
    bg,
    level: 'normal',
  })),
  { fg: 'gray-dim', bg: 'black', level: 'ui' },
  { fg: 'gray-dim', bg: 'panel', level: 'ui' },
]

/**
 * Colores de marca de Stack y Contacto (change `colores-de-marca-hover`). Son decorativos y
 * viven FUERA de `EVA_COLORS`, de `EVA_THEME_COLORS` y de la jerarquía de roles: no generan
 * clases de Tailwind. Llegan al CSS como `--brand` vía `[data-brand="<clave>"]`
 * (`brandBaseStyles`). Todos dan >= 4.5:1 contra black y panel; los que en su color oficial
 * no llegan (mysql, web, linkedin) son una variante más clara del mismo tono.
 */
export const EVA_BRAND_COLORS = {
  java: '#F89820',
  spring: '#6DB33F',
  react: '#61DAFB',
  tailwind: '#2DD4BF', // teal
  javascript: '#F7DF1E',
  mysql: '#6FA8DC', // aclarado de #4479A1
  python: '#FFD43B',
  docker: '#2496ED',
  git: '#F05032',
  rest: '#93D500', // sin marca oficial: verde lima
  jwt: '#FB015B',
  web: '#6C8BFF', // aclarado del azul CSS3 #264DE4
  email: '#EA4335',
  github: '#3FB950',
  linkedin: '#70B5F9', // aclarado de #0A66C2
}

const BRAND_KEY_PATTERN = /^[a-z][a-z0-9-]*$/

/**
 * Estilos de la capa base de Tailwind: una regla `[data-brand="<clave>"] { --brand: <hex> }`
 * por marca, para que los componentes solo pongan `data-brand` (sin estilos inline: la CSP
 * de producción no admite `'unsafe-inline'`).
 * @param {Record<string, string>} [colors] clave -> hex
 * @returns {Record<string, { '--brand': string }>}
 * @throws {Error} si una clave no cumple `^[a-z][a-z0-9-]*$` (va dentro de un selector)
 */
export function brandBaseStyles(colors = EVA_BRAND_COLORS) {
  return Object.fromEntries(
    Object.entries(colors).map(([key, hex]) => {
      if (!BRAND_KEY_PATTERN.test(key)) throw new Error(`eva-tokens: clave de marca inválida ${JSON.stringify(key)}`)
      return [`[data-brand="${key}"]`, { '--brand': hex }]
    }),
  )
}
