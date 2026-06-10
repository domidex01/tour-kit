import { defineConfig } from 'tsup'
import { injectUseClient } from '../../tooling/build/use-client'

export default defineConfig({
  entry: {
    index: 'src/index.ts',
    'server/index': 'src/server/index.ts',
    headless: 'src/headless.ts',
    'tailwind/index': 'src/tailwind/index.ts',
  },
  format: ['cjs', 'esm'],
  dts: true,
  clean: true,
  external: [
    'react',
    'react-dom',
    'ai',
    '@ai-sdk/react',
    '@ai-sdk/provider',
    '@ai-sdk/openai',
    '@tour-kit/core',
    'class-variance-authority',
    'clsx',
    'tailwind-merge',
    '@tour-kit/license',
  ],
  treeshake: true,
  splitting: true,
  minify: true,
  sourcemap: true,
  target: 'es2020',
  outDir: 'dist',
  async onSuccess() {
    // index + headless are the React client surfaces and need the RSC
    // directive (tooling/build/use-client.ts). server/index and
    // tailwind/index must stay directive-free — they are imported from
    // server/build contexts.
    injectUseClient(['index', 'headless'])
  },
})
