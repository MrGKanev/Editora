import type { Config } from "tailwindcss";
import typography from "@tailwindcss/typography";

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
      typography: {
        invert: {
          css: {
            "--tw-prose-body": "#cdd6f4",
            "--tw-prose-headings": "#cdd6f4",
            "--tw-prose-links": "#89b4fa",
            "--tw-prose-bold": "#cdd6f4",
            "--tw-prose-code": "#f5c2e7",
            "--tw-prose-pre-bg": "#1e1e2e",
            "--tw-prose-pre-code": "#cdd6f4",
            "--tw-prose-quotes": "#a6adc8",
            "--tw-prose-counters": "#6c7086",
            "--tw-prose-bullets": "#6c7086",
            "--tw-prose-hr": "#313146",
            "--tw-prose-th-borders": "#313146",
            "--tw-prose-td-borders": "#313146",
          },
        },
      },
    },
  },
  plugins: [typography],
};

export default config;
