import { defineConfig } from "vite";
import path from "node:path";

const root = import.meta.dirname;

export default defineConfig({
  root: path.resolve(root, "src/renderer"),
  css: {
    postcss: path.resolve(root, "postcss.config.js"),
  },
  build: {
    outDir: path.resolve(root, ".vite/renderer/main_window"),
    sourcemap: false,
    // Vite 8 minifies with oxc; esbuild is no longer bundled with Vite.
    minify: true,
    // No manualChunks on purpose. App.tsx lazy-loads EditorArea, so letting the
    // bundler follow the dynamic imports keeps CodeMirror (~650 kB) out of the
    // startup path entirely. Pinning it to a named shared chunk instead made
    // the entry HTML modulepreload it on launch, for the project picker too.
  },
});
