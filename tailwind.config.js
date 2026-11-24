import { EVA_THEME_COLORS, EVA_FONT_SANS, brandBaseStyles, logoBaseStyles } from './src/styles/eva-tokens.js'

/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        eva: EVA_THEME_COLORS,
      },
      fontFamily: {
        sans: EVA_FONT_SANS,
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
        'eva-display': ['"Noto Serif Display"', 'Georgia', 'serif'],
      },
      animation: {
        'eva-boot': 'evaBoot 0.36s steps(6, end) backwards',
        'eva-obturador': 'evaObturador 0.3s steps(6, end) forwards',
      },
      keyframes: {
        evaObturador: {
          '0%': { 'clip-path': 'inset(0 0 0 0)' },
          '100%': { 'clip-path': 'inset(0 0 0 100%)' },
        },
        evaBoot: {
          '0%': { 'clip-path': 'inset(0 100% 0 0)' },
          '100%': { 'clip-path': 'inset(0 0 0 0)' },
        },
      },
    },
  },
  plugins: [({ addBase }) => addBase(brandBaseStyles()), ({ addBase }) => addBase(logoBaseStyles())],
}
