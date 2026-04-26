/**
 * IndexNow protocol client.
 *
 * Pings api.indexnow.org with sitemap URLs so Bing and Yandex pick up
 * new/updated pages within minutes instead of waiting for a crawl cycle.
 *
 * Used by:
 * - scripts/indexnow-ping.mjs (manual CLI)
 * - app/api/webhooks/vercel/route.ts (auto on Vercel deployment.succeeded)
 *
 * The published key file at https://usertourkit.com/<KEY>.txt MUST equal
 * the KEY constant — IndexNow verifies the file before accepting submissions.
 */

export const INDEXNOW_HOST = 'usertourkit.com'
export const INDEXNOW_KEY = '504de160effbdd87ff26d83f435a2c6d'
export const INDEXNOW_KEY_LOCATION = `https://${INDEXNOW_HOST}/${INDEXNOW_KEY}.txt`
export const INDEXNOW_SITEMAP_URL = `https://${INDEXNOW_HOST}/sitemap.xml`
export const INDEXNOW_ENDPOINT = 'https://api.indexnow.org/indexnow'
const BATCH_SIZE = 1000

export interface SitemapEntry {
  loc: string
  lastmod: string | null
}

export interface BatchResult {
  status: number
  ok: boolean
  text: string
}

export interface PingResult {
  total: number
  submitted: number
  accepted: number
  batches: BatchResult[]
}

export async function fetchSitemapUrls(
  fetchImpl: typeof fetch = fetch,
): Promise<string[]> {
  const res = await fetchImpl(INDEXNOW_SITEMAP_URL)
  if (!res.ok) throw new Error(`sitemap fetch failed: HTTP ${res.status}`)
  const xml = await res.text()
  const entries: SitemapEntry[] = []
  const urlRe = /<url>([\s\S]*?)<\/url>/g
  for (const match of xml.matchAll(urlRe)) {
    const block = match[1]
    const loc = block.match(/<loc>(.*?)<\/loc>/)?.[1]
    const lastmod = block.match(/<lastmod>(.*?)<\/lastmod>/)?.[1] ?? null
    if (loc) entries.push({ loc, lastmod })
  }
  // Newest first; null lastmod sinks so --latest still surfaces fresh content
  // when most entries share a date.
  entries.sort((a, b) => {
    if (!a.lastmod && !b.lastmod) return 0
    if (!a.lastmod) return 1
    if (!b.lastmod) return -1
    return b.lastmod.localeCompare(a.lastmod)
  })
  return entries.map((e) => e.loc)
}

export async function postBatch(
  urlList: string[],
  fetchImpl: typeof fetch = fetch,
): Promise<BatchResult> {
  const body = {
    host: INDEXNOW_HOST,
    key: INDEXNOW_KEY,
    keyLocation: INDEXNOW_KEY_LOCATION,
    urlList,
  }
  const res = await fetchImpl(INDEXNOW_ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json; charset=utf-8' },
    body: JSON.stringify(body),
  })
  return { status: res.status, ok: res.ok, text: await res.text() }
}

export async function pingIndexNow(
  options: { latest?: number; fetchImpl?: typeof fetch } = {},
): Promise<PingResult> {
  const { latest, fetchImpl = fetch } = options
  const allUrls = await fetchSitemapUrls(fetchImpl)
  const urls = latest ? allUrls.slice(0, latest) : allUrls
  const batches: BatchResult[] = []
  let accepted = 0
  for (let i = 0; i < urls.length; i += BATCH_SIZE) {
    const batch = urls.slice(i, i + BATCH_SIZE)
    const result = await postBatch(batch, fetchImpl)
    batches.push(result)
    if (result.ok) accepted += batch.length
  }
  return { total: allUrls.length, submitted: urls.length, accepted, batches }
}
