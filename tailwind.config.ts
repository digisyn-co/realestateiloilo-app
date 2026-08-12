import type { Config } from "tailwindcss";

/**
 * The Iloilo Real Estate — brand design tokens.
 * Identity: deep navy + antique gold + teal on warm cream. "Connecting people.
 * Building futures." (from the brand kit). Buyer app is light (cream/navy/gold);
 * dashboards + marketing use the navy/gold dark theme (hex in components/dash).
 */
const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        // light surfaces (buyer app)
        page: "#EFE7D5",
        app: "#FAF6EC",
        surface: "#FFFFFF",
        "surface-warm": "#F7F0E0",
        sand: "#EFE6D2",
        // ink = brand navy
        ink: {
          DEFAULT: "#0B1E36",
          2: "#24384F",
          3: "#45586E",
        },
        muted: {
          DEFAULT: "#5C6B7C",
          2: "#8592A0",
        },
        // accent = antique gold (readable on cream + as button bg)
        accent: {
          DEFAULT: "#9A7B39",
          soft: "#F3EAD3",
        },
        // bright metallic gold for decorative marks/borders
        gold: {
          DEFAULT: "#C6A15C",
          deep: "#9A7B39",
        },
        // brand teal (secondary / verified)
        teal: {
          DEFAULT: "#123F3C",
          soft: "#E3EFEB",
        },
        success: {
          DEFAULT: "#2C6E63",
          soft: "#E3EFEB",
        },
        line: {
          DEFAULT: "#E4DAC5",
          2: "#F0E9DA",
          3: "#DFD4BE",
        },
        map: {
          bg: "#E7EEE9",
          road: "#DBE6DE",
          water: "#CFE0E2",
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
        card: "0 1px 3px rgba(11,30,54,.06)",
        "card-hover": "0 2px 6px rgba(11,30,54,.07), 0 18px 36px -18px rgba(11,30,54,.28)",
        elev: "0 1px 3px rgba(11,30,54,.06), 0 8px 24px -16px rgba(11,30,54,.18)",
        cta: "0 1px 3px rgba(11,30,54,.07), 0 10px 26px -18px rgba(11,30,54,.24)",
        pop: "0 8px 30px -8px rgba(11,30,54,.32)",
        float: "0 2px 8px rgba(11,30,54,.16)",
      },
      keyframes: {
        appIn: { from: { opacity: "0", transform: "translateY(10px)" }, to: { opacity: "1", transform: "none" } },
        riseA: { from: { opacity: "0", transform: "translateY(12px)" }, to: { opacity: "1", transform: "none" } },
        sheetUpA: { from: { transform: "translateY(100%)" }, to: { transform: "none" } },
        popA: { "0%": { transform: "scale(1)" }, "40%": { transform: "scale(1.45)" }, "70%": { transform: "scale(.9)" }, "100%": { transform: "scale(1)" } },
        shimA: { "0%": { opacity: ".5" }, "50%": { opacity: "1" }, "100%": { opacity: ".5" } },
        toastA: { from: { opacity: "0", transform: "translate(-50%,16px)" }, to: { opacity: "1", transform: "translate(-50%,0)" } },
        ringA: { "0%": { boxShadow: "0 0 0 0 rgba(154,123,57,.4)" }, "70%": { boxShadow: "0 0 0 12px rgba(154,123,57,0)" }, "100%": { boxShadow: "0 0 0 0 rgba(154,123,57,0)" } },
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
