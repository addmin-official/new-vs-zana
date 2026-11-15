import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: "class",
  theme: {
    extend: {
      fontFamily: {
        sans: ["'Noto Sans Arabic'", "'Noto Kufi Arabic'", "Vazirmatn", "system-ui", "sans-serif"],
        mono: ["'JetBrains Mono'", "monospace"],
      },
      fontSize: {
        "ckb-sm": ["0.95rem", { lineHeight: "1.8" }],
        "ckb-base": ["1.1rem", { lineHeight: "1.8" }],
        "ckb-lg": ["1.25rem", { lineHeight: "1.8" }],
      },
      lineHeight: {
        kurdish: "1.8",
      },
    },
  },
  plugins: [],
};

export default config;
