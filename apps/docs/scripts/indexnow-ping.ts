#!/usr/bin/env tsx
/**
 * indexnow-ping.ts
 *
 * Manual CLI for the IndexNow protocol. Delegates to lib/indexnow.ts so the
 * Vercel webhook (app/api/webhooks/vercel/route.ts) and CLI share one impl.
 *
 * Usage:
 *   pnpm --filter docs indexnow:ping             # ping all sitemap URLs
 *   pnpm --filter docs indexnow:ping --latest=20 # only the 20 most-recent
 *   pnpm --filter docs indexnow:ping --dry-run   # log payload, don't POST
 */
import {
  INDEXNOW_ENDPOINT,
  fetchSitemapUrls,
  pingIndexNow,
} from '../lib/indexnow.js'

interface CliArgs {
  latest: number | null
  dryRun: boolean
}

function parseArgs(): CliArgs {
  const args = process.argv.slice(2)
  const latestArg = args.find((a) => a.startsWith('--latest='))
  return {
    latest: latestArg ? Number.parseInt(latestArg.slice('--latest='.length), 10) : null,
    dryRun: args.includes('--dry-run'),
  }
}

async function main(): Promise<void> {
  const { latest, dryRun } = parseArgs()

  if (dryRun) {
    const allUrls = await fetchSitemapUrls()
    const urls = latest ? allUrls.slice(0, latest) : allUrls
    console.log(`[dry-run] fetched ${allUrls.length} sitemap URLs; would submit ${urls.length}`)
    console.log(`[dry-run] endpoint: ${INDEXNOW_ENDPOINT}`)
    console.log(`[dry-run] first 3 URLs:`, urls.slice(0, 3))
    return
  }

  const result = await pingIndexNow({ latest: latest ?? undefined })
  console.log(`fetched ${result.total} sitemap URLs; submitted ${result.submitted}`)
  for (const [i, batch] of result.batches.entries()) {
    const label = `batch ${i + 1}/${result.batches.length}`
    if (batch.ok) {
      console.log(`${label}: HTTP ${batch.status} OK`)
    } else {
      console.error(`${label}: HTTP ${batch.status} — ${batch.text.slice(0, 200)}`)
    }
  }
  console.log(`done — ${result.accepted}/${result.submitted} URLs accepted by IndexNow`)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
