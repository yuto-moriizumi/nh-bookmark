import pluginJs from "@eslint/js";
import tsEslint from "typescript-eslint";
import reactPlugin from "eslint-plugin-react";
import reactHooks from "eslint-plugin-react-hooks";
import jsxA11y from "eslint-plugin-jsx-a11y";
import globals from "globals";

export default tsEslint.config(
  pluginJs.configs.recommended,
  ...tsEslint.configs.recommended,
  reactPlugin.configs.flat.recommended,
  reactPlugin.configs.flat["jsx-runtime"],
  {
    plugins: { "react-hooks": reactHooks },
    rules: reactHooks.configs.recommended.rules,
  },
  jsxA11y.flatConfigs.recommended,
  {
    ignores: ["front/build"],
  },
  {
    files: ["**/*.config.js", ".prettierrc.js", "api/**/*"],
    languageOptions: {
      globals: globals.node,
    },
  },
  { settings: { react: { version: "detect" } } },
);
