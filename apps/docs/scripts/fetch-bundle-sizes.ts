#!/usr/bin/env tsx
/**
 * Fetch bundle-size data from bundlephobia for every package listed in
 * PACKAGES and write a JSON snapshot to content/benchmarks/bundle-sizes.json.
 *
 * The snapshot is committed and read at build time so the docs site does
 * not depend on bundlephobia being reachable during SSG. Re-run quarterly
 * (or before shipping a release) to refresh:
 *
 *   pnpm --filter docs tsx scripts/fetch-bundle-sizes.ts
 *
 * Notes on methodology (mirrors /how-we-test):
 * - `gzipBytes` is the gzipped production-build size of the default export.
 * - `minifiedBytes` is the minified-but-un-gzipped size (what most blog
 *   posts quote when they omit gzip).
 * - `dependencyCount` is the transitive count bundlephobia reports.
 * - `version` is the npm version bundlephobia measured.
 * - Packages that 404 on bundlephobia (monorepo subpackages, scoped packages
 *   bundlephobia does not index) fall back to `status: "unavailable"` so the
 *   table can render "n/a — see source" without fabricating numbers.
 */

import { writeFile, mkdir } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const HERE = path.dirname(fileURLToPath(import.meta.url))
const OUTPUT = path.resolve(HERE, '..', 'content', 'benchmarks', 'bundle-sizes.json')

interface PackageEntry {
  /** npm package name to measure. */
  name: string
  /** Human-readable label (e.g. "userTourKit", "React Joyride"). */
  label: string
  /** Optional documentation URL for the source row link. */
  homepage: string
  /** Flag our own packages for styling in the table. */
  isOurs?: boolean
}

const PACKAGES: PackageEntry[] = [
  {
    name: '@tour-kit/core',
    label: '@tour-kit/core',
    homepage: 'https://usertourkit.com/docs/core',
    isOurs: true,
  },
  {
    name: '@tour-kit/react',
    label: '@tour-kit/react',
    homepage: 'https://usertourkit.com/docs/react',
    isOurs: true,
  },
  {
    name: '@tour-kit/hints',
    label: '@tour-kit/hints',
    homepage: 'https://usertourkit.com/docs/hints',
    isOurs: true,
  },
  {
    name: 'react-joyride',
    label: 'React Joyride',
    homepage: 'https://react-joyride.com/',
  },
  {
    name: 'shepherd.js',
    label: 'Shepherd.js',
    homepage: 'https://shepherdjs.dev/',
  },
  {
    name: 'driver.js',
    label: 'Driver.js',
    homepage: 'https://driverjs.com/',
  },
  {
    name: 'intro.js',
    label: 'Intro.js',
    homepage: 'https://introjs.com/',
  },
  {
    name: 'onborda',
    label: 'Onborda',
    homepage: 'https://onborda.dev/',
  },
  {
    name: '@reactour/tour',
    label: 'Reactour',
    homepage: 'https://docs.react.tours/',
  },
]

interface BundlephobiaResponse {
  name: string
  version: string
  size: number
  gzip: number
  dependencyCount: number
  hasJSModule?: string | boolean
  hasSideEffects?: boolean
}

interface MeasuredRow {
  name: string
  label: string
  homepage: string
  isOurs?: boolean
  status: 'measured' | 'unavailable'
  version?: string
  minifiedBytes?: number
  gzipBytes?: number
  dependencyCount?: number
  error?: string
  sourceUrl: string
}

async function fetchSize(pkg: PackageEntry): Promise<MeasuredRow> {
  const url = `https://bundlephobia.com/api/size?package=${encodeURIComponent(pkg.name)}&record=true`
  const sourceUrl = `https://bundlephobia.com/package/${encodeURIComponent(pkg.name)}`
  try {
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'usertourkit-bundle-size-fetcher/1.0 (https://usertourkit.com/how-we-test)',
        Accept: 'application/json',
      },
    })
    if (!res.ok) {
      return {
        name: pkg.name,
        label: pkg.label,
        homepage: pkg.homepage,
        isOurs: pkg.isOurs,
        status: 'unavailable',
        error: `HTTP ${res.status}`,
        sourceUrl,
      }
    }
    const data = (await res.json()) as BundlephobiaResponse
    return {
      name: pkg.name,
      label: pkg.label,
      homepage: pkg.homepage,
      isOurs: pkg.isOurs,
      status: 'measured',
      version: data.version,
      minifiedBytes: data.size,
      gzipBytes: data.gzip,
      dependencyCount: data.dependencyCount,
      sourceUrl,
    }
  } catch (err) {
    return {
      name: pkg.name,
      label: pkg.label,
      homepage: pkg.homepage,
      isOurs: pkg.isOurs,
      status: 'unavailable',
      error: err instanceof Error ? err.message : String(err),
      sourceUrl,
    }
  }
}

async function main() {
  console.log(`Fetching bundle sizes for ${PACKAGES.length} packages from bundlephobia…`)

  const rows: MeasuredRow[] = []
  for (const pkg of PACKAGES) {
    process.stdout.write(`  ${pkg.name.padEnd(28)} `)
    const row = await fetchSize(pkg)
    if (row.status === 'measured') {
      console.log(`${row.gzipBytes?.toLocaleString()} B gzip  (v${row.version})`)
    } else {
      console.log(`unavailable — ${row.error}`)
    }
    rows.push(row)
    // Be polite to bundlephobia's unofficial API.
    await new Promise((r) => setTimeout(r, 600))
  }

  const snapshot = {
    measuredAt: new Date().toISOString(),
    methodology:
      'Gzipped production-build sizes pulled from bundlephobia.com API. Methodology documented at /how-we-test. Re-run `scripts/fetch-bundle-sizes.ts` to refresh.',
    rows,
  }

  await mkdir(path.dirname(OUTPUT), { recursive: true })
  await writeFile(OUTPUT, JSON.stringify(snapshot, null, 2) + '\n', 'utf8')
  console.log(`\nWrote ${path.relative(path.resolve(HERE, '..'), OUTPUT)}`)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
