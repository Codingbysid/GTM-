import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "#09090B",
        card: "#121215",
        surface: "#18181B",
        border: "#27272A",
        muted: "#71717A",
        "muted-dark": "#27272A",
        accent: "#3B82F6",
        emerald: {
          500: "#10B981",
          950: "#064E3B",
        },
        amber: {
          500: "#F59E0B",
          950: "#78350F",
        },
        rose: {
          500: "#F43F5E",
          950: "#881337",
        },
      },
      fontFamily: {
        mono: [
          "ui-monospace",
          "SFMono-Regular",
          "Menlo",
          "Monaco",
          "Consolas",
          '"Liberation Mono"',
          '"Courier New"',
          "monospace",
        ],
      },
    },
  },
  plugins: [],
};
export default config;
