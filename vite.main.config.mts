import { defineConfig } from "vite";

export default defineConfig({
  resolve: {
    conditions: ["node"],
    mainFields: ["module", "jsnext:main", "jsnext"],
  },
  build: {
    minify: true,
    sourcemap: false,
    rollupOptions: {
      external: ["sharp"],
    },
  },
});
