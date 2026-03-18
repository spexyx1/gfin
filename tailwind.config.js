/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        'luxe-gold': '#d4af37',
        'luxe-green': '#00ff88',
        'luxe-dark': {
          50: '#2a2a2a',
          100: '#1e1e1e',
          200: '#141414',
          300: '#0a0a0a',
        },
        'neon-green': '#00ff88',
        'gold': '#d4af37',
      },
      boxShadow: {
        'luxe': '0 8px 32px rgba(0, 0, 0, 0.6)',
        'luxe-gold': '0 4px 20px rgba(212, 175, 55, 0.3)',
        'luxe-green': '0 4px 20px rgba(0, 255, 136, 0.3)',
      },
      backdropBlur: {
        'luxe': '24px',
      }
    },
  },
  plugins: [],
};
