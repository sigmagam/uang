import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/app/**/*.{js,ts,jsx,tsx}",
    "./src/components/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        paper: "#FAF6EC",
        paperDark: "#F0EADA",
        ink: "#1E2A21",
        ledger: {
          DEFAULT: "#2F5D50",
          light: "#3F7D58",
          dark: "#1F3D35",
        },
        gold: {
          DEFAULT: "#C79A45",
          light: "#E3C179",
        },
        rose: {
          DEFAULT: "#B3462C",
          light: "#D97757",
        },
        line: "#DCD3BC",
      },
      fontFamily: {
        display: ["var(--font-display)", "serif"],
        body: ["var(--font-body)", "sans-serif"],
      },
      boxShadow: {
        card: "0 1px 2px rgba(30,42,33,0.06), 0 4px 16px rgba(30,42,33,0.06)",
      },
      borderRadius: {
        card: "14px",
      },
    },
  },
  plugins: [],
};
export default config;
