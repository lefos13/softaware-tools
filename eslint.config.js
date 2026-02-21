/*
 * We enforce a shared baseline lint setup so Vue SFCs and JavaScript files follow
 * the same quality rules, and we disable stylistic conflicts in favor of Prettier.
 */
import js from "@eslint/js";
import globals from "globals";
import pluginVue from "eslint-plugin-vue";
import eslintConfigPrettier from "eslint-config-prettier";

export default [
  {
    ignores: ["dist/**", "node_modules/**", "coverage/**"],
  },
  {
    files: ["**/*.{js,mjs,cjs,vue}"],
    languageOptions: {
      ecmaVersion: "latest",
      sourceType: "module",
      globals: {
        ...globals.browser,
        ...globals.node,
      },
    },
  },
  js.configs.recommended,
  ...pluginVue.configs["flat/recommended"],
  {
    rules: {
      "vue/multi-word-component-names": "off",
    },
  },
  eslintConfigPrettier,
];
