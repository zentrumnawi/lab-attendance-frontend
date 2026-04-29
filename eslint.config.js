import { defineConfig, globalIgnores } from "eslint/config";
import js from "@eslint/js";
import vue from "eslint-plugin-vue";
import globals from "globals";
import vueParser from "vue-eslint-parser";
import tsParser from "@typescript-eslint/parser";
import eslintPluginPrettierRecommended from "eslint-plugin-prettier/recommended";

export default defineConfig([
  globalIgnores(["**/dist/**", "**/coverage/**"]),

  js.configs.recommended,

  ...vue.configs["flat/strongly-recommended"],

  {
    files: ["**/*.vue"],
    languageOptions: {
      parser: vueParser,
      parserOptions: {
        parser: tsParser,
      },
    },
    rules: {
      "vue/multi-word-component-names": "off",
    },
  },

  {
    files: ["src/**/*.{ts,js,vue}"],
    languageOptions: {
      globals: globals.browser,
    },
  },

  {
    files: ["*.config.{js,ts}", "eslint.config.js"],
    languageOptions: {
      globals: globals.node,
    },
  },

  {
    rules: {
      "no-console": "off",
    },
  },
  eslintPluginPrettierRecommended,
]);
