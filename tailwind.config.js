/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'primary': '#32027a',
        'secondary': '#0053d0',
        'primary-light': '#6d1fa7',
        'secondary-light': '#3d7ce8',
      },
    },
  },
  plugins: [],
};