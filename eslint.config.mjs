import { defineConfig, globalIgnores } from "eslint/config";
import globals from "globals";
import js from "@eslint/js";
import tseslint from "typescript-eslint";


export default defineConfig([
  // This was the pattern for the following three lines
  // { files: ["**/*.{js,mjs,cjs,ts}"] },
  { files: ["**/*.{mjs,cjs,ts}"] },
  { files: ["**/*.{mjs,cjs,ts}"], languageOptions: { globals: globals.node } },
  { files: ["**/*.{mjs,cjs,ts}"], plugins: { js }, extends: ["js/recommended"] },
  tseslint.configs.recommended,
  globalIgnores(["*.ps1", "*.js", "node_modules/**", "dist/**", "build/**"]),
]);