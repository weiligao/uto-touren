import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";
import { defineConfig, globalIgnores } from "eslint/config";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  {
    // Workaround for eslint-plugin-react calling the removed context.getFilename() API in ESLint v10.
    // Without this, React version auto-detection crashes. Remove once eslint-config-next ships a fix.
    // See: https://github.com/vercel/next.js/issues/89764#issuecomment-3928272828
    settings: {
      react: { version: "19" },
    },
  },
  {
    rules: {
      // Code quality
      "no-console": "warn",
      "no-var": "error",
      "prefer-const": "error",
      eqeqeq: "error",
      "no-duplicate-imports": "off",
      curly: "error",
      "no-else-return": "error",
      "no-throw-literal": "error",
      "no-unneeded-ternary": "error",
      "prefer-template": "error",
      "object-shorthand": "error",
      "no-nested-ternary": "error",
      "no-useless-return": "error",
      "no-lonely-if": "error",
      "no-param-reassign": "error",

      // TypeScript (syntactic — no type info required)
      "@typescript-eslint/no-unused-vars": [
        "error",
        { argsIgnorePattern: "^_", varsIgnorePattern: "^_" },
      ],
      "@typescript-eslint/no-explicit-any": "error",
      "@typescript-eslint/consistent-type-imports": "error",
      "@typescript-eslint/no-non-null-assertion": "warn",

      // React
      "react/jsx-no-useless-fragment": "error",
      "react/self-closing-comp": "error",
    },
  },
  {
    // Type-aware rules — scoped to TS/TSX only
    files: ["**/*.ts", "**/*.tsx"],
    languageOptions: {
      parserOptions: {
        project: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
    rules: {
      "@typescript-eslint/prefer-optional-chain": "error",
      "@typescript-eslint/prefer-nullish-coalescing": "error",
    },
  },
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
  ]),
]);

export default eslintConfig;
