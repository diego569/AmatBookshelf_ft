import type { Config } from "tailwindcss";

const config: Config = {
    content: [
        "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
        "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
        "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
    ],
    theme: {
        extend: {
            colors: {
                cream: "#F9F7F2",
                paper: "#FFFFFF",
                forest: "#1A3C34",
                beige: "#EBE5DA",
                sage: "#4A6C4C",
                ochre: "#D4A373",
                charcoal: "#1F2937",
                red: "#C2410C",
                background: "#F9F7F2",
                foreground: "#1F2937",
            },
            fontFamily: {
                sans: ["var(--font-inter)", "sans-serif"],
                serif: ["var(--font-playfair)", "serif"],
            },
            boxShadow: {
                soft: "0 4px 20px -2px rgba(26, 60, 52, 0.06)",
                float: "0 10px 30px -5px rgba(26, 60, 52, 0.18)",
            },
            animation: {
                "fade-in": "fadeIn 0.5s ease-out forwards",
                "scale-in": "scaleIn 0.35s ease-out forwards",
                "slide-up": "slideUp 0.35s ease-out forwards",
                "pulse-slow": "pulse 2.2s cubic-bezier(0.4, 0, 0.6, 1) infinite",
            },
            keyframes: {
                fadeIn: {
                    "0%": { opacity: "0", transform: "translateY(10px)" },
                    "100%": { opacity: "1", transform: "translateY(0)" },
                },
                scaleIn: {
                    "0%": { opacity: "0", transform: "scale(0.95)" },
                    "100%": { opacity: "1", transform: "scale(1)" },
                },
                slideUp: {
                    "0%": { transform: "translateY(12px)", opacity: "0" },
                    "100%": { transform: "translateY(0)", opacity: "1" },
                },
            },
        },
    },
    plugins: [],
};
export default config;
