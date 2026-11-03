/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,jsx,ts,tsx}",
    "./components/**/*.{js,jsx,ts,tsx}",
  ],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        surface: {
          DEFAULT: "#0A0A0A",
          elevated: "#141414",
          card: "#1C1C1E",
          border: "#2C2C2E",
        },
        accent: {
          DEFAULT: "#FFFFFF",
          muted: "#8E8E93",
          gold: "#FFD60A",
        },
        brand: {
          primary: "#FFFFFF",
          secondary: "#636366",
        },
      },
      fontFamily: {
        sans: ["System"],
      },
    },
  },
  plugins: [],
};
