import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  {
    // Data collectors are Node.js CommonJS scripts. The application itself
    // remains covered by the stricter Next.js/TypeScript rules above.
    files: ["scripts/**/*.js"],
    rules: {
      "@typescript-eslint/no-require-imports": "off",
      "@typescript-eslint/no-unused-vars": "off",
    },
  },
  {
    // The App Router root layout loads these fonts for every page. The rule's
    // pages/_document guidance does not apply to this layout.
    files: ["src/app/layout.tsx"],
    rules: {
      "@next/next/no-page-custom-font": "off",
    },
  },
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    // One-off reverse-engineering and scratch scripts are not production code.
    "scratch/**",
    "test-*.js",
    "daum-main-script-5.js",
    "extract-daum-json.js",
    "parse-daum-main.js",
  ]),
]);

export default eslintConfig;
