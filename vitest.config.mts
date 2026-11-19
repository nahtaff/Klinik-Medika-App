import { configDefaults, defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    // .claude/skills ships its own tests that aren't part of the app
    exclude: [...configDefaults.exclude, ".claude/**"],
  },
});
