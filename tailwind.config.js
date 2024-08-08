/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    theme: {
      screens: {
        tablet: "640px",
        // => @media (min-width: 640px) { ... }
      },
    },
    fontFamily: {
      sans: ["Montserrat", "ans-serif"],
    },
    extend: {
      animation: {
        "lide-down": "lide-down 0.3s ease-out",
        "lide-up": "lide-up 0.3s ease-out",
      },
      keyframes: {
        "lide-down": {
          "0%": { transform: "translateY(-100%)", opacity: 0 },
          "100%": { transform: "translateY(0)", opacity: 1 },
        },
        "lide-up": {
          "0%": { transform: "translateY(0)", opacity: 1 },
          "100%": { transform: "translateY(-100%)", opacity: 0 },
        },
      },
    },
  },
  plugins: [],
};
