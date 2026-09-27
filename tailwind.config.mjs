import { fontFamily } from "tailwindcss/defaultTheme";
import animate from "tailwindcss-animate";

/** @type {import('tailwindcss').Config} */
const config = {
  darkMode: ["class"],
  content: [
    "./src/pages/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}",
    "./src/components/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}",
    "./src/layouts/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}",
  ],
  prefix: "",
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: { "2xl": "1400px" },
    },
    extend: {
      // RENKLERİ DOĞRUDAN HEX KODLARIYLA TANIMLIYORUZ
      colors: {
        background: "#FDFBF6",
        foreground: "#2C2C2C",
        card: "#FFFFFF",
        primary: {
          DEFAULT: "#E63946",
          foreground: "#FDFBF6",
        },
        secondary: {
          DEFAULT: "#EEEEEE",
          foreground: "#2C2C2C",
        },
        accent: "#FFCA3A",
        muted: "#8D8D8D",
        value: "#2E8B57", // Canlı ama tok bir yeşil tonu
      },
      fontFamily: {
        sans: ["Roboto", ...fontFamily.sans],
        heading: ["Poppins", ...fontFamily.sans],
      },
      borderRadius: {
        lg: "12px",
        md: "calc(12px - 2px)",
        sm: "calc(12px - 4px)",
      },
      boxShadow: {
        subtle: "0px 8px 24px rgba(0, 0, 0, 0.15)",
      },
    },
  },
  plugins: [animate],
};

export default config;
