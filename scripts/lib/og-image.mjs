/**
 * Imagen para compartir (`public/og-image.png`): plantilla HTML y lectura de PNG.
 *
 * Sin I/O: `scripts/render-og-image.mjs` lee las fuentes, abre Chromium y guarda
 * el PNG; acá solo vive lo que se puede testear sin navegador.
 */

export const OG_IMAGE_WIDTH = 1200
export const OG_IMAGE_HEIGHT = 630
/** Tope de peso para que las previews de mensajería la acepten. */
export const OG_IMAGE_MAX_BYTES = 300 * 1024

/** Textos de la imagen (cada uno aparece una sola vez en la plantilla). */
export const OG_IMAGE_TEXT = {
  name: 'Facundo Chacón',
  role: 'Desarrollador Full Stack Java / React',
  domain: 'facucode.dev',
}

const PNG_SIGNATURE = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])
/** Firma (8) + longitud y tipo del chunk (8) + datos del IHDR (13). */
const IHDR_END = 8 + 8 + 13

/**
 * Datos del chunk IHDR de un PNG.
 * @param {Buffer} buffer
 * @returns {{ width: number, height: number, bitDepth: number, colorType: number }}
 * @throws {Error} si no es un PNG válido o está truncado
 */
export function readPngInfo(buffer) {
  if (buffer.length < IHDR_END || !buffer.subarray(0, 8).equals(PNG_SIGNATURE)) {
    throw new Error('El archivo no es un PNG válido (firma incorrecta o PNG truncado)')
  }
  if (buffer.toString('ascii', 12, 16) !== 'IHDR') {
    throw new Error('PNG inválido: el primer chunk no es IHDR')
  }
  return {
    width: buffer.readUInt32BE(16),
    height: buffer.readUInt32BE(20),
    bitDepth: buffer[24],
    colorType: buffer[25],
  }
}

/**
 * Escapa texto para insertarlo en HTML.
 * @param {string} text
 * @returns {string}
 */
export function escapeHtml(text) {
  return text
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;')
}

/** `#RRGGBB` -> `r g b` (para `rgb(r g b / a)`). */
function rgbTriplet(hex) {
  const n = Number.parseInt(hex.slice(1), 16)
  return `${(n >> 16) & 255} ${(n >> 8) & 255} ${n & 255}`
}

/** Trazo del hexágono de la grilla del sitio (`.eva-hex-grid`), celda de 28x49. */
const HEX_PATH =
  'M13.99 9.25l13 7.5v15l-13 7.5L1 31.75v-15l12.99-7.5zM3 17.9v12.7l10.99 6.34 11-6.35V17.9l-11-6.34L3 17.9zM0 15l12.98-7.5V0h-2v6.35L0 12.69v2.3zm0 18.5L12.98 41v8h-2v-6.85L0 35.81v-2.3zM15 0v7.5L27.99 15H28v-2.31h-.01L17 6.35V0h-2zm0 49v-8l12.99-7.5H28v2.31h-.01L17 42.15V49h-2z'

/**
 * HTML completo de la imagen, autocontenido (fuentes como data URLs, sin
 * recursos externos).
 * @param {{ colors: Record<string, string>, fonts: { serif: string, mono: string } }} options
 *   `colors`: roles de la paleta a hex (`EVA_THEME_COLORS`); `fonts`: data URLs `data:font/woff2;base64,…`
 * @returns {string}
 */
export function buildOgImageHtml({ colors, fonts }) {
  const { black, paper, gray, primary, secondary, tertiary } = colors
  const primaryLight = colors['primary-light']
  const text = Object.fromEntries(Object.entries(OG_IMAGE_TEXT).map(([key, value]) => [key, escapeHtml(value)]))

  return `<!doctype html>
<html lang="es">
<head>
<meta charset="utf-8">
<style>
@font-face {
  font-family: 'Noto Serif Display';
  font-weight: 100 900;
  font-stretch: 62.5% 100%;
  src: url(${fonts.serif}) format('woff2-variations');
}
@font-face {
  font-family: 'JetBrains Mono';
  font-weight: 100 800;
  src: url(${fonts.mono}) format('woff2-variations');
}
* { box-sizing: border-box; margin: 0; padding: 0; }
html, body { width: ${OG_IMAGE_WIDTH}px; height: ${OG_IMAGE_HEIGHT}px; overflow: hidden; background: ${black}; }
.card { position: relative; width: ${OG_IMAGE_WIDTH}px; height: ${OG_IMAGE_HEIGHT}px; background: ${black}; color: ${paper}; font-family: 'JetBrains Mono', monospace; }
.grid { position: absolute; inset: 0; }
.frame { position: absolute; inset: 28px; border: 4px solid ${primary}; }
.stripes { position: absolute; left: 28px; right: 28px; bottom: 28px; height: 22px; background: repeating-linear-gradient(-45deg, ${secondary} 0 14px, ${black} 14px 28px); }
.content { position: absolute; left: 84px; right: 84px; top: 84px; bottom: 100px; display: flex; flex-direction: column; justify-content: center; }
.label { font-size: 26px; font-weight: 500; letter-spacing: 0.3em; text-transform: uppercase; color: ${primaryLight}; margin-bottom: 28px; }
.label b { color: ${secondary}; font-weight: 700; }
.name { font-family: 'Noto Serif Display', serif; font-weight: 900; font-stretch: 62.5%; font-variation-settings: 'wdth' 62.5; font-size: 118px; line-height: 0.95; letter-spacing: -0.01em; text-transform: uppercase; color: ${paper}; white-space: nowrap; }
.rule { width: 160px; height: 8px; background: ${primary}; margin: 36px 0 30px; }
.role { font-size: 36px; font-weight: 500; color: ${gray}; }
.domain { margin-top: 34px; font-size: 40px; font-weight: 700; color: ${tertiary}; }
.domain span { color: ${primaryLight}; margin-right: 14px; }
</style>
</head>
<body>
<div class="card">
  <svg class="grid" width="${OG_IMAGE_WIDTH}" height="${OG_IMAGE_HEIGHT}" aria-hidden="true">
    <defs>
      <pattern id="hex" width="28" height="49" patternUnits="userSpaceOnUse" patternTransform="scale(1.6)">
        <path d="${HEX_PATH}" fill="rgb(${rgbTriplet(primary)} / 0.16)"></path>
      </pattern>
    </defs>
    <rect width="100%" height="100%" fill="url(#hex)"></rect>
  </svg>
  <div class="frame"></div>
  <div class="content">
    <p class="label"><b>SYS</b> // FICHA</p>
    <h1 class="name">${text.name}</h1>
    <div class="rule"></div>
    <p class="role">${text.role}</p>
    <p class="domain"><span>&gt;</span>${text.domain}</p>
  </div>
  <div class="stripes"></div>
</div>
</body>
</html>
`
}
