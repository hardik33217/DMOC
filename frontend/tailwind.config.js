/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        brand: {
          50: "#f0f4ff",
          100: "#e0e9ff",
          200: "#c7d6fe",
          300: "#a5b8fc",
          400: "#8190f9",
          500: "#6366f1",
          600: "#4f46e5",
          700: "#4338ca",
          800: "#3730a3",
          900: "#312e81",
          950: "#1e1b4b",
        },
        surface: {
          light: "#ffffff",
          "light-hover": "#f8fafc",
          "light-border": "#e2e8f0",
          dark: "#0f172a",
          "dark-hover": "#1e293b",
          "dark-border": "#334155",
        },
        text: {
          light: "#0f172a",
          "light-muted": "#64748b",
          dark: "#f8fafc",
          "dark-muted": "#94a3b8",
        },
      },
      fontFamily: {
        sans: ["'Plus Jakarta Sans'", "Inter", "system-ui", "sans-serif"],
        heading: ["'Outfit'", "'Plus Jakarta Sans'", "sans-serif"],
        mono: ["'JetBrains Mono'", "monospace"],
      },
      boxShadow: {
        "xs": "0 1px 2px 0 rgba(0, 0, 0, 0.05)",
        "soft": "0 2px 15px -3px rgba(0, 0, 0, 0.07), 0 10px 20px -2px rgba(0, 0, 0, 0.04)",
        "soft-lg": "0 10px 40px -10px rgba(0, 0, 0, 0.1), 0 2px 10px -2px rgba(0, 0, 0, 0.05)",
        "inner-soft": "inset 0 2px 4px 0 rgba(0, 0, 0, 0.05)",
        "glass": "0 8px 32px 0 rgba(0, 0, 0, 0.25), inset 0 0 0 1px rgba(255, 255, 255, 0.08)",
        "glass-light": "0 8px 32px 0 rgba(31, 38, 135, 0.07), inset 0 0 0 1px rgba(255, 255, 255, 0.8)",
        "neon-indigo": "0 0 25px -4px rgba(99, 102, 241, 0.4), 0 8px 16px -6px rgba(99, 102, 241, 0.2)",
        "neon-cyan": "0 0 25px -4px rgba(6, 182, 212, 0.4), 0 8px 16px -6px rgba(6, 182, 212, 0.2)",
      },
      animation: {
        "fade-in": "fadeIn 0.3s ease-out",
        "slide-up": "slideUp 0.4s ease-out",
        "slide-down": "slideDown 0.3s ease-out",
        "scale-in": "scaleIn 0.2s ease-out",
        "pulse-soft": "pulseSoft 2s ease-in-out infinite",
      },
      keyframes: {
        fadeIn: { "0%": { opacity: "0" }, "100%": { opacity: "1" } },
        slideUp: { "0%": { opacity: "0", transform: "translateY(10px)" }, "100%": { opacity: "1", transform: "translateY(0)" } },
        slideDown: { "0%": { opacity: "0", transform: "translateY(-10px)" }, "100%": { opacity: "1", transform: "translateY(0)" } },
        scaleIn: { "0%": { opacity: "0", transform: "scale(0.95)" }, "100%": { opacity: "1", transform: "scale(1)" } },
        pulseSoft: { "0%, 100%": { opacity: "1" }, "50%": { opacity: "0.7" } },
      },
    },
  },
  plugins: [],
};