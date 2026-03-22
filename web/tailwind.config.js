/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        app: {
          bg: '#000000',
          surface: '#0d0d0d',
          panel: '#111111',
          border: '#222222',
          text: '#f0f0f0',
          muted: '#888888',
          soft: '#444444',
          accent: '#e94560',
          danger: '#e24b4a',
          success: '#1d9e75',
          warning: '#ef9f27',
          info: '#378add',
        },
      },
      boxShadow: {
        glow: '0 0 0 1px rgba(233, 69, 96, 0.14), 0 24px 80px rgba(0, 0, 0, 0.55)',
      },
      fontFamily: {
        sans: ['"Space Grotesk"', '"Segoe UI"', 'sans-serif'],
        mono: ['"JetBrains Mono"', '"Cascadia Code"', 'monospace'],
      },
    },
  },
  plugins: [],
}
