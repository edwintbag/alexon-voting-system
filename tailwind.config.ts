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
        // Alexon Brand Palette
        gold: {
          50: "#fffbeb",
          100: "#fef3c7",
          200: "#fde68a",
          300: "#fcd34d",
          400: "#fbbf24",
          500: "#C9972C", // Primary gold
          600: "#a37820",
          700: "#7c5b18",
          800: "#5a4112",
          900: "#3d2d0d",
        },
        dark: {
          50: "#f6f6f7",
          100: "#e2e2e5",
          200: "#c4c4ca",
          300: "#9d9dab",
          400: "#76768a",
          500: "#5a5a70",
          600: "#46465a",
          700: "#2d2d3d",
          800: "#1a1a28",
          900: "#0d0d1a", // Primary dark
          950: "#07070f",
        },
        surface: {
          DEFAULT: "#12121e",
          light: "#1c1c2e",
          card: "#1e1e30",
          border: "#2a2a40",
        },
      },
      fontFamily: {
        display: ["'Playfair Display'", "Georgia", "serif"],
        sans: ["'DM Sans'", "sans-serif"],
        mono: ["'JetBrains Mono'", "monospace"],
      },
      backgroundImage: {
        "gold-gradient":
          "linear-gradient(135deg, #C9972C 0%, #f0c040 50%, #C9972C 100%)",
        "dark-gradient":
          "linear-gradient(135deg, #0d0d1a 0%, #1a1a28 50%, #0d0d1a 100%)",
        "surface-gradient":
          "linear-gradient(180deg, #12121e 0%, #0d0d1a 100%)",
        "card-gradient":
          "linear-gradient(135deg, #1e1e30 0%, #16162a 100%)",
        "shimmer":
          "linear-gradient(90deg, transparent 0%, rgba(201,151,44,0.1) 50%, transparent 100%)",
      },
      boxShadow: {
        gold: "0 0 20px rgba(201,151,44,0.3)",
        "gold-lg": "0 0 40px rgba(201,151,44,0.4)",
        card: "0 4px 24px rgba(0,0,0,0.4)",
        "card-hover": "0 8px 40px rgba(0,0,0,0.6), 0 0 20px rgba(201,151,44,0.15)",
      },
      animation: {
        shimmer: "shimmer 2s linear infinite",
        "fade-in": "fadeIn 0.5s ease-out",
        "slide-up": "slideUp 0.4s ease-out",
        pulse: "pulse 2s ease-in-out infinite",
      },
      keyframes: {
        shimmer: {
          "0%": { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" },
        },
        fadeIn: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        slideUp: {
          "0%": { transform: "translateY(20px)", opacity: "0" },
          "100%": { transform: "translateY(0)", opacity: "1" },
        },
      },
    },
  },
  plugins: [],
};

export default config;
