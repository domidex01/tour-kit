// Manual arg parser — pulled by hand to keep the bundle flat. ~6 flags total;
// commander/yargs would be heavier than the parser itself.

import { existsSync, readFileSync, statSync, writeFileSync } from 'node:fs'
import { readdir } from 'node:fs/promises'
import { extname, join, resolve } from 'node:path'
import jscodeshift from 'jscodeshift'
import fromJoyride from './transforms/from-joyride'

export interface CliOptions {
  from: 'joyride' | 'shepherd' | 'driver'
  parser: 'tsx' | 'ts' | 'babel'
  dryRun: boolean
  print: boolean
  extensions: readonly string[]
  verbose: boolean
  paths: readonly string[]
}

type JscodeshiftTransform = (
  file: { source: string; path: string },
  api: {
    jscodeshift: ReturnType<typeof jscodeshift.withParser>
    j: ReturnType<typeof jscodeshift.withParser>
    stats: () => void
    report: () => void
  },
  options: Record<string, unknown>
) => string

const TRANSFORMS: Partial<Record<CliOptions['from'], JscodeshiftTransform>> = {
  joyride: fromJoyride as unknown as JscodeshiftTransform,
}

const DEFAULT_EXTENSIONS = ['ts', 'tsx', 'js', 'jsx'] as const

const EXIT_OK = 0
const EXIT_PARSE_ERROR = 1
const EXIT_BAD_ARGS = 2
const EXIT_NO_FILES = 3

class UsageError extends Error {}

// biome-ignore lint/complexity/noExcessiveCognitiveComplexity: top-level CLI dispatch — one branch per flag/exit-code; splitting hides the contract
export async function runMigrate(argv: readonly string[]): Promise<number> {
  let opts: CliOptions
  try {
    opts = parseArgs(argv)
  } catch (e) {
    if (e instanceof UsageError) {
      console.error(`usage error: ${e.message}`)
      console.error(usageMessage())
      return EXIT_BAD_ARGS
    }
    throw e
  }

  const transform = TRANSFORMS[opts.from]
  if (!transform) {
    console.error(`usage error: --from='${opts.from}' is not yet implemented`)
    return EXIT_BAD_ARGS
  }

  const files = await collectFiles(opts.paths, opts.extensions)
  if (files.length === 0) {
    console.error('no files matched the provided paths and extensions')
    return EXIT_NO_FILES
  }

  const j = jscodeshift.withParser(opts.parser)
  const api = { jscodeshift: j, j, stats: () => undefined, report: () => undefined }

  let parseErrors = 0
  for (const file of files) {
    try {
      const source = readFileSync(file, 'utf8')
      const output = transform({ source, path: file }, api, {})
      const finalOutput = typeof output === 'string' ? output : source
      if (opts.print) {
        process.stdout.write(`// ${file}\n${finalOutput}\n`)
        continue
      }
      if (opts.dryRun) {
        if (opts.verbose) {
          console.log(`[dry-run] would ${finalOutput === source ? 'skip' : 'rewrite'}: ${file}`)
        }
        continue
      }
      if (finalOutput !== source) {
        writeFileSync(file, finalOutput, 'utf8')
        if (opts.verbose) console.log(`rewrote: ${file}`)
      } else if (opts.verbose) {
        console.log(`skipped (no change): ${file}`)
      }
    } catch (e) {
      parseErrors += 1
      console.error(`parse error in ${file}: ${(e as Error).message}`)
    }
  }

  return parseErrors > 0 ? EXIT_PARSE_ERROR : EXIT_OK
}

// biome-ignore lint/complexity/noExcessiveCognitiveComplexity: manual arg-parser — one branch per flag; commander/yargs would be heavier than the function itself
function parseArgs(argv: readonly string[]): CliOptions {
  let from: CliOptions['from'] | null = null
  let parser: CliOptions['parser'] = 'tsx'
  let dryRun = false
  let print = false
  let verbose = false
  let extensions: readonly string[] = DEFAULT_EXTENSIONS
  const paths: string[] = []

  let i = 0
  while (i < argv.length) {
    const arg = argv[i]
    if (arg === '--from') {
      const v = argv[i + 1]
      if (!v) throw new UsageError('--from requires a value (joyride|shepherd|driver)')
      if (!isFromValue(v))
        throw new UsageError(`--from='${v}' is not a recognized migration source`)
      from = v
      i += 2
      continue
    }
    if (arg.startsWith('--from=')) {
      const v = arg.slice('--from='.length)
      if (!isFromValue(v))
        throw new UsageError(`--from='${v}' is not a recognized migration source`)
      from = v
      i += 1
      continue
    }
    if (arg === '--parser') {
      const v = argv[i + 1]
      if (!isParserValue(v)) throw new UsageError("--parser must be one of 'tsx' | 'ts' | 'babel'")
      parser = v
      i += 2
      continue
    }
    if (arg === '--dry-run') {
      dryRun = true
      i += 1
      continue
    }
    if (arg === '--print') {
      print = true
      i += 1
      continue
    }
    if (arg === '--verbose') {
      verbose = true
      i += 1
      continue
    }
    if (arg === '--extensions') {
      const v = argv[i + 1]
      if (!v) throw new UsageError('--extensions requires a comma-separated list')
      extensions = v
        .split(',')
        .map((s) => s.trim().replace(/^\./, ''))
        .filter(Boolean)
      i += 2
      continue
    }
    if (arg === '--help' || arg === '-h') {
      console.log(usageMessage())
      throw new UsageError('help requested')
    }
    if (arg.startsWith('--')) {
      throw new UsageError(`unrecognized flag: ${arg}`)
    }
    paths.push(arg)
    i += 1
  }

  if (!from) throw new UsageError('--from is required')

  return {
    from,
    parser,
    dryRun,
    print,
    extensions,
    verbose,
    paths,
  }
}

function isFromValue(v: string | undefined): v is CliOptions['from'] {
  return v === 'joyride' || v === 'shepherd' || v === 'driver'
}

function isParserValue(v: string | undefined): v is CliOptions['parser'] {
  return v === 'tsx' || v === 'ts' || v === 'babel'
}

async function collectFiles(
  paths: readonly string[],
  extensions: readonly string[]
): Promise<string[]> {
  const out: string[] = []
  const matchExt = (file: string): boolean => {
    const ext = extname(file).replace(/^\./, '')
    return extensions.includes(ext)
  }
  for (const p of paths) {
    const abs = resolve(p)
    if (!existsSync(abs)) continue
    const stat = statSync(abs)
    if (stat.isFile()) {
      if (matchExt(abs)) out.push(abs)
      continue
    }
    if (stat.isDirectory()) {
      await walk(abs, matchExt, out)
    }
  }
  return out
}

async function walk(
  dir: string,
  matchExt: (file: string) => boolean,
  out: string[]
): Promise<void> {
  const entries = await readdir(dir, { withFileTypes: true })
  for (const entry of entries) {
    if (entry.name === 'node_modules' || entry.name.startsWith('.')) continue
    const full = join(dir, entry.name)
    if (entry.isDirectory()) {
      await walk(full, matchExt, out)
      continue
    }
    if (entry.isFile() && matchExt(full)) {
      // Skip the fixture .expected files so dry-runs over the corpus don't
      // try to re-transform already-migrated output.
      if (/\.expected\.[jt]sx?$/.test(full)) continue
      out.push(full)
    }
  }
}

function usageMessage(): string {
  return [
    'Usage: tour-kit-migrate --from <source> [options] <paths...>',
    '',
    'Options:',
    '  --from <source>       Migration source (joyride|shepherd|driver). Required.',
    '  --parser <parser>     jscodeshift parser (tsx|ts|babel). Default: tsx.',
    "  --dry-run             Don't write files; only report what would change.",
    '  --print               Print transformed source to stdout.',
    '  --extensions <list>   Comma-separated file extensions. Default: ts,tsx,js,jsx.',
    '  --verbose             Log every file action.',
    '  --help, -h            Show this message.',
    '',
    'Exit codes:',
    '  0  success',
    '  1  parse error during transform',
    '  2  bad CLI args',
    '  3  no files matched',
  ].join('\n')
}
