import js from "@eslint/js";
import globals from "globals";
import { includeIgnoreFile } from "@eslint/compat";
import tseslint from "typescript-eslint";
import { fileURLToPath } from "node:url";
import pluginReact from "eslint-plugin-react";
import { defineConfig } from "eslint/config";
const gitignorePath = fileURLToPath(new URL("./.gitignore", import.meta.url));

export default defineConfig([
  {
    files: ["**/*.{js,mjs,cjs,ts,mts,cts,jsx,tsx}"],
    plugins: { js },
    extends: ["js/recommended"],
    languageOptions: {
      globals: { ...globals.browser, ...globals.node },
      parserOptions: { ecmaFeatures: { jsx: true } },
    },
    settings: {
      react: {
        version: "19.2",
      },
    },
  },
  tseslint.configs.recommended,
  pluginReact.configs.flat.recommended!,
  pluginReact.configs.flat["jsx-runtime"]!,
  includeIgnoreFile(gitignorePath),
]);
