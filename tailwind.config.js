/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        olive: '#4B8C4A',
        terracotta: '#D16D3C',
        tomato: '#D85C44',
        cream: '#F8F1E1',
        gold: '#F0C14B',
        charcoal: '#2C2C2C',
      },
    },
  },
  plugins: [],
};