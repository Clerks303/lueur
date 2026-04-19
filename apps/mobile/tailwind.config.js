/**
 * Tailwind (NativeWind) theme — Lueur design system.
 * Colors mirror docs/03-DESIGN-SYSTEM.md §Color palette.
 */
/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./app/**/*.{ts,tsx}", "./src/**/*.{ts,tsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        bg: {
          app: "#FAF6EE",
          surface: "#FFFFFF",
          muted: "#EEE8DA",
        },
        text: {
          primary: "#1F1A17",
          secondary: "#8B847A",
          tertiary: "#B8AFA0",
        },
        accent: {
          primary: "#A8533A",
          secondary: "#6B7A4A",
        },
        divider: "#E5DFD3",
      },
      fontFamily: {
        // Used with the `font-serif` / `font-sans` Tailwind utilities.
        // System serif on both platforms for editorial moments; RN's
        // default system font for UI chrome. Custom fonts (Inter, a
        // refined serif) are a post-MVP tune.
        serif: ["Georgia", "Times New Roman", "serif"],
        sans: ["System"],
      },
    },
  },
  plugins: [],
};
