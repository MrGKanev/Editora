import { defineConfig } from "vite";
import path from "node:path";

export default defineConfig({
  root: path.resolve(__dirname, "src/renderer"),
  css: {
    postcss: path.resolve(__dirname, "postcss.config.js"),
  },
  build: {
    outDir: path.resolve(__dirname, ".vite/renderer/main_window"),
    sourcemap: false,
    minify: "esbuild",
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ["react", "react-dom"],
          editor: [
            "@uiw/react-codemirror",
            "@codemirror/view",
            "@codemirror/state",
          ],
        },
      },
    },
  },
});
