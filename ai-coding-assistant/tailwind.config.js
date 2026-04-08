/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        mono: ["JetBrains Mono", "Fira Code", "Cascadia Code", "monospace"],
      },
      keyframes: {
        shimmer: {
          "0%": { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" },
        },
        blink: {
          "0%, 100%": { opacity: "1" },
          "50%": { opacity: "0" },
        },
        fadeUp: {
          "0%": { opacity: "0", transform: "translateY(12px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        slideIn: {
          "0%": { opacity: "0", transform: "translateX(-8px)" },
          "100%": { opacity: "1", transform: "translateX(0)" },
        },
        typing: {
          "0%": { width: "0" },
          "100%": { width: "100%" },
        },
      },
      animation: {
        shimmer: "shimmer 1.8s cubic-bezier(0.4,0,0.6,1) infinite",
        blink: "blink 1s step-end infinite",
        "fade-up": "fadeUp 0.4s cubic-bezier(0.16,1,0.3,1) forwards",
        "slide-in": "slideIn 0.3s cubic-bezier(0.16,1,0.3,1) forwards",
      },
      colors: {
        dark: {
          100: "#1e2128",
          200: "#181b22",
          300: "#13151c",
          400: "#0e1017",
          500: "#090b10",
        },
      },
    },
  },
  plugins: [],
}
