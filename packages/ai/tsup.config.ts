import { defineConfig } from 'tsup'

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
  ],
  treeshake: true,
  splitting: true,
  minify: true,
  sourcemap: true,
  target: 'es2020',
  outDir: 'dist',
})
