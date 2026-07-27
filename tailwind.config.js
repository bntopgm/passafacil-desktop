/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
      },
      colors: {
        primary: {
          DEFAULT: "#3B9EFF",
          hover: "#1A6BC4",
          light: "#EBF5FF",
        },
        brand: {
          bg: "#F8FAFC",
          border: "#E2E8F0",
          "text-primary": "#1E293B",
          "text-secondary": "#64748B",
        },
      },
    },
  },
  plugins: [],
};
