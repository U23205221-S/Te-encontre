/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50: "#edf3fb",
          100: "#d7e3f6",
          200: "#b3c9ec",
          300: "#89aadf",
          400: "#5d88cf",
          500: "#3b68ba",
          600: "#2f5399",
          700: "#273f77",
          800: "#1b2e56",
          900: "#111f3a",
          DEFAULT: "#111f3a",
        },
        accent: {
          50: "#fff7e9",
          100: "#ffe9c1",
          200: "#ffd899",
          300: "#ffc266",
          400: "#ffad33",
          500: "#ff9800",
          600: "#db7f00",
          700: "#ad6400",
          DEFAULT: "#ff9800",
        },
        emergency: {
          DEFAULT: "#ff0000",
          dark: "#cc0000",
        },
        surface: {
          base: "#060b16",
          muted: "#0d1424",
          soft: "#182335",
          card: "#121b2b",
        },
      },
    },
  },
  plugins: [],
}
