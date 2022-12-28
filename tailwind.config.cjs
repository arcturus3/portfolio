/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    fontFamily: {
      'sans': ['Inter', 'sans-serif'],
      'mono': ['Courier Prime', 'monospace'],
    },
    listStyleType: {
      'block-quote': '"> "',
    },
    extend: {},
  },
  plugins: [],
}
