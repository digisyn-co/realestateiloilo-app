import type { Config } from "tailwindcss";

/**
 * The Iloilo Real Estate — brand design tokens (per brand guide).
 * Deep forest green #031A14 + rich black #050706 + champagne gold #D6A84F +
 * ivory #F4F0E6. Ratio: green/black dominant, ivory, gold as accent, gold-hi
 * sparingly. Buyer app is light (ivory/green/gold); dashboards + marketing use
 * the forest-green/black dark theme (hex live in components/dash).
 */
const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        // light surfaces (buyer app)
        page: "#EFEADC",
        app: "#F4F0E6", // brand ivory
        surface: "#FFFFFF",
        "surface-warm": "#FBF6EA",
        sand: "#ECE4D1",
        // ink = deep forest green (text + primary buttons)
        ink: {
          DEFAULT: "#031A14",
          2: "#1E3A30",
          3: "#3F564B",
        },
        muted: {
          DEFAULT: "#5C6B62",
          2: "#87938A",
        },
        // accent = readable champagne gold (links, CTAs, badges)
        accent: {
          DEFAULT: "#9A7A2A",
          soft: "#F5EBD2",
        },
        // brand champagne gold + highlight (decorative / on dark)
        gold: {
          DEFAULT: "#D6A84F",
          hi: "#F3D38A",
          deep: "#9A7A2A",
        },
        success: {
          DEFAULT: "#2E6B4B",
          soft: "#E4EFE7",
        },
        line: {
          DEFAULT: "#E5DCC8",
          2: "#EFE9DA",
          3: "#DED3BC",
        },
        map: {
          bg: "#E7EDE7",
          road: "#DBE4DB",
          water: "#CFDFD8",
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
        card: "0 1px 3px rgba(3,26,20,.07)",
        "card-hover": "0 2px 6px rgba(3,26,20,.08), 0 18px 36px -18px rgba(3,26,20,.3)",
        elev: "0 1px 3px rgba(3,26,20,.07), 0 8px 24px -16px rgba(3,26,20,.2)",
        cta: "0 1px 3px rgba(3,26,20,.08), 0 10px 26px -18px rgba(3,26,20,.26)",
        pop: "0 8px 30px -8px rgba(3,26,20,.34)",
        float: "0 2px 8px rgba(3,26,20,.18)",
      },
      keyframes: {
        appIn: { from: { opacity: "0", transform: "translateY(10px)" }, to: { opacity: "1", transform: "none" } },
        riseA: { from: { opacity: "0", transform: "translateY(12px)" }, to: { opacity: "1", transform: "none" } },
        sheetUpA: { from: { transform: "translateY(100%)" }, to: { transform: "none" } },
        popA: { "0%": { transform: "scale(1)" }, "40%": { transform: "scale(1.45)" }, "70%": { transform: "scale(.9)" }, "100%": { transform: "scale(1)" } },
        shimA: { "0%": { opacity: ".5" }, "50%": { opacity: "1" }, "100%": { opacity: ".5" } },
        toastA: { from: { opacity: "0", transform: "translate(-50%,16px)" }, to: { opacity: "1", transform: "translate(-50%,0)" } },
        ringA: { "0%": { boxShadow: "0 0 0 0 rgba(214,168,79,.45)" }, "70%": { boxShadow: "0 0 0 12px rgba(214,168,79,0)" }, "100%": { boxShadow: "0 0 0 0 rgba(214,168,79,0)" } },
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
