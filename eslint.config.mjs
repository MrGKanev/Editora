import js from "@eslint/js";
import tseslint from "typescript-eslint";
import reactHooks from "eslint-plugin-react-hooks";
import globals from "globals";

export default tseslint.config(
  {
    ignores: [
      "node_modules/**",
      "dist/**",
      ".vite/**",
      "out/**",
      "coverage/**",
    ],
  },

  js.configs.recommended,
  tseslint.configs.recommended,

  {
    files: ["src/**/*.{ts,tsx}"],
    languageOptions: {
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
    rules: {
      // Unused values are errors; `_`-prefixed args/caught errors are intentional.
      "@typescript-eslint/no-unused-vars": [
        "error",
        {
          argsIgnorePattern: "^_",
          varsIgnorePattern: "^_",
          caughtErrors: "none",
        },
      ],
      "no-empty": ["error", { allowEmptyCatch: true }],
    },
  },

  // Main process and build configs run under Node.
  {
    files: ["src/main/**/*.ts", "src/preload/**/*.ts", "*.ts", "*.mts"],
    languageOptions: {
      globals: globals.node,
    },
  },

  // PostCSS config is CommonJS and outside the TS project.
  {
    files: ["*.js"],
    languageOptions: {
      sourceType: "commonjs",
      globals: globals.node,
    },
  },

  // Renderer: browser globals plus the React Hooks rules.
  {
    files: ["src/renderer/**/*.{ts,tsx}"],
    ...reactHooks.configs.flat.recommended,
    languageOptions: {
      globals: globals.browser,
    },
    rules: {
      ...reactHooks.configs.flat.recommended.rules,
      // Flags the ordinary "load data in an effect, then setState" pattern used
      // throughout the panels. Worth seeing, not worth failing a build over.
      "react-hooks/set-state-in-effect": "warn",
    },
  },

  // ANSI escape sequences are control characters by definition.
  {
    files: ["src/renderer/utils/terminal.ts"],
    rules: {
      "no-control-regex": "off",
    },
  },

  // Tests get both, and may use loose assertions.
  {
    files: ["src/**/__tests__/**/*.{ts,tsx}", "src/**/*.test.{ts,tsx}"],
    languageOptions: {
      globals: { ...globals.node, ...globals.browser },
    },
    rules: {
      "@typescript-eslint/no-explicit-any": "off",
    },
  },
);
