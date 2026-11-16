import js from "@eslint/js";
import { defineConfig } from "eslint/config";
import astro from "eslint-plugin-astro";
import jsxA11y from "eslint-plugin-jsx-a11y-x";
import reactHooks from "eslint-plugin-react-hooks";
import globals from "globals";
import tseslint from "typescript-eslint";

const noComments = {
  meta: {
    type: "problem",
    schema: [],
    messages: {
      comment:
        "Comments are not allowed. Make the code self-explanatory and put the reasoning in the pull request.",
    },
  },
  create(context) {
    return {
      Program() {
        for (const comment of context.sourceCode.getAllComments()) {
          context.report({ loc: comment.loc, messageId: "comment" });
        }
      },
    };
  },
};

export default defineConfig(
  { ignores: ["dist", ".astro", ".cache", "node_modules", "content/drafts"] },
  js.configs.recommended,
  tseslint.configs.recommended,
  astro.configs["flat/recommended"],
  { ...reactHooks.configs.flat.recommended, files: ["**/*.tsx", "**/use*.ts"] },
  { ...jsxA11y.configs.recommended, files: ["**/*.tsx"] },
  {
    files: ["src/**/*.{ts,tsx,astro}", "scripts/**/*.ts"],
    plugins: { local: { rules: { "no-comments": noComments } } },
    rules: {
      "local/no-comments": "error",
      "no-restricted-syntax": [
        "error",
        {
          selector: "BreakStatement",
          message: "Never use break. Restructure the loop with if/else or an early return.",
        },
        {
          selector: "ContinueStatement",
          message: "Never use continue. Restructure the loop with if/else.",
        },
      ],
      eqeqeq: ["error", "always"],
      "no-console": "error",
      "@typescript-eslint/consistent-type-imports": "error",
      "@typescript-eslint/no-non-null-assertion": "error",
    },
  },
  { files: ["src/**/*.{ts,tsx}"], languageOptions: { globals: globals.browser } },
  {
    files: ["scripts/**/*.ts", "*.config.{js,mjs}"],
    languageOptions: { globals: globals.node },
  },
  { files: ["scripts/**/*.ts"], rules: { "no-console": "off" } },
  {
    files: ["src/games/mystery-place/SuggestionList.tsx"],
    rules: { "jsx-a11y-x/click-events-have-key-events": "off" },
  },
  {
    files: ["src/ui/Modal.tsx"],
    rules: {
      "jsx-a11y-x/click-events-have-key-events": "off",
      "jsx-a11y-x/no-noninteractive-element-interactions": "off",
    },
  },
  {
    files: ["**/*.test.ts", "**/*.test.tsx", "**/fixtures.ts", "src/core/testing.ts"],
    rules: { "@typescript-eslint/no-non-null-assertion": "off" },
  },
);
