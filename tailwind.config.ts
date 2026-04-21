import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        bg: "var(--bg)",
        "bg-card": "var(--bg-card)",
        "bg-card-hover": "var(--bg-card-hover)",
        "bg-subtle": "var(--bg-subtle)",
        border: "var(--border)",
        "border-md": "var(--border-md)",
        "border-hi": "var(--border-hi)",
        text: "var(--text)",
        "text-mid": "var(--text-mid)",
        "text-muted": "var(--text-muted)",
        accent: "var(--accent)",
        "accent-hover": "var(--accent-hover)",
        destructive: "var(--destructive)",
        "destructive-hover": "var(--destructive-hover)",
        navy: "#1C2B3A",
        "sky-blue": "#3083DC",
        "warm-red": "#E54B4B",
        creme: "#F2F1EF",
      },
      fontFamily: {
        primary: ["var(--font-primary)", "sans-serif"],
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
