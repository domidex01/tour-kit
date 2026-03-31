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
  external: ['react', 'react-dom', '@tour-kit/core', 'posthog-js', 'mixpanel-browser', '@tour-kit/license'],
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
