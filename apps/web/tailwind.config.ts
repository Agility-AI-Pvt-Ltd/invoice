import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    // Also include UI package if needed
    "../../packages/ui/src/**/*.{js,ts,jsx,tsx,mdx}"
  ],
  theme: {
    extend: {
      colors: {
        primary: "#4f35d2",
        "primary-dark": "#3b27a8",
        "primary-light": "#7c64e8",
        soft: "#f0eeff",
      },
    },
  },
  plugins: [],
};

export default config;
