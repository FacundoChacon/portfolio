import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { routeHtmlPlugin } from './scripts/lib/route-html-plugin.mjs'

export default defineConfig({
  plugins: [react(), routeHtmlPlugin()],
})
