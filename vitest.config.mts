import { defineConfig } from 'vitest/config'

export default defineConfig({
  // Resolves the "@/…" imports from tsconfig.json.
  resolve: { tsconfigPaths: true },
  test: {
    environment: 'node',
    include: ['tests/unit/**/*.test.ts'],
    alias: {
      // `server-only` throws outside React Server Components; unit tests run
      // server modules directly, so replace it with an empty module.
      'server-only': new URL('./tests/stubs/server-only.ts', import.meta.url).pathname,
    },
  },
})
