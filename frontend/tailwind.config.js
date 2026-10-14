/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: { navy: "#0b1f4b", deep: "#07142f", ink: "#13182a", electric: "#1d6bff", gold: "#e0a82e", mist: "#f1f3f8" },
      fontFamily: { sans: ["Manrope", "system-ui", "sans-serif"] },
    },
  },
  plugins: [],
};
