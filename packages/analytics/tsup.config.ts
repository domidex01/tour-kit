import { defineConfig } from 'tsup'

export default defineConfig({
  entry: {
    index: 'src/index.ts',
    'plugins/posthog': 'src/plugins/posthog.ts',
    'plugins/mixpanel': 'src/plugins/mixpanel.ts',
    'plugins/amplitude': 'src/plugins/amplitude.ts',
    'plugins/google-analytics': 'src/plugins/google-analytics.ts',
  },
  format: ['cjs', 'esm'],
  dts: true,
  clean: true,
  external: [
    '@amplitude/analytics-browser',
    '@tour-kit/core',
    '@tour-kit/license',
    'mixpanel-browser',
    'posthog-js',
    'react',
    'react-dom',
  ],
  treeshake: true,
  splitting: false,
  minify: true,
  sourcemap: true,
  target: 'es2020',
  outDir: 'dist',
  esbuildOptions(options) {
    options.banner = {
      js: '"use client";',
    }
  },
})
