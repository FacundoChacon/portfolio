#!/usr/bin/env node
/**
 * Verifica la configuración de deploy (C-12): `vercel.json` (cabeceras, CSP,
 * rewrite SPA), `public/sitemap.xml` y `public/robots.txt`.
 *
 * La lógica vive en `scripts/lib/deploy-config.mjs` (con tests). Este CLI solo
 * lee los archivos, imprime advertencias y falla con código 1 ante errores.
 *
 * Uso: npm run verify:deploy
 */
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { checkRobots, checkSitemap, checkVercelConfig } from './lib/deploy-config.mjs'

const root = fileURLToPath(new URL('..', import.meta.url))
const read = (relativePath) => readFileSync(`${root}${relativePath}`, 'utf8')

const SITE = 'https://www.facucode.dev'
const SITEMAP_URL = `${SITE}/sitemap.xml`
const PUBLIC_PAGES = [`${SITE}/`]

const errors = []
const warnings = []

try {
  const result = checkVercelConfig(JSON.parse(read('vercel.json')))
  errors.push(...result.errors)
  warnings.push(...result.warnings)
} catch (error) {
  errors.push(`vercel.json: no se pudo leer o parsear (${error.message})`)
}

try {
  errors.push(...checkSitemap(read('public/sitemap.xml'), PUBLIC_PAGES))
} catch (error) {
  errors.push(`public/sitemap.xml: no se pudo leer (${error.message})`)
}

try {
  errors.push(...checkRobots(read('public/robots.txt'), SITEMAP_URL))
} catch (error) {
  errors.push(`public/robots.txt: no se pudo leer (${error.message})`)
}

for (const warning of warnings) console.warn(`⚠ verify:deploy — ${warning}`)

if (errors.length > 0) {
  console.error('verify:deploy FALLÓ:')
  for (const error of errors) console.error(`  - ${error}`)
  process.exit(1)
}

console.log('verify:deploy OK')
