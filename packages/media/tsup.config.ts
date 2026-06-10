import * as fs from 'node:fs'
import { defineConfig } from 'tsup'
import { injectUseClient } from '../../tooling/build/use-client'

// Single config on purpose: two config objects sharing one outDir race each
// other — the main entry's slower DTS step deletes dist/tailwind/index.d.ts
// after the tailwind config emits it. Building every entry here and excluding
// tailwind/index from the use-client injection keeps both correct.
export default defineConfig({
  entry: {
    index: 'src/index.ts',
    headless: 'src/headless.ts',
    'tailwind/index': 'src/tailwind/index.ts',
  },
  format: ['cjs', 'esm'],
  dts: true,
  clean: true,
  external: [
    'react',
    'react-dom',
    '@lottiefiles/react-lottie-player',
    '@tour-kit/license',
    'tailwindcss',
    'tailwindcss/plugin',
  ],
  treeshake: true,
  splitting: true,
  // NOTE: do not use the umbrella `minify: true`. esbuild's whitespace
  // minification strips the `/* webpackIgnore */` + `/* @vite-ignore */`
  // magic comments off the optional Lottie dynamic import, which makes
  // webpack/Vite resolve `@lottiefiles/react-lottie-player` at build time and
  // hard-fail when the optional peer is absent. Minify identifiers + syntax
  // only (keeps gzip flat), whitespace off so the comments survive.
  // Mirrors @tour-kit/analytics' tsup config.
  minify: false,
  sourcemap: true,
  target: 'es2020',
  outDir: 'dist',
  esbuildOptions(options) {
    options.minifyIdentifiers = true
    options.minifySyntax = true
    options.minifyWhitespace = false
  },
  async onSuccess() {
    // tailwind/index is a build-time Node module — keep it directive-free.
    injectUseClient(['index', 'headless'])

    // Use sync methods to avoid dynamic import heap issues on WSL2
    fs.mkdirSync('dist/styles', { recursive: true })

    // Copy CSS files if they exist
    if (fs.existsSync('src/styles/variables.css')) {
      fs.copyFileSync('src/styles/variables.css', 'dist/styles/variables.css')
    } else {
      // Create default variables.css if it doesn't exist
      fs.writeFileSync('dist/styles/variables.css', '/* @tour-kit/media CSS variables */\n')
    }
  },
})
