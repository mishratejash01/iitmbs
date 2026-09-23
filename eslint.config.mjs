import { defineConfig, globalIgnores } from 'eslint/config'
import nextVitals from 'eslint-config-next/core-web-vitals'
import nextTs from 'eslint-config-next/typescript'

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  {
    rules: {
      // Secrets must only be read through the validated modules in src/env*.ts.
      'no-restricted-properties': [
        'error',
        {
          object: 'process',
          property: 'env',
          message: 'Read configuration through src/env.ts or src/env.client.ts.',
        },
      ],
      '@typescript-eslint/no-unused-vars': [
        'error',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
      ],
    },
  },
  {
    // The env modules, framework config files and scripts are the only places
    // allowed to touch process.env directly.
    files: [
      'src/env.ts',
      'src/env.client.ts',
      'next.config.ts',
      '*.config.{ts,mjs,js}',
      'scripts/**',
      'tests/**',
    ],
    rules: { 'no-restricted-properties': 'off' },
  },
  globalIgnores([
    '.next/**',
    'out/**',
    'build/**',
    'coverage/**',
    'playwright-report/**',
    'test-results/**',
    '.lighthouseci/**',
    'next-env.d.ts',
    'src/lib/supabase/database.types.ts',
    'public/sw.js',
  ]),
])

export default eslintConfig
