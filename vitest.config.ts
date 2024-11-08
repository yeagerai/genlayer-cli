import {configDefaults, defineConfig} from "vitest/config";

export default defineConfig({
  test: {
    globals: true,
    environment: 'jsdom',
    coverage: {
      exclude: [...configDefaults.exclude, '*.js', 'src/index.ts', 'tests/**/*.ts', 'src/types'],
    }
  }
});