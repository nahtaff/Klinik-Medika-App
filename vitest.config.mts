import { configDefaults, defineConfig } from "vitest/config";

export default defineConfig({
  // resolve the "@/..." imports from tsconfig.json, same as Next does
  resolve: { tsconfigPaths: true },
  test: {
    // .claude/skills ships its own tests that aren't part of the app
    exclude: [...configDefaults.exclude, ".claude/**"],
  },
});
