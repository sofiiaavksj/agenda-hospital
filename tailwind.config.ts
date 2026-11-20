import type { Config } from "tailwindcss";

export default {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        // Azul señalética (como los letreros de hospital y de paradero) + amarillo de acento.
        azul: { DEFAULT: "#1450C8", dark: "#0B2A66", soft: "#E6EFFF" },
        mist: "#F3F7FD",
        ink: { DEFAULT: "#0F1D3A", soft: "#46526B" },
        line: "#D3DEF0",
        sol: { DEFAULT: "#FFC233", soft: "#FFF4D4", ink: "#6B4A00" },
        risk: { alto: "#B42318", medio: "#9A6212", bajo: "#1F7A4D" },
      },
      fontFamily: {
        sans: ['"Atkinson Hyperlegible"', "system-ui", "sans-serif"],
      },
    },
  },
  plugins: [],
} satisfies Config;
