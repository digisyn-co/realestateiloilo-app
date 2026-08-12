import type { Config } from "tailwindcss";

/**
 * Design tokens transcribed from the Claude Design prototype
 * (design-reference/DESIGN-SYSTEM.md). The prototype is the visual source of truth.
 */
const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        page: "#F3EDE4",
        app: "#FBF8F3",
        surface: "#FFFFFF",
        "surface-warm": "#FFF9F2",
        sand: "#F6F1E9",
        ink: {
          DEFAULT: "#1A1714",
          2: "#3D3630",
          3: "#5A524A",
        },
        muted: {
          DEFAULT: "#6B6259",
          2: "#7A7268",
        },
        accent: {
          DEFAULT: "#B4551A",
          soft: "#FDF3EA",
        },
        success: {
          DEFAULT: "#2F6B4F",
          soft: "#EDF5F0",
        },
        line: {
          DEFAULT: "#E4DCD1",
          2: "#F1EBE2",
          3: "#E0D8CC",
        },
        map: {
          bg: "#EDF0E9",
          road: "#E2E7DC",
          water: "#DCE6E8",
        },
      },
      fontFamily: {
        serif: ["var(--font-instrument-serif)", "Instrument Serif", "Georgia", "serif"],
        sans: ["var(--font-manrope)", "Manrope", "system-ui", "sans-serif"],
      },
      borderRadius: {
        card: "18px",
        xl2: "20px",
      },
      boxShadow: {
        card: "0 1px 3px rgba(26,23,20,.05)",
        "card-hover": "0 2px 6px rgba(26,23,20,.06), 0 18px 36px -18px rgba(26,23,20,.24)",
        elev: "0 1px 3px rgba(26,23,20,.05), 0 8px 24px -16px rgba(26,23,20,.16)",
        cta: "0 1px 3px rgba(26,23,20,.06), 0 10px 26px -18px rgba(26,23,20,.2)",
        pop: "0 8px 30px -8px rgba(26,23,20,.3)",
        float: "0 2px 8px rgba(26,23,20,.14)",
      },
      keyframes: {
        appIn: { from: { opacity: "0", transform: "translateY(10px)" }, to: { opacity: "1", transform: "none" } },
        riseA: { from: { opacity: "0", transform: "translateY(12px)" }, to: { opacity: "1", transform: "none" } },
        sheetUpA: { from: { transform: "translateY(100%)" }, to: { transform: "none" } },
        popA: { "0%": { transform: "scale(1)" }, "40%": { transform: "scale(1.45)" }, "70%": { transform: "scale(.9)" }, "100%": { transform: "scale(1)" } },
        shimA: { "0%": { opacity: ".5" }, "50%": { opacity: "1" }, "100%": { opacity: ".5" } },
        toastA: { from: { opacity: "0", transform: "translate(-50%,16px)" }, to: { opacity: "1", transform: "translate(-50%,0)" } },
        ringA: { "0%": { boxShadow: "0 0 0 0 rgba(180,85,26,.4)" }, "70%": { boxShadow: "0 0 0 12px rgba(180,85,26,0)" }, "100%": { boxShadow: "0 0 0 0 rgba(180,85,26,0)" } },
      },
      animation: {
        appIn: "appIn .5s ease",
        rise: "riseA .5s ease both",
        sheetUp: "sheetUpA .35s cubic-bezier(.16,.84,.28,1)",
        pop: "popA .4s ease",
        shim: "shimA 1.3s ease-in-out infinite",
        toast: "toastA .3s ease",
        ring: "ringA 2.4s infinite",
      },
    },
  },
  plugins: [],
};

export default config;
