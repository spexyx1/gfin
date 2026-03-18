/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', '-apple-system', 'BlinkMacSystemFont', 'SF Pro Display', 'Segoe UI', 'Roboto', 'Helvetica Neue', 'Arial', 'sans-serif'],
        graffiti: ['Freckle Face', 'Impact', 'Arial Black', 'cursive'],
      },
      colors: {
        'neon-yellow': '#FFD700',
        'neon-orange': '#FF8C00',
        'bright-yellow': '#FFEA00',
        'electric-orange': '#FF6B00',
        'luxe-dark': {
          50: '#2a2a2a',
          100: '#1e1e1e',
          200: '#141414',
          300: '#0a0a0a',
        },
      },
      boxShadow: {
        'glow-yellow': '0 4px 20px rgba(255, 215, 0, 0.4)',
        'glow-orange': '0 4px 20px rgba(255, 140, 0, 0.4)',
        'elevation-sm': '0 2px 8px rgba(0, 0, 0, 0.1)',
        'elevation-md': '0 4px 16px rgba(0, 0, 0, 0.15)',
        'elevation-lg': '0 8px 32px rgba(0, 0, 0, 0.2)',
      },
      backdropBlur: {
        'light': '12px',
        'moderate': '16px',
      }
    },
  },
  plugins: [],
};
