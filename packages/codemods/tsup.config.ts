import { defineConfig } from 'tsup'

export default defineConfig({
  entry: {
    index: 'src/index.ts',
    'bin/tour-kit-migrate': 'src/bin/tour-kit-migrate.ts',
  },
  format: ['esm', 'cjs'],
  dts: true,
  sourcemap: true,
  clean: true,
  shims: true,
  external: ['jscodeshift'],
  treeshake: true,
  minify: false,
  target: 'es2020',
})
