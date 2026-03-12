import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    include: ['server/**/*.test.js', '**/*.test.js'],
    globals: false,
    coverage: {
      provider: 'v8',
      reporter: ['text', 'lcov', 'html'],
      include: ['server/**/*.js'],
      exclude: ['server/**/*.test.js', 'server/seed.js', 'server/fix-admin.js', 'node_modules/**'],
    },
  },
});
