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
          50: "#DAE2FF",
          100: "#C3C6D5",
          200: "#89aadf",
          300: "#5d88cf",
          400: "#3b68ba",
          500: "#00327D",
          600: "#002a68",
          700: "#002052",
          800: "#00173d",
          900: "#000d28",
          DEFAULT: "#00327D",
        },
        accent: {
          50: "#FFF7E9",
          100: "#FFDCBC",
          200: "#FFD899",
          300: "#FFC266",
          400: "#FFB86B",
          500: "#FFB86B",
          600: "#E5A352",
          700: "#CC8F3F",
          800: "#2C1700",
          DEFAULT: "#FFB86B",
        },
        teal: {
          50: "rgba(45, 219, 222, 0.2)",
          100: "rgba(0, 105, 107, 0.1)",
          200: "#2DBDDE",
          300: "#006E70",
          400: "#00696B",
          DEFAULT: "#00696B",
        },
        emergency: {
          DEFAULT: "#BA1A1A",
          dark: "#8B1515",
          light: "rgba(186, 26, 26, 0.5)",
          shadow: "rgba(186, 26, 26, 0.2)",
        },
        surface: {
          base: "#FFFFFF",
          muted: "#F5F5F6",
          soft: "#F8F8F9",
          card: "#FFFFFF",
          border: "#C3C6D5",
          "border-light": "rgba(195, 198, 213, 0.3)",
          "border-medium": "rgba(195, 198, 213, 0.5)",
        },
        text: {
          primary: "#00327D",
          body: "#434653",
          heading: "#191C1D",
          muted: "#434653",
          inverse: "#FFFFFF",
        },
      },
      fontFamily: {
        sans: ['Manrope', 'Inter', 'sans-serif'],
      },
      borderRadius: {
        'card': '12px',
        'module': '8px',
        'pill': '9999px',
      },
      boxShadow: {
        'card': '0px 4px 20px 0px rgba(0, 0, 0, 0.05)',
        'module': '0px 4px 6px -4px rgba(0, 0, 0, 0.1), 0px 10px 15px -3px rgba(0, 0, 0, 0.1)',
        'emergency': '0px 8px 10px -6px rgba(186, 26, 26, 0.2), 0px 20px 25px -5px rgba(186, 26, 26, 0.2)',
        'step': '0px 2px 4px -2px rgba(0, 0, 0, 0.1), 0px 4px 6px -1px rgba(0, 0, 0, 0.1)',
      },
    },
  },
  plugins: [],
}
