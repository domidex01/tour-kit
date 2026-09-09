/**
 * Types for `engine-guard.mjs`, hand-written for the same reason
 * `closure.d.mts` is: the module stays plain ESM and has no build of its own.
 *
 * `expect` is typed loosely on purpose — these helpers are called from Vitest
 * test files and taking the assertion function as a parameter keeps this file
 * free of a Vitest import, so nothing here is pulled into a non-test context.
 */
type ExpectLike = (
  actual: unknown,
  message?: string
) => {
  toBe(expected: unknown): void
  toBeDefined(): void
  toBeGreaterThan(expected: number): void
  toHaveLength(expected: number): void
  not: { toBeNull(): void; toMatch(expected: RegExp): void }
}

export interface EnginePaths {
  dist: string
  engineJs: string
  engineCjs: string
  engineDts: string
  engineDcts: string
  mainJs: string
  mainCjs: string
  mainDts: string
}

/** Read a built file as UTF-8. */
export declare function read(path: string): string

/** The four built engine files plus the sibling main entry used as control. */
export declare function enginePaths(pkgRoot: string): EnginePaths

/** Gate on the `dist` DIRECTORY — a filename gate turns a typo into a skip. */
export declare function distExists(pkgRoot: string): boolean

/** The four built engine files exist — run first, or later scans are vacuous. */
export declare function assertEngineFilesExist(expect: ExpectLike, paths: EnginePaths): void

/** The entry plus every chunk it imports, concatenated. Never the entry alone. */
export declare function closureSrc(entry: string): string

/** Assert the closure exceeds `minBytes` raw — catches a walker that followed nothing. */
export declare function assertClosureIsNotTheShell(
  expect: ExpectLike,
  entry: string,
  minBytes?: number
): void

/** Every source file reachable from `entry` by relative imports, to fixpoint. */
export declare function reachableFrom(entry: string): string[]

/** Every path the `./engine` exports block names exists on disk. */
export declare function assertEngineExportsResolve(expect: ExpectLike, pkgRoot: string): void

/** Does the file begin with a `'use client'` directive? */
export declare function startsWithClientDirective(path: string): boolean

/** The engine entry is not listed in tsup's `injectUseClient(...)` call. */
export declare function assertEngineNotInInjectUseClient(expect: ExpectLike, pkgRoot: string): void
