#!/usr/bin/env node
/**
 * indexnow-ping.mjs
 *
 * Pings the IndexNow protocol (api.indexnow.org) with URLs from the live
 * sitemap so Bing and Yandex pick up new/updated pages within minutes
 * instead of waiting for their next crawl cycle.
 *
 * Usage:
 *   pnpm --filter docs indexnow:ping             # ping all sitemap URLs
 *   pnpm --filter docs indexnow:ping --latest=20 # only the 20 most-recent
 *   pnpm --filter docs indexnow:ping --dry-run   # log payload, don't POST
 *
 * The IndexNow key is published at https://usertourkit.com/<key>.txt and
 * MUST match the value below — the protocol verifies the file before
 * accepting submissions.
 */

const HOST = 'usertourkit.com'
const KEY = '504de160effbdd87ff26d83f435a2c6d'
const SITEMAP_URL = `https://${HOST}/sitemap.xml`
const KEY_LOCATION = `https://${HOST}/${KEY}.txt`
const ENDPOINT = 'https://api.indexnow.org/indexnow'
// IndexNow accepts up to 10,000 URLs per request; we batch under that with
// margin to keep payloads reasonable for retries.
const BATCH_SIZE = 1000

function parseArgs() {
  const args = process.argv.slice(2)
  const latestArg = args.find((a) => a.startsWith('--latest='))
  return {
    latest: latestArg ? Number.parseInt(latestArg.slice('--latest='.length), 10) : null,
    dryRun: args.includes('--dry-run'),
  }
}

async function fetchSitemapUrls() {
  const res = await fetch(SITEMAP_URL)
  if (!res.ok) throw new Error(`sitemap fetch failed: HTTP ${res.status}`)
  const xml = await res.text()
  // Parse <url><loc>...</loc><lastmod>...</lastmod></url> blocks; tolerate
  // missing lastmod by sorting unknowns last.
  const entries = []
  const urlRe = /<url>([\s\S]*?)<\/url>/g
  for (const match of xml.matchAll(urlRe)) {
    const block = match[1]
    const loc = block.match(/<loc>(.*?)<\/loc>/)?.[1]
    const lastmod = block.match(/<lastmod>(.*?)<\/lastmod>/)?.[1] ?? null
    if (loc) entries.push({ loc, lastmod })
  }
  // Newest first; null lastmod sinks to the bottom so --latest still
  // surfaces fresh content even when most entries share a date.
  entries.sort((a, b) => {
    if (!a.lastmod && !b.lastmod) return 0
    if (!a.lastmod) return 1
    if (!b.lastmod) return -1
    return b.lastmod.localeCompare(a.lastmod)
  })
  return entries.map((e) => e.loc)
}

async function postBatch(urlList) {
  const body = {
    host: HOST,
    key: KEY,
    keyLocation: KEY_LOCATION,
    urlList,
  }
  const res = await fetch(ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json; charset=utf-8' },
    body: JSON.stringify(body),
  })
  return { status: res.status, ok: res.ok, text: await res.text() }
}

async function main() {
  const { latest, dryRun } = parseArgs()
  const allUrls = await fetchSitemapUrls()
  const urls = latest ? allUrls.slice(0, latest) : allUrls
  console.log(`fetched ${allUrls.length} sitemap URLs; submitting ${urls.length}`)

  const batches = []
  for (let i = 0; i < urls.length; i += BATCH_SIZE) {
    batches.push(urls.slice(i, i + BATCH_SIZE))
  }

  if (dryRun) {
    console.log(`[dry-run] would POST ${batches.length} batch(es) to ${ENDPOINT}`)
    console.log(`[dry-run] first 3 URLs:`, urls.slice(0, 3))
    return
  }

  let okCount = 0
  for (const [i, batch] of batches.entries()) {
    const result = await postBatch(batch)
    const label = `batch ${i + 1}/${batches.length} (${batch.length} URLs)`
    if (result.ok) {
      okCount += batch.length
      console.log(`${label}: HTTP ${result.status} OK`)
    } else {
      console.error(`${label}: HTTP ${result.status} — ${result.text.slice(0, 200)}`)
    }
  }
  console.log(`done — ${okCount}/${urls.length} URLs accepted by IndexNow`)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
