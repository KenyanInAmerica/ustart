import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        syne: ["var(--font-syne)", "sans-serif"],
        "dm-sans": ["var(--font-dm-sans)", "sans-serif"],
      },
      screens: {
        "md-900": "900px",
      },
      animation: {
        "pulse-glow": "pulseGlow 5s ease-in-out infinite",
        "fade-up":   "fadeUp 0.8s ease both",
        "fade-up-1": "fadeUp 0.8s 0.1s ease both",
        "fade-up-2": "fadeUp 0.8s 0.2s ease both",
        "fade-up-3": "fadeUp 0.8s 0.3s ease both",
      },
    },
  },
  plugins: [],
};

export default config;
