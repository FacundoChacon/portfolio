/**
 * Renderiza `public/og-image.png` desde la plantilla de `scripts/lib/og-image.mjs`.
 *
 * Manual: `npm run og:image`. No forma parte de `npm run ci` ni del build de
 * Vercel; el PNG se versiona. Requiere Chromium de Playwright
 * (`npx playwright install chromium`, una sola vez por máquina).
 */
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { chromium } from 'playwright'

import { EVA_THEME_COLORS } from '../src/styles/eva-tokens.js'
import {
  OG_IMAGE_HEIGHT,
  OG_IMAGE_MAX_BYTES,
  OG_IMAGE_WIDTH,
  buildOgImageHtml,
  readPngInfo,
} from './lib/og-image.mjs'

const root = new URL('../', import.meta.url)
const OUTPUT = fileURLToPath(new URL('public/og-image.png', root))

/** `woff2` de @fontsource (los mismos que `src/styles/fonts.css`) como data URL. */
function fontDataUrl(path) {
  const base64 = readFileSync(new URL(path, root)).toString('base64')
  return `data:font/woff2;base64,${base64}`
}

const fonts = {
  serif: fontDataUrl('node_modules/@fontsource-variable/noto-serif-display/files/noto-serif-display-latin-wdth-normal.woff2'),
  mono: fontDataUrl('node_modules/@fontsource-variable/jetbrains-mono/files/jetbrains-mono-latin-wght-normal.woff2'),
}

const html = buildOgImageHtml({ colors: EVA_THEME_COLORS, fonts })

let browser
try {
  browser = await chromium.launch()
} catch (error) {
  console.error(`No se pudo abrir Chromium: ${error.message.split('\n')[0]}`)
  console.error('Instalalo una vez con: npx playwright install chromium')
  process.exit(1)
}

try {
  const page = await browser.newPage({
    viewport: { width: OG_IMAGE_WIDTH, height: OG_IMAGE_HEIGHT },
    deviceScaleFactor: 1,
  })
  await page.setContent(html)
  await page.evaluate('document.fonts.ready')
  const png = await page.screenshot({ type: 'png', clip: { x: 0, y: 0, width: OG_IMAGE_WIDTH, height: OG_IMAGE_HEIGHT } })

  const info = readPngInfo(png)
  if (info.width !== OG_IMAGE_WIDTH || info.height !== OG_IMAGE_HEIGHT) {
    throw new Error(`Dimensiones inesperadas: ${info.width}x${info.height}`)
  }
  mkdirSync(dirname(OUTPUT), { recursive: true })
  writeFileSync(OUTPUT, png)
  console.log(`og-image.png ${info.width}x${info.height}, ${png.length} bytes (${(png.length / 1024).toFixed(1)} KB)`)
  if (png.length > OG_IMAGE_MAX_BYTES) {
    throw new Error(`La imagen pesa ${png.length} bytes y el tope es ${OG_IMAGE_MAX_BYTES}`)
  }
} catch (error) {
  console.error(`og:image falló: ${error.message}`)
  process.exitCode = 1
} finally {
  await browser.close()
}
