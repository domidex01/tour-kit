/**
 * v2 §1.6 — does the PUBLISHED tarball carry a working CDN build?
 *
 * `run-smoke.sh` probes the smoke page with `curl`, which executes no
 * JavaScript, so a `<script>` tag on that page would prove nothing. This script
 * is the JavaScript half: it reads the file at the exact path unpkg serves
 * (`node_modules/@tour-kit/core/dist/engine/index.global.js` IS the unpkg URL
 * minus the host), checks the two manifest fields that point a CDN at it, and
 * runs a tour out of it.
 *
 * Zero dependencies on purpose — `apps/smoke` installs with
 * `--ignore-workspace`, so anything imported here has to already be in the
 * published dependency tree.
 *
 * `vm.runInThisContext` rather than the `new Function` trick the vitest suite
 * uses: this is a one-shot process, so leaking `globalThis.TourKit` costs
 * nothing and reads more like what a browser does. There is no DOM here (Node
 * 20 in the workflow, no jsdom), so the tour below has no targets — which is
 * the headless proof, in the realm a CDN user's page is furthest from.
 *
 * KNOWN WINDOW: the smoke app installs `latest`. Between merging §1.6 and the
 * release that publishes the file, this script is RED, and deliberately has no
 * skip — one keyed on the `unpkg` field would also skip the day someone deletes
 * that field.
 */
import { readFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import { dirname, join } from 'node:path'
import vm from 'node:vm'

const require = createRequire(import.meta.url)

function fail(msg) {
  console.error(`[smoke] FAIL — ${msg}`)
  process.exit(1)
}

// `./package.json` is an explicit entry in core's `exports` map, so this
// resolves without reaching into node_modules by hand.
const pkgPath = require.resolve('@tour-kit/core/package.json')
const pkg = JSON.parse(readFileSync(pkgPath, 'utf8'))

const rel = 'dist/engine/index.global.js'
for (const field of ['unpkg', 'jsdelivr']) {
  if (pkg[field] !== `./${rel}`) {
    fail(`${field} field is ${pkg[field]}, expected ./${rel}`)
  }
}

let source
try {
  source = readFileSync(join(dirname(pkgPath), rel), 'utf8')
} catch (error) {
  fail(`cannot read ${rel} from the installed tarball: ${error.message}`)
}

if (!source.startsWith('var TourKit=')) fail('IIFE does not open with the global assignment')
// `require(` would be an external that leaked in as a throwing `__require` shim;
// `process.env` would be the `platform: 'browser'` flag having been dropped.
if (/\brequire\s*\(|process\.env/.test(source)) fail('IIFE leaks require( or process.env')

vm.runInThisContext(source)

const { createTourEngine, createMemoryStorage } = globalThis.TourKit
const engine = createTourEngine({
  tours: [
    {
      id: 't',
      steps: [
        { id: 's1', content: 'a' },
        { id: 's2', content: 'b' },
      ],
    },
  ],
  storage: createMemoryStorage(),
})

await engine.start('t')
await engine.next()

const landed = engine.getState().currentStep?.id
if (landed !== 's2') fail(`expected to advance to s2, got ${landed}`)
engine.destroy()

console.log(
  `[smoke] OK — ${rel} from @tour-kit/core@${pkg.version} defines TourKit and runs a tour`
)
