/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#fbf7eb',
          100: '#f5ebd1',
          200: '#edd5a3',
          300: '#e4bc73',
          400: '#dca449',
          500: '#d68a29',
          600: '#ba6b20',
          700: '#954f1d',
          800: '#7a3f1d',
          900: '#65331b',
        },
        dark: {
          800: '#1e1e2e',
          900: '#11111b',
          950: '#0b0b12',
        },
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
