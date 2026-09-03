/**
 * Types for `closure.mjs`, which stays plain ESM so `check-dist-gzip.mjs` can
 * run it under bare `node` with no build step. Hand-written rather than
 * generated: the module is 90 lines and has no build of its own.
 */

/** The alternation matching how built output introduces a module specifier. */
export declare const SPECIFIER_PREFIX: string

/** Relative specifiers — the edges of a closure. Global-flagged. */
export declare const RELATIVE_SPECIFIER: RegExp

/** Matches one bare package as a module specifier (never an identifier). */
export declare function specifierPattern(pkg: string): RegExp

/**
 * Every file reachable from `entry` by following relative specifiers to
 * fixpoint, entry first. Throws (with `code: 'ENOENT'`) if the entry is absent.
 */
export declare function closureOf(entry: string): string[]
