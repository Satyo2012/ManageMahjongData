/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        mahjong: {
          gold: '#d4af37',
          'gold-light': '#e6c348',
          dark: '#0f1923',
          card: '#1e2d3d',
          panel: '#162535',
          row: '#1a2838',
          hover: '#243447',
          border: '#2d4a6a',
          muted: '#4a6080',
        },
      },
    },
  },
  plugins: [],
}
