# ── Base ──
FROM node:20-alpine AS base
RUN corepack enable && corepack prepare pnpm@10.26.1 --activate
WORKDIR /app

# ── Dependencies ──
FROM base AS deps
COPY pnpm-lock.yaml pnpm-workspace.yaml package.json turbo.json ./

# Copy only package.json files for each workspace package the docs app needs
COPY apps/docs/package.json apps/docs/
COPY packages/core/package.json packages/core/
COPY packages/react/package.json packages/react/
COPY packages/hints/package.json packages/hints/

RUN pnpm install --frozen-lockfile

# ── Build ──
FROM base AS builder
COPY --from=deps /app/ ./
COPY . .
RUN pnpm build --filter=@tour-kit/docs

# ── Runner ──
FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production

RUN addgroup --system --gid 1001 nodejs \
 && adduser --system --uid 1001 nextjs

# Next.js standalone output
COPY --from=builder /app/apps/docs/.next/standalone ./
COPY --from=builder /app/apps/docs/.next/static ./apps/docs/.next/static
COPY --from=builder /app/apps/docs/public ./apps/docs/public

USER nextjs
EXPOSE 3000
ENV PORT=3000
CMD ["node", "apps/docs/server.js"]
