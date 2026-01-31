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
        cream: {
          DEFAULT: "var(--color-cream)",
          50: "var(--color-cream-50)",
          100: "var(--color-cream-100)",
          200: "var(--color-cream-200)",
          300: "var(--color-cream-300)",
          400: "var(--color-cream-400)",
        },
        burgundy: {
          DEFAULT: "var(--color-burgundy)",
          50: "var(--color-burgundy-50)",
          100: "var(--color-burgundy-100)",
          200: "var(--color-burgundy-200)",
          300: "var(--color-burgundy-300)",
          400: "var(--color-burgundy-400)",
          500: "var(--color-burgundy-500)",
          600: "var(--color-burgundy-600)",
          700: "var(--color-burgundy-700)",
          800: "var(--color-burgundy-800)",
          900: "var(--color-burgundy-900)",
        },
        gold: {
          DEFAULT: "var(--color-gold)",
          50: "var(--color-gold-50)",
          100: "var(--color-gold-100)",
          200: "var(--color-gold-200)",
          300: "var(--color-gold-300)",
          400: "var(--color-gold-400)",
          500: "var(--color-gold-500)",
          600: "var(--color-gold-600)",
          700: "var(--color-gold-700)",
          800: "var(--color-gold-800)",
          900: "var(--color-gold-900)",
        },
        forest: {
          DEFAULT: "var(--color-forest)",
          50: "var(--color-forest-50)",
          100: "var(--color-forest-100)",
          200: "var(--color-forest-200)",
          300: "var(--color-forest-300)",
          400: "var(--color-forest-400)",
          500: "var(--color-forest-500)",
          600: "var(--color-forest-600)",
          700: "var(--color-forest-700)",
          800: "var(--color-forest-800)",
          900: "var(--color-forest-900)",
        },
        parchment: {
          DEFAULT: "var(--color-parchment)",
          light: "var(--color-parchment-light)",
          dark: "var(--color-parchment-dark)",
        },
      },
      fontFamily: {
        serif: ["var(--font-body)"],
        display: ["var(--font-display)"],
      },
    },
  },
  plugins: [],
};
export default config;
