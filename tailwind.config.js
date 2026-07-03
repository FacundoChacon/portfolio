/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        dark: {
          DEFAULT: '#030303',
          secondary: '#0A0A0A',
          card: '#111116',
          border: '#1A1A22',
        },
        accent: {
          green: '#00ffc3',
          'green-dark': '#00cc9a',
          pink: '#ff6eff',
          'pink-dark': '#cc3acc',
        },
        neon: {
          cyan: '#00ffc3',
          magenta: '#ff6eff',
        },
        muted: {
          DEFAULT: '#1A1A22',
          foreground: '#9ca3af',
        }
      },
      fontFamily: {
        sans: ['Rajdhani', 'Inter', 'system-ui', 'sans-serif'],
        display: ['Orbitron', 'Rajdhani', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
      },
      animation: {
        'fade-in': 'fadeIn 0.6s ease-out forwards',
        'slide-up': 'slideUp 0.6s ease-out forwards',
        'pulse-slow': 'pulse 3s ease-in-out infinite',
        flicker: 'flicker 4s infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        flicker: {
          '0%, 100%': { opacity: '1' },
          '92%': { opacity: '1' },
          '94%': { opacity: '0.4' },
          '96%': { opacity: '1' },
          '98%': { opacity: '0.7' },
        },
      },
    },
  },
  plugins: [],
}
