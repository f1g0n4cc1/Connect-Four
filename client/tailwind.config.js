/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'wood-grain': '#3d2b1f',
        'chip-p1': '#e94560',
        'chip-p2': '#fcd34d',
      },
    },
  },
  plugins: [],
}
