/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        mahjong: {
          green: '#1a472a',
          gold: '#d4af37',
          red: '#c0392b',
          dark: '#0f1923',
          card: '#1e2d3d',
          border: '#2d4a6a',
        },
      },
    },
  },
  plugins: [],
}
