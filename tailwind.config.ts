import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/renderer/**/*.{html,tsx,ts}"],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        editor: {
          bg: "#1e1e2e",
          surface: "#242435",
          border: "#313146",
          text: "#cdd6f4",
          muted: "#6c7086",
          accent: "#89b4fa",
          success: "#a6e3a1",
          warning: "#f9e2af",
          danger: "#f38ba8",
        },
      },
    },
  },
  plugins: [],
};

export default config;
