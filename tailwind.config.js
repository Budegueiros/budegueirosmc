/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        'brand-red': '#DC0A0A',
        'brand-dark': '#0A0A0A',
        'brand-gray': '#1A1A1A',
      },
      fontFamily: {
        'rebel': ['Rebel Bones', 'sans-serif'],
        'oswald': ['Oswald', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
