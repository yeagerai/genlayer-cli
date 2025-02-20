import {configDefaults, defineConfig} from "vitest/config";

export default defineConfig({
  test: {
    globals: true,
    environment: 'jsdom',
    testTimeout: 10000,
    coverage: {
      exclude: [...configDefaults.exclude, '*.js', 'tests/**/*.ts', 'src/types', 'scripts'],
    }
  }
});