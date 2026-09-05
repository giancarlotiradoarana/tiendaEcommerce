import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        gold: {
          DEFAULT: "#C9A24B",
          light: "#E4C77A",
          dark: "#A8842F",
        },
        ink: {
          DEFAULT: "#0B0B0F",
          soft: "#14141B",
          card: "#1B1B24",
        },
      },
      fontFamily: {
        sans: ["var(--font-inter)", "system-ui", "sans-serif"],
        serif: ["var(--font-playfair)", "Georgia", "serif"],
        display: ["var(--font-playfair)", "Georgia", "serif"],
      },
      boxShadow: {
        glow: "0 0 40px rgba(201,162,75,0.15)",
      },
    },
  },
  plugins: [],
};

export default config;
