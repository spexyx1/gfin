/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        'apple-blue': '#007AFF',
        'apple-gray': {
          50: '#F2F2F7',
          100: '#E5E5EA',
          200: '#D1D1D6',
          300: '#C7C7CC',
          400: '#AEAEB2',
          500: '#8E8E93',
          600: '#636366',
          700: '#48484A',
          800: '#3A3A3C',
          900: '#1C1C1E',
          950: '#000000',
        },
        'apple-green': '#34C759',
        'apple-orange': '#FF9500',
        'apple-red': '#FF3B30',
        'apple-purple': '#AF52DE',
        'apple-pink': '#FF2D92',
        'apple-yellow': '#FFCC00',
        'neon-yellow': '#FFFF00',
        'neon-orange': '#FF6600',
        'neon-blue': '#00FFFF',
        'neon-red': '#FF0040',
        'gray-750': '#374151',
      },
      boxShadow: {
        'apple': '0 4px 20px rgba(0, 0, 0, 0.3)',
        'apple-lg': '0 8px 40px rgba(0, 0, 0, 0.4)',
        'apple-focus': '0 0 0 3px rgba(0, 122, 255, 0.3)',
        'neon-blue': '0 0 20px rgba(0, 255, 255, 0.5)',
        'neon-red': '0 0 20px rgba(255, 0, 64, 0.5)',
      },
      borderRadius: {
        'apple': '16px',
        'apple-lg': '24px',
      },
      backdropBlur: {
        'apple': '20px',
        'apple-lg': '30px',
      }
    },
  },
  plugins: [],
};
