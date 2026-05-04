import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        cormorant: ["var(--font-cormorant)", "serif"],
        "dm-sans": ["var(--font-dm-sans)", "sans-serif"],
      },
      colors: {
        gold: "#c9a84c",
        "gold-light": "#e8c97a",
        navy: "#0a1628",
        "navy-mid": "#0f2040",
        "navy-light": "#162d55",
        muted: "#8a9bb5",
      },
    },
  },
  plugins: [],
};

export default config;
