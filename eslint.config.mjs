import tsPlugin from "@typescript-eslint/eslint-plugin";
import nextPlugin from "@next/eslint-plugin-next";
import reactHooksPlugin from "eslint-plugin-react-hooks";

const tsFlat = tsPlugin.configs["flat/recommended"];

export default [
  {
    ignores: [
      "**/.next/**",
      "**/out/**",
      "**/build/**",
      "**/next-env.d.ts",
      "**/supabase/**",
      "**/scripts/**",
      "**/node_modules/**",
      "**/dist/**",
      "**/docs/**",
      "**/public/widget/**",
      "**/flowcore-premium-video/**",
      "**/flowcore-promo/**",
    ],
  },
  ...tsFlat,
  {
    files: ["**/*.ts", "**/*.tsx", "**/*.mts"],
    plugins: {
      "@next/next": nextPlugin,
      "react-hooks": reactHooksPlugin,
    },
    rules: {
      ...nextPlugin.configs.recommended.rules,
      ...nextPlugin.configs["core-web-vitals"].rules,
      "react-hooks/exhaustive-deps": "warn",
      "@typescript-eslint/no-explicit-any": "warn",
      "prefer-const": "warn",
    },
  },
];
