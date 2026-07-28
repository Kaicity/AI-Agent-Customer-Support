import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: {
          950: "#0E1A1D",
          900: "#132428",
          800: "#1B3236",
          700: "#274449",
        },
        signal: {
          500: "#1D9E75", // xanh lá đậm - trạng thái tự động/ổn định
          600: "#0F6E56",
        },
        flare: {
          500: "#D85A30", // cam đất - cần con người can thiệp
          600: "#993C1D",
        },
        paper: "#F6F5F1",
      },
      fontFamily: {
        sans: ["var(--font-sans)"],
        mono: ["var(--font-mono)"],
      },
    },
  },
  plugins: [],
};
export default config;
