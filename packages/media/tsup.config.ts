import * as fs from 'node:fs'
import { defineConfig } from 'tsup'

export default defineConfig([
  // Main entry
  {
    entry: {
      index: 'src/index.ts',
      headless: 'src/headless.ts',
    },
    format: ['cjs', 'esm'],
    dts: true,
    clean: true,
    external: ['react', 'react-dom', '@lottiefiles/react-lottie-player', '@tour-kit/license'],
    treeshake: true,
    splitting: true,
    minify: true,
    sourcemap: true,
    target: 'es2020',
    outDir: 'dist',
    esbuildOptions(options) {
      options.banner = {
        js: '"use client";',
      }
    },
    // Copy CSS files to dist
    async onSuccess() {
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
  },
])
