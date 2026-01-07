/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        'brand-red': '#D32F2F',
        'brand-dark': '#0A0A0A',
        'brand-gray': '#1A1A1A',
        'brand-background': '#121212',
        'brand-surface': '#1E1E1E',
        'brand-accent': '#FFC107',
      },
      fontFamily: {
        'rebel': ['Rebel Bones', 'sans-serif'],
        'oswald': ['Oswald', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
