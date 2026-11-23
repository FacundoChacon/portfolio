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
