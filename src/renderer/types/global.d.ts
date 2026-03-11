import type { EditoraAPI } from "../../preload/index";

declare global {
  interface Window {
    editora: EditoraAPI;
  }
}
