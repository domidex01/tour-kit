## Subject: Sharing product tours across apps in a Turborepo monorepo — tutorial

## Recipients:
- Cooperpress (React Status, JavaScript Weekly, Frontend Focus): editor@cooperpress.com
- This Week in React: sebastien@thisweekinreact.com
- Bytes.dev: submit via site

## Email body:

Hi [name],

I wrote a step-by-step tutorial on setting up shared product tours across multiple apps in a Turborepo + pnpm monorepo. The core pattern: define tour steps as plain TypeScript data in a shared internal package, then consume from Next.js and Vite apps that each render with their own design system.

The article includes tree shaking benchmarks (53% bundle reduction with `sideEffects: false`), cross-origin state sharing via custom storage adapters, and troubleshooting for common Next.js App Router issues.

Link: https://usertourkit.com/blog/tour-kit-turborepo-monorepo-shared-tours

Thanks,
Domi
