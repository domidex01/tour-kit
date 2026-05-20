// jscodeshift transform — v1 `ReplayBridge` window-event pattern → v2
// `useTourActions(id).start()`.
//
// v1 consumers wrote a workaround when they needed a sibling subtree to drive
// a tour: dispatch a `tour-replay` CustomEvent with `{ detail: { id } }`, and
// mount a child component inside `<Tour>` that listened for it and called
// `useTour().start(id)`. Phase 1 ships `useTourActions(id)` as the first-class
// API, so this transform retires the bridge:
//   - `window.dispatchEvent(new CustomEvent('tour-replay', { detail: { id } }))`
//      → `useTourActions(id).start()`
//   - `window.addEventListener('tour-replay', ...)`  → removed (statement-level)
//   - `window.removeEventListener('tour-replay', ...)` → removed
//   - `import { useTourActions } from '@tour-kit/core'` added if needed
//
// Heuristic only. The event name `'tour-replay'` is the canonical one shipped
// in v1 docs. Files with different event names get a leading TODO comment
// instead of an unsafe rewrite — running this codemod on those files is a
// no-op so re-running is always safe.

import type { API, ASTNode, Collection, FileInfo, Identifier, JSCodeshift } from 'jscodeshift'

/**
 * Cross-parser literal check. The `tsx` parser (Babel) produces `StringLiteral`
 * nodes; the legacy `flow`/`acorn` parsers emit the older `Literal` shape. We
 * accept either so the codemod runs over both v1-era and modern v2 codebases.
 */
function isStringLiteralWithValue(node: unknown, expected: string): boolean {
  if (!node || typeof node !== 'object') return false
  const n = node as { type?: string; value?: unknown }
  if (n.type !== 'Literal' && n.type !== 'StringLiteral') return false
  return n.value === expected
}

export const parser = 'tsx'

const TARGET_EVENT = 'tour-replay'
const TARGET_MODULE = '@tour-kit/core'
const IMPORT_NAME = 'useTourActions'

interface DispatchMatch {
  /** AST node for the tour id (string literal, template literal, identifier, …). */
  idExpression: ASTNode
}

export default function transform(file: FileInfo, api: API): string {
  const j = api.jscodeshift
  const root = j(file.source)

  const { matches: dispatchPaths, annotated: dispatchAnnotated } = findReplayDispatches(j, root)
  const addListenerPaths = findReplayListeners(j, root, 'addEventListener')
  const removeListenerPaths = findReplayListeners(j, root, 'removeEventListener')

  // Idempotency: nothing matched (no rewritable dispatch, no annotated dispatch,
  // no listeners) → return source unchanged so re-running is a no-op. An
  // annotated dispatch (TODO comment attached but no safe rewrite) still
  // requires serialization so the comment lands in the output.
  if (
    dispatchPaths.length === 0 &&
    !dispatchAnnotated &&
    addListenerPaths.length === 0 &&
    removeListenerPaths.length === 0
  ) {
    return file.source
  }

  // `dispatchAnnotated` (read in the early-return guard above) guarantees the
  // file gets serialized so a TODO comment lands in the output. The flag
  // below tracks whether we did a real rewrite — only then do we add the
  // `useTourActions` import.
  let rewroteDispatch = false

  for (const { path, match } of dispatchPaths) {
    const idExpr = match.idExpression as unknown as Parameters<typeof j.callExpression>[1][number]
    const replacement = j.callExpression(
      j.memberExpression(
        j.callExpression(j.identifier(IMPORT_NAME), [idExpr]),
        j.identifier('start')
      ),
      []
    )
    path.replace(replacement as unknown as never)
    rewroteDispatch = true
  }

  // useEffect-cleanup pattern first — must run BEFORE the listener strip so
  // we can match block-body arrows whose only statement is the
  // `window.removeEventListener('tour-replay', h)` we'd otherwise strip out.
  // Running listener-strip first would empty the block and the cleanup-return
  // matcher would no longer recognise it as a one-statement body.
  for (const path of findReplayCleanupReturns(j, root)) {
    j(path).remove()
  }

  // Statement-level removal — drops any remaining `window.addEventListener(...)`
  // / `window.removeEventListener(...)` lines (and their parent ExpressionStatements)
  // that aren't part of a cleanup-return arrow.
  for (const path of [...addListenerPaths, ...removeListenerPaths]) {
    j(path).remove()
  }

  // Only add the import when we actually rewrote a dispatch to useTourActions().
  // Annotation-only runs (TODO comments) don't need the import.
  if (rewroteDispatch) {
    addUseTourActionsImport(j, root)
  }

  return root.toSource({ quote: 'single', trailingComma: true })
}

interface FoundDispatch {
  path: ReturnType<Collection['paths']>[number]
  match: DispatchMatch
}

interface DispatchScanResult {
  matches: FoundDispatch[]
  /** True when at least one dispatch was annotated with a TODO comment (ambiguous detail shape). */
  annotated: boolean
}

function findReplayDispatches(j: JSCodeshift, root: Collection): DispatchScanResult {
  const matches: FoundDispatch[] = []
  let annotated = false
  // biome-ignore lint/complexity/noForEach: jscodeshift Collection#forEach is the canonical traversal API and has no for...of equivalent
  root
    .find(j.CallExpression, {
      callee: {
        type: 'MemberExpression',
        object: { type: 'Identifier', name: 'window' },
        property: { type: 'Identifier', name: 'dispatchEvent' },
      },
    })
    .forEach((path) => {
      const arg = (path.node as { arguments: unknown[] }).arguments[0] as
        | (ASTNode & {
            type?: string
            callee?: { type?: string; name?: string }
            arguments?: unknown[]
          })
        | undefined
      if (!arg) return
      if (arg.type !== 'NewExpression') return
      if (arg.callee?.type !== 'Identifier' || arg.callee.name !== 'CustomEvent') return

      const ctorArgs = (arg.arguments ?? []) as ASTNode[]
      const nameArg = ctorArgs[0]
      if (!isStringLiteralWithValue(nameArg, TARGET_EVENT)) return

      // Pull `{ detail: { id: <expr> } }` out of the second arg. Anything more
      // exotic gets a TODO comment instead of an unsafe rewrite (see fallback
      // branch below — we leave the node untouched so re-running is a no-op).
      const initArg = ctorArgs[1] as
        | (ASTNode & { type?: string; properties?: ASTNode[] })
        | undefined
      const idExpression = extractIdFromCustomEventInit(initArg)
      if (!idExpression) {
        attachLeadingTodo(
          path.node,
          'replay-bridge: could not infer tour id from CustomEvent detail — replace with useTourActions(id).start() manually'
        )
        annotated = true
        return
      }

      matches.push({ path: path as FoundDispatch['path'], match: { idExpression } })
    })
  return { matches, annotated }
}

// biome-ignore lint/complexity/noExcessiveCognitiveComplexity: AST walk over jscodeshift node shapes is inherently branchy; splitting would obscure the property-detection flow
function extractIdFromCustomEventInit(
  init: (ASTNode & { type?: string; properties?: ASTNode[] }) | undefined
): ASTNode | null {
  if (!init || init.type !== 'ObjectExpression' || !init.properties) return null
  for (const prop of init.properties as Array<
    ASTNode & {
      type?: string
      key?: { type?: string; name?: string; value?: unknown }
      value?: ASTNode & { type?: string; properties?: ASTNode[] }
    }
  >) {
    if (prop.type !== 'Property' && prop.type !== 'ObjectProperty') continue
    const keyName = readPropKey(prop.key)
    if (keyName !== 'detail') continue
    const detail = prop.value
    if (!detail || detail.type !== 'ObjectExpression' || !detail.properties) return null
    for (const inner of detail.properties as Array<
      ASTNode & {
        type?: string
        key?: { type?: string; name?: string; value?: unknown }
        value?: ASTNode
      }
    >) {
      if (inner.type !== 'Property' && inner.type !== 'ObjectProperty') continue
      const innerKey = readPropKey(inner.key)
      if (innerKey !== 'id') continue
      return inner.value ?? null
    }
  }
  return null
}

function readPropKey(
  key: ({ type?: string; name?: string; value?: unknown } | undefined) | null
): string | null {
  if (!key) return null
  if (key.type === 'Identifier' && typeof key.name === 'string') return key.name
  if (key.type === 'Literal' && typeof key.value === 'string') return key.value
  return null
}

function findReplayListeners(
  j: JSCodeshift,
  root: Collection,
  method: 'addEventListener' | 'removeEventListener'
): ReturnType<Collection['paths']> {
  return root
    .find(j.ExpressionStatement, {
      expression: {
        type: 'CallExpression',
        callee: {
          type: 'MemberExpression',
          object: { type: 'Identifier', name: 'window' },
          property: { type: 'Identifier', name: method },
        },
      },
    })
    .filter((path) => {
      const call = (path.node as { expression: { arguments?: unknown[] } }).expression
      const nameArg = (call.arguments ?? [])[0]
      return isStringLiteralWithValue(nameArg, TARGET_EVENT)
    })
    .paths()
}

/**
 * Match `return () => window.removeEventListener('tour-replay', _)` —
 * the canonical v1 useEffect-cleanup pattern that pairs with the
 * addEventListener we strip elsewhere.
 *
 * Handles both implicit-return arrows (`() => window.removeEventListener(...)`)
 * and block-body forms (`() => { window.removeEventListener(...) }`).
 * Without the block-body branch, Prettier/ESLint-expanded codebases would
 * keep a dangling no-op cleanup function after migration.
 */
function findReplayCleanupReturns(
  j: JSCodeshift,
  root: Collection
): ReturnType<Collection['paths']> {
  return (
    root
      .find(j.ReturnStatement)
      // biome-ignore lint/complexity/noExcessiveCognitiveComplexity: AST shape-matching is inherently branchy; the predicate stays readable as a flat chain of guards
      .filter((path) => {
        const arg = (
          path.node as { argument?: { type?: string; body?: unknown; params?: unknown[] } }
        ).argument
        if (!arg) return false
        if (arg.type !== 'ArrowFunctionExpression' && arg.type !== 'FunctionExpression')
          return false

        // Body can be a CallExpression (implicit-return arrow) OR a BlockStatement
        // wrapping exactly one ExpressionStatement whose expression is the call.
        const rawBody = arg.body as ASTNode & { type?: string } & Record<string, unknown>
        let callNode:
          | (ASTNode & { type?: string; callee?: unknown; arguments?: unknown[] })
          | null = null
        if (rawBody.type === 'CallExpression') {
          callNode = rawBody as unknown as typeof callNode
        } else if (rawBody.type === 'BlockStatement') {
          const stmts = (rawBody.body as ASTNode[] | undefined) ?? []
          if (stmts.length !== 1) return false
          const stmt = stmts[0] as { type?: string; expression?: ASTNode }
          if (stmt.type !== 'ExpressionStatement') return false
          const expr = stmt.expression as
            | (ASTNode & { type?: string; callee?: unknown; arguments?: unknown[] })
            | undefined
          if (!expr || expr.type !== 'CallExpression') return false
          callNode = expr
        }
        if (!callNode) return false

        const callee = callNode.callee as
          | {
              type?: string
              object?: { type?: string; name?: string }
              property?: { name?: string }
            }
          | undefined
        if (
          callee?.type !== 'MemberExpression' ||
          callee.object?.type !== 'Identifier' ||
          callee.object.name !== 'window' ||
          callee.property?.name !== 'removeEventListener'
        ) {
          return false
        }
        const callArgs = (callNode.arguments ?? []) as ASTNode[]
        return isStringLiteralWithValue(callArgs[0], TARGET_EVENT)
      })
      .paths()
  )
}

function addUseTourActionsImport(j: JSCodeshift, root: Collection): void {
  const existing = root.find(j.ImportDeclaration, {
    source: { value: TARGET_MODULE },
  })

  // Find an existing VALUE import we can merge into. Type-only imports
  // (`import type { ... } from '@tour-kit/core'`) cannot host a runtime value
  // specifier — TypeScript would strip `useTourActions` and the rewritten
  // dispatch would throw `useTourActions is not defined` at runtime.
  for (const path of existing.paths()) {
    const decl = path.node as {
      importKind?: 'type' | 'value'
      specifiers?: Array<{
        type?: string
        importKind?: 'type' | 'value'
        imported?: { name?: string } | Identifier
        local?: { name?: string }
      }>
    }
    if (decl.importKind === 'type') continue

    const specs = decl.specifiers ?? []
    const already = specs.some(
      (s) =>
        s.type === 'ImportSpecifier' &&
        (s.imported as { name?: string } | undefined)?.name === IMPORT_NAME
    )
    if (already) return
    specs.push(j.importSpecifier(j.identifier(IMPORT_NAME)) as unknown as (typeof specs)[number])
    decl.specifiers = specs
    return
  }

  // No mergeable value import found (either none at all, or only `import type`).
  // Synthesize a new value-import declaration at the top of the file.
  const decl = j.importDeclaration(
    [j.importSpecifier(j.identifier(IMPORT_NAME))],
    j.literal(TARGET_MODULE)
  )
  const program = root.get().node.program as { body: ASTNode[] }
  program.body.unshift(decl as unknown as ASTNode)
}

function attachLeadingTodo(node: ASTNode, message: string): void {
  const target = node as { comments?: unknown[] }
  const existing = (target.comments as unknown[] | undefined) ?? []
  target.comments = [
    ...existing,
    {
      type: 'CommentLine',
      value: ` TODO(tour-kit): ${message}`,
      leading: true,
      trailing: false,
    },
  ]
}
