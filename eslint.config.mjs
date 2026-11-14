import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";
import jsxA11y from "eslint-plugin-jsx-a11y";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  {
    files: ["src/**/*.{ts,tsx}"],
    rules: {
      ...jsxA11y.configs.recommended.rules,
      "jsx-a11y/no-autofocus": "off",
    },
  },
  {
    // db cru só dentro de src/db/ (tenantDb obrigatório no resto)
    files: ["src/**/*.{ts,tsx}"],
    ignores: ["src/db/**"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          paths: [
            { name: "@/db/client", message: "Use tenantDb(workshopId) de @/db/tenant ou publicDb de @/db/public." },
          ],
        },
      ],
    },
  },
  globalIgnores([".next/**", "out/**", "build/**", "next-env.d.ts", ".data/**", "public/sw.js", "drizzle/**"]),
]);

export default eslintConfig;
