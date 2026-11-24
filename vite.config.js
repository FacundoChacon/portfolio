import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { fontPreloadPlugin } from './scripts/lib/font-preload-plugin.mjs'
import { routeHtmlPlugin } from './scripts/lib/route-html-plugin.mjs'

export default defineConfig({
  plugins: [react(), fontPreloadPlugin(), routeHtmlPlugin()],
})
