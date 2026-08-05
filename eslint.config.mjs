import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

export default defineConfig([
  ...nextVitals,
  ...nextTs,
  {
    files: [
      "src/components/dashboard/analyze-panel.tsx",
      "src/components/dashboard/dashboard-project-grid.tsx",
      "src/components/dashboard/dashboard-view.tsx",
    ],
    rules: {
      // ponytail: preserve existing state-sync behavior; remove after these effects gain behavior tests.
      "react-hooks/set-state-in-effect": "off",
    },
  },
  globalIgnores([
    "node_modules/**",
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
  ]),
]);
