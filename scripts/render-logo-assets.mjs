/**
 * Genera `public/favicon.svg` y `public/apple-touch-icon.png` (180x180) desde la geometría única
 * del logotipo (`src/data/logo.js`).
 *
 * Manual: `npm run logo:assets`. No forma parte de `npm run ci` ni del build de Vercel; los
 * archivos se versionan. Requiere Chromium de Playwright (`npx playwright install chromium`).
 */
import { mkdirSync, writeFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { chromium } from 'playwright'

import { faviconSvg, touchIconSvg } from './lib/logo-assets.mjs'
import { readPngInfo } from './lib/og-image.mjs'

const root = new URL('../', import.meta.url)
const FAVICON = fileURLToPath(new URL('public/favicon.svg', root))
const TOUCH_ICON = fileURLToPath(new URL('public/apple-touch-icon.png', root))
const TOUCH_ICON_SIZE = 180

mkdirSync(fileURLToPath(new URL('public/', root)), { recursive: true })
writeFileSync(FAVICON, faviconSvg())
console.log('favicon.svg escrito')

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
    viewport: { width: TOUCH_ICON_SIZE, height: TOUCH_ICON_SIZE },
    deviceScaleFactor: 1,
  })
  const svg = touchIconSvg().replace('<svg ', `<svg width="${TOUCH_ICON_SIZE}" height="${TOUCH_ICON_SIZE}" `)
  await page.setContent(`<!doctype html><html><body style="margin:0;background:#000">${svg}</body></html>`)
  const png = await page.screenshot({ type: 'png', clip: { x: 0, y: 0, width: TOUCH_ICON_SIZE, height: TOUCH_ICON_SIZE } })
  const info = readPngInfo(png)
  if (info.width !== TOUCH_ICON_SIZE || info.height !== TOUCH_ICON_SIZE) {
    throw new Error(`Dimensiones inesperadas: ${info.width}x${info.height}`)
  }
  writeFileSync(TOUCH_ICON, png)
  console.log(`apple-touch-icon.png ${info.width}x${info.height}, ${png.length} bytes`)
} catch (error) {
  console.error(`logo:assets falló: ${error.message}`)
  process.exitCode = 1
} finally {
  await browser.close()
}
