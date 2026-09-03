/**
 * React-free structural mirrors of the four React types core's engine surface
 * used to import. Imports nothing — that is the entire point: task §1.2 carves
 * `@tour-kit/core/engine` out of these files, and a subpath that names `react`
 * in its emitted `.d.ts` is not framework-agnostic.
 *
 * `TourRef` and `TourDispatch` are exact structural equals of React's
 * `RefObject` / `Dispatch` (both directions of assignability are pinned in
 * `__tests__/types/tour-node-parity.test-d.ts`). `TourNode` is a deliberate
 * *supertype* of `ReactNode` — no React-free type is mutually assignable with
 * it, so render sites cast once at the boundary, the same convention
 * `lib/schemas/parse.ts` already documents.
 */

/**
 * Structural shape of a rendered element. React's `ReactElement` and Vue's
 * VNode both satisfy it, so this is not secretly React-only.
 *
 * Wider than `ReactElement`: any `{ type, props }` object now type-checks and
 * fails inside the renderer at runtime instead of at build time. Accepted —
 * still strictly narrower than the `unknown` that `TourStepDefinition` ships.
 */
export interface TourElementLike {
  readonly type: unknown
  readonly props: unknown
}

/**
 * Renderable content. Mirrors React's `ReactNode` union closely enough that
 * `ReactNode extends TourNode` holds — enforced by the drift guard in
 * `__tests__/types/tour-node-parity.test-d.ts`, which fails the build the day
 * React's union grows a member this one does not cover.
 *
 * Deliberately excludes `symbol` and bare functions so authoring errors in
 * `TourStep.content` stay compile errors, and excludes plain `{ key: string }`
 * so `TourNode | LocalizedText` keeps discriminating for `isI18nKey`. The
 * promise arm is `PromiseLike<TourNode>` rather than `PromiseLike<unknown>`
 * for the same reason — otherwise `content: Promise.resolve(Symbol())` would
 * compile and defeat the exclusions one level down.
 */
export type TourNode =
  | string
  | number
  | bigint
  | boolean
  | null
  | undefined
  | TourElementLike
  | Iterable<TourNode>
  | PromiseLike<TourNode>

/** Structural equal of `React.RefObject<T>`. */
export interface TourRef<T> {
  current: T
}

/** Structural equal of `React.Dispatch<A>`. */
export type TourDispatch<A> = (value: A) => void
