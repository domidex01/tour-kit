import { execFileSync } from 'node:child_process'
import { existsSync, mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import jscodeshift from 'jscodeshift'

const j = jscodeshift.withParser('tsx')

type TransformFn = (
  file: { source: string; path: string },
  api: {
    jscodeshift: typeof j
    j: typeof j
    stats: () => void
    report: () => void
  },
  options: Record<string, unknown>
) => string | null | undefined

type TransformModule = TransformFn | { default: TransformFn }

export function runTransform(
  transform: TransformModule,
  source: string,
  path = 'fixture.tsx'
): string {
  const api = {
    jscodeshift: j,
    j,
    stats: () => undefined,
    report: () => undefined,
  }
  const fn: TransformFn =
    typeof (transform as { default?: TransformFn }).default === 'function'
      ? (transform as { default: TransformFn }).default
      : (transform as TransformFn)
  const result = fn({ source, path }, api, {})
  return typeof result === 'string' ? result : source
}

export function reparses(tsx: string): boolean {
  try {
    j(tsx)
    return true
  } catch {
    return false
  }
}

export function normalize(s: string): string {
  return s.replace(/\s+/g, ' ').trim()
}

export interface TscResult {
  ok: boolean
  output: string
}

/**
 * `tsc --noEmit` post-check on transformed output. To avoid module-resolution
 * brittleness in `/tmp`, we synthesize a tsconfig pointing at a permissive
 * `@tour-kit/react.d.ts` stub plus a `react.d.ts` stub. This validates SYNTAX
 * and JSX shape without chasing the full workspace type graph — which is the
 * intent per phase-7a-tests.md ("we're verifying the transformed code is
 * well-formed TSX, not that it integrates with the workspace's full types").
 */
// Resolve the workspace's tsc binary up-front. Running `pnpm exec tsc` from
// /tmp fails (no workspace there); we point execFileSync at the real binary so
// cwd doesn't matter.
const __here = dirname(fileURLToPath(import.meta.url))
const TSC_BIN = locateTscBin(__here)

function locateTscBin(start: string): string {
  const candidates = process.platform === 'win32' ? ['tsc.cmd', 'tsc.ps1', 'tsc'] : ['tsc']
  let dir = start
  while (dir !== dirname(dir)) {
    for (const name of candidates) {
      const candidate = resolve(dir, 'node_modules', '.bin', name)
      if (existsSync(candidate)) return candidate
    }
    dir = dirname(dir)
  }
  // Fall back to PATH — let exec fail loudly if it's missing.
  return candidates[0]
}

export function tscNoEmit(tsx: string): TscResult {
  const dir = mkdtempSync(join(tmpdir(), 'tk-codemod-'))
  try {
    const file = join(dir, 'output.tsx')
    const tsconfig = join(dir, 'tsconfig.json')
    const stubsDir = join(dir, 'stubs')
    writeFileSync(file, tsx, 'utf8')
    writeStubs(stubsDir)
    writeFileSync(
      tsconfig,
      JSON.stringify(
        {
          compilerOptions: {
            noEmit: true,
            jsx: 'preserve',
            target: 'es2020',
            module: 'esnext',
            moduleResolution: 'bundler',
            skipLibCheck: true,
            isolatedModules: true,
            esModuleInterop: true,
            allowSyntheticDefaultImports: true,
            strict: false,
            noImplicitAny: false,
            paths: {
              '@tour-kit/react': ['./stubs/tour-kit-react.d.ts'],
              react: ['./stubs/react.d.ts'],
              'react-joyride': ['./stubs/react-joyride.d.ts'],
            },
          },
          include: ['output.tsx', 'stubs/**/*'],
        },
        null,
        2
      ),
      'utf8'
    )
    try {
      execFileSync(TSC_BIN, ['--noEmit', '-p', tsconfig], {
        encoding: 'utf8',
        stdio: ['ignore', 'pipe', 'pipe'],
        cwd: dir,
      })
      return { ok: true, output: '' }
    } catch (e) {
      const err = e as { stdout?: Buffer | string; stderr?: Buffer | string }
      return { ok: false, output: `${String(err.stdout ?? '')}${String(err.stderr ?? '')}` }
    }
  } finally {
    rmSync(dir, { recursive: true, force: true })
  }
}

function writeStubs(stubsDir: string): void {
  mkdirSync(stubsDir, { recursive: true })
  writeFileSync(
    join(stubsDir, 'react.d.ts'),
    `declare module 'react' {
  export type ReactNode = unknown
  export type FC<P = unknown> = (props: P) => unknown
  export type Dispatch<A> = (value: A) => void
  export type SetStateAction<S> = S | ((prev: S) => S)
  export function useState<S>(initial: S | (() => S)): [S, Dispatch<SetStateAction<S>>]
  export function useEffect(effect: () => void | (() => void), deps?: readonly unknown[]): void
  export function useCallback<T extends (...args: any[]) => any>(cb: T, deps?: readonly unknown[]): T
  export function useMemo<T>(factory: () => T, deps?: readonly unknown[]): T
  export function useRef<T>(initial: T | null): { current: T | null }
  export function useContext<T>(ctx: any): T
  export function createContext<T>(defaultValue: T): any
  export namespace JSX {
    interface IntrinsicElements {
      [elem: string]: any
    }
    interface Element {
      type: any
    }
  }
  const React: any
  export default React
}
`,
    'utf8'
  )
  writeFileSync(
    join(stubsDir, 'tour-kit-react.d.ts'),
    `declare module '@tour-kit/react' {
  export const TourProvider: any
  export const TourCard: any
  export const Tour: any
  export const TourStep: any
  export function useTour(): {
    start: (id?: string) => void
    next: () => void
    prev: () => void
    skip: () => void
    stop: () => void
    complete: () => void
    goTo: (i: number) => void
    isActive: boolean
    currentStepIndex: number
  }
}
`,
    'utf8'
  )
  writeFileSync(
    join(stubsDir, 'react-joyride.d.ts'),
    `declare module 'react-joyride' {
  const Joyride: any
  export default Joyride
  export function useJoyride(options?: any): { Tour: any; controls: any }
  export type CallBackProps = any
  export type EventData = any
  export const ACTIONS: any
  export const STATUS: any
}
`,
    'utf8'
  )
}
