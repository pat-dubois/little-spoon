import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    include: ['src/**/*.test.ts', 'src/**/*.test.tsx'],
    environment: 'node',
    coverage: {
      provider: 'v8',
      clean: false,
      include: ['src/clinical/**/*.ts'],
      exclude: ['src/clinical/**/*.test.ts', 'src/clinical/data/**'],
      reporter: ['text', 'json-summary', 'html'],
    },
  },
});
