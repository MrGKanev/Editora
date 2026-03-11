import { defineConfig } from "vite";
import path from "node:path";

export default defineConfig({
  root: path.resolve(__dirname, "src/renderer"),
  css: {
    postcss: path.resolve(__dirname, "postcss.config.js"),
  },
});
