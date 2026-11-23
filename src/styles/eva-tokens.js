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
  orange: '#FF7A1A', // acento principal, etiquetas, bordes
  red: '#E8202A', // alertas: solo texto grande o decoración
  purple: '#8A4FD8', // acento secundario: solo texto grande o decoración
  green: '#3DFF7A', // fósforo: estados OK, código, anillo de foco
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
  ...['paper', 'gray', 'orange', 'green'].flatMap((fg) =>
    ['black', 'panel', 'line'].map((bg) => ({ fg, bg, level: 'normal' })),
  ),
  { fg: 'red', bg: 'black', level: 'large' },
  { fg: 'red', bg: 'panel', level: 'large' },
  { fg: 'red', bg: 'line', level: 'large' },
  { fg: 'purple', bg: 'black', level: 'large' },
  { fg: 'purple', bg: 'panel', level: 'large' },
  { fg: 'gray-dim', bg: 'black', level: 'ui' },
  { fg: 'gray-dim', bg: 'panel', level: 'ui' },
  { fg: 'black', bg: 'orange', level: 'normal' },
  { fg: 'black', bg: 'green', level: 'normal' },
  { fg: 'paper', bg: 'red', level: 'large' },
  { fg: 'paper', bg: 'purple', level: 'large' },
]
