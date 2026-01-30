import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // Warm bookish color palette
        cream: {
          DEFAULT: "#FDF8F3",
          50: "#FFFDFB",
          100: "#FDF8F3",
          200: "#F9F0E6",
          300: "#F2E4D3",
          400: "#E8D4BC",
        },
        burgundy: {
          DEFAULT: "#722F37",
          50: "#F9E8EA",
          100: "#F0CDD0",
          200: "#D89EA4",
          300: "#C06F78",
          400: "#8B3D46",
          500: "#722F37",
          600: "#5C262C",
          700: "#461D22",
          800: "#301417",
          900: "#1A0B0D",
        },
        gold: {
          DEFAULT: "#C9A227",
          50: "#FCF7E6",
          100: "#F7ECBF",
          200: "#EDD87F",
          300: "#DFC044",
          400: "#C9A227",
          500: "#A88520",
          600: "#876A1A",
          700: "#665013",
          800: "#44360D",
          900: "#221B06",
        },
        forest: {
          DEFAULT: "#2D4739",
          50: "#E8EFEB",
          100: "#C8D9CF",
          200: "#96B3A3",
          300: "#648D77",
          400: "#3D6651",
          500: "#2D4739",
          600: "#243A2E",
          700: "#1B2C23",
          800: "#121D17",
          900: "#090F0C",
        },
        parchment: {
          DEFAULT: "#F4E4C9",
          light: "#FAF3E7",
          dark: "#E6D5B8",
        },
      },
      fontFamily: {
        serif: ["var(--font-lora)", "Georgia", "Cambria", "serif"],
        display: ["var(--font-cinzel-decorative)", "serif"],
      },
    },
  },
  plugins: [],
};
export default config;
