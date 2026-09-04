import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        malta: {
          950: "#0a1315",
          900: "#0f1c1e",
          800: "#15262a",
          700: "#1c3236",
          600: "#294247",
          500: "#3c5b60",
          400: "#587a7f",
        },
        sand: {
          300: "#f0e1c2",
          400: "#e2c89c",
          500: "#d9b98a",
          600: "#c7a273",
          700: "#a9865b",
        },
        terracotta: {
          300: "#e59a71",
          400: "#d97a4c",
          500: "#c1683c",
          600: "#a8562e",
          900: "#3a1f12",
        },
        turquoise: {
          300: "#a3ddd3",
          400: "#6fc4b9",
          500: "#4fb0a5",
          600: "#3d8f86",
          900: "#132b28",
        },
      },
      fontFamily: {
        display: ["var(--font-display)", "serif"],
        sans: ["var(--font-sans)", "system-ui", "sans-serif"],
      },
      boxShadow: {
        glow: "0 0 60px -12px rgba(79, 176, 165, 0.35)",
        "glow-terracotta": "0 0 60px -12px rgba(193, 104, 60, 0.4)",
      },
      backgroundImage: {
        "grid-fade":
          "linear-gradient(to bottom, transparent, rgba(10,19,21,1)), repeating-linear-gradient(0deg, rgba(255,255,255,0.035) 0px, rgba(255,255,255,0.035) 1px, transparent 1px, transparent 32px), repeating-linear-gradient(90deg, rgba(255,255,255,0.035) 0px, rgba(255,255,255,0.035) 1px, transparent 1px, transparent 32px)",
      },
      keyframes: {
        "fade-in-up": {
          "0%": { opacity: "0", transform: "translateY(14px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        float: {
          "0%, 100%": { transform: "translateY(0px)" },
          "50%": { transform: "translateY(-18px)" },
        },
        "float-sm": {
          "0%, 100%": { transform: "translateY(0px)" },
          "50%": { transform: "translateY(-5px)" },
        },
        "pulse-ring": {
          "0%": { boxShadow: "0 0 0 0 rgba(111, 196, 185, 0.55)" },
          "100%": { boxShadow: "0 0 0 16px rgba(111, 196, 185, 0)" },
        },
        sway: {
          "0%, 100%": { transform: "rotate(-3deg)" },
          "50%": { transform: "rotate(3deg)" },
        },
        flicker: {
          "0%, 100%": { transform: "scale(1)", opacity: "1" },
          "50%": { transform: "scale(1.1) translateY(-2px)", opacity: "0.85" },
        },
        "smoke-rise": {
          "0%": { transform: "translateY(0) scale(0.6)", opacity: "0.55" },
          "100%": { transform: "translateY(-26px) scale(1.3)", opacity: "0" },
        },
        "build-in": {
          "0%": { transform: "scale(0.3) rotate(-12deg)", opacity: "0" },
          "60%": { transform: "scale(1.15) rotate(4deg)", opacity: "1" },
          "100%": { transform: "scale(1) rotate(0deg)", opacity: "1" },
        },
        "pop-up": {
          "0%": { transform: "translateY(0)", opacity: "0" },
          "15%": { opacity: "1" },
          "100%": { transform: "translateY(-24px)", opacity: "0" },
        },
        breathe: {
          "0%, 100%": { transform: "scale(1)" },
          "50%": { transform: "scale(1.045)" },
        },
        ember: {
          "0%": { transform: "translateY(0) translateX(0) scale(0.7)", opacity: "0.9" },
          "100%": { transform: "translateY(-30px) translateX(6px) scale(0.2)", opacity: "0" },
        },
        "glow-pulse": {
          "0%, 100%": { opacity: "0.55", transform: "scale(1)" },
          "50%": { opacity: "0.9", transform: "scale(1.12)" },
        },
        shimmer: {
          "0%": { backgroundPosition: "0 0" },
          "100%": { backgroundPosition: "160px 0" },
        },
        "rain-fall": {
          "0%": { transform: "translateY(-16px)", opacity: "0" },
          "12%": { opacity: "0.7" },
          "100%": { transform: "translateY(150px)", opacity: "0" },
        },
        "walk-bob": {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-4px)" },
        },
      },
      animation: {
        "fade-in-up": "fade-in-up 0.6s ease-out both",
        float: "float 8s ease-in-out infinite",
        "float-slow": "float 12s ease-in-out infinite",
        "float-sm": "float-sm 4s ease-in-out infinite",
        "pulse-ring": "pulse-ring 1s cubic-bezier(0.4, 0, 0.6, 1) infinite",
        sway: "sway 5s ease-in-out infinite",
        flicker: "flicker 1.4s ease-in-out infinite",
        "smoke-rise": "smoke-rise 2.2s ease-out infinite",
        "build-in": "build-in 0.6s cubic-bezier(0.34, 1.56, 0.64, 1) both",
        "pop-up": "pop-up 900ms ease-out forwards",
        shimmer: "shimmer 6s linear infinite",
        breathe: "breathe 6s ease-in-out infinite",
        ember: "ember 1.8s ease-out infinite",
        "glow-pulse": "glow-pulse 3s ease-in-out infinite",
        "rain-fall": "rain-fall 900ms linear infinite",
        "walk-bob": "walk-bob 0.35s ease-in-out infinite",
      },
    },
  },
  plugins: [],
};

export default config;
