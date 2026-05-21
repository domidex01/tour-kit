// jscodeshift transform — best-effort `target="#foo"` → `target={fooRef}`.
//
// Phase 5 of v2-package-polish: the `target` prop on `<TourStep>` widened
// from `string | RefObject` to also accept `() => HTMLElement | null`. This
// codemod rewrites legacy selector-string call sites that already declare a
// matching `useRef` binding in the same file, and leaves a TODO comment when
// the right binding can't be located. It is intentionally conservative —
// false-positive rewrites cost more than a missed migration, since the
// resulting code still works under the widened union.
//
// Heuristic:
//   - Find JSX attributes named `target` whose value is a StringLiteral of
//     the shape `'#identifier'` (matches /^#[A-Za-z_][\w-]*$/).
//   - Look for a `const <name>Ref = useRef(...)` binding anywhere in the
//     same source file (any scope — files this small don't have shadowing
//     issues in practice).
//   - Match → rewrite the attribute to `target={<name>Ref}`.
//   - No match → attach a leading TODO comment via the shared todo-emitter
//     helper. The attribute itself is untouched.
//
// Idempotency:
//   - Attributes whose value is already a `JSXExpressionContainer` are
//     skipped (running the codemod twice on migrated code is a no-op).
//   - The TODO comment is only attached when the JSX opening element does
//     not already carry a `target-to-ref` TODO in its leading comments.

import type { API, ASTPath, FileInfo, JSCodeshift } from 'jscodeshift'

export const parser = 'tsx'

const SELECTOR_RE = /^#([A-Za-z_][\w-]*)$/
const TODO_MARKER = 'target-to-ref'
const TODO_TEXT =
  ' TODO(tour-kit): target-to-ref — no matching useRef binding found; pass a RefObject<HTMLElement> or a () => HTMLElement getter '

export default function transform(file: FileInfo, api: API): string {
  const j: JSCodeshift = api.jscodeshift
  const root = j(file.source)

  const refNames = collectUseRefNames(j, root)

  const attrs = root.find(j.JSXAttribute, {
    name: { type: 'JSXIdentifier', name: 'target' },
  })

  attrs.forEach((path) => {
    const node = path.node
    const value = node.value
    if (!value) return

    // Already migrated (target={someExpr}) — idempotent skip.
    if (value.type === 'JSXExpressionContainer') return

    const literal = readStringLiteralValue(value)
    if (literal === null) return

    const match = SELECTOR_RE.exec(literal)
    if (!match) {
      // Non-`#identifier` selector — leave alone (CSS combinators, data-cy,
      // etc. need manual review, but the codemod has no opinion here).
      return
    }
    const bareId = match[1]
    const candidate = `${bareId}Ref`

    if (refNames.has(candidate)) {
      node.value = j.jsxExpressionContainer(j.identifier(candidate))
      return
    }

    attachTodoIfNew(j, path)
  })

  return root.toSource({ quote: 'single', trailingComma: true })
}

// Collect every identifier bound to a `useRef(...)` call in the file. We
// match `const x = useRef(...)` and `const x = React.useRef(...)`. Loose by
// design — a `useRef` import alias survives the match because we read the
// binding name, not the callee identifier.
function collectUseRefNames(j: JSCodeshift, root: ReturnType<JSCodeshift>): Set<string> {
  const names = new Set<string>()
  root
    .find(j.VariableDeclarator, {
      init: { type: 'CallExpression' },
    })
    .forEach((path) => {
      const init = path.node.init as { type: string; callee?: unknown } | null
      if (!init || init.type !== 'CallExpression') return
      const callee = init.callee as
        | { type: 'Identifier'; name?: string }
        | { type: 'MemberExpression'; property?: { name?: string } }
        | undefined
      if (!callee) return
      let calleeName: string | undefined
      if (callee.type === 'Identifier') {
        calleeName = (callee as { name?: string }).name
      } else if (callee.type === 'MemberExpression') {
        calleeName = (callee as { property?: { name?: string } }).property?.name
      }
      if (calleeName !== 'useRef') return
      const id = path.node.id
      if (id.type === 'Identifier') {
        names.add(id.name)
      }
    })
  return names
}

function readStringLiteralValue(value: unknown): string | null {
  const v = value as { type?: string; value?: unknown; expression?: { type?: string; value?: unknown } } | null
  if (!v) return null
  if (v.type === 'StringLiteral' && typeof v.value === 'string') return v.value
  if (v.type === 'Literal' && typeof v.value === 'string') return v.value
  // Wrapped in {"..."} — JSXExpressionContainer holding a literal. We
  // intentionally do NOT rewrite this shape (already-expression form).
  return null
}

// Insert a JSX-safe block comment as a preceding sibling of the target
// JSXElement. Line comments (`// ...`) and bare block comments are not legal
// JSX-child grammar — they must be wrapped in `{/* ... */}` (i.e. a
// JSXExpressionContainer holding a JSXEmptyExpression whose `.comments`
// array carries a CommentBlock node).
function attachTodoIfNew(j: JSCodeshift, attrPath: ASTPath<unknown>): void {
  // attrPath: JSXAttribute → parent: JSXOpeningElement → parent: JSXElement.
  const openingPath = attrPath.parent
  if (!openingPath?.node) return
  const elementPath = openingPath.parent
  if (!elementPath?.node) return

  // Find the JSXElement's parent container (a JSXElement, JSXFragment, or
  // ArrowFunction/return statement). Inserting as a sibling requires the
  // parent to have a `children` array; otherwise we attach a leading line
  // comment on the JSXElement (recast renders it above the JS expression).
  const containerPath = elementPath.parent
  const containerNode = containerPath?.node as
    | { type?: string; children?: Array<unknown> }
    | undefined

  if (!containerNode || !Array.isArray(containerNode.children)) {
    // Top-level JSX (e.g. `return <TourStep target="#orphan" />`). There's no
    // JSX children array to splice a `{/* */}` sibling into, and bare line
    // comments aren't safe — recast would emit them between `return` and the
    // JSXElement, where ASI silently turns the return into an `undefined`
    // bail-out. Better to leave the attribute untouched and let the developer
    // notice the un-rewritten selector at PR review time.
    return
  }

  // Idempotency: don't re-insert if a TODO block comment already precedes
  // the element.
  const idx = containerNode.children.indexOf(elementPath.node as unknown)
  if (idx > 0) {
    const prev = containerNode.children[idx - 1] as
      | { type?: string; expression?: { comments?: Array<{ value?: string }> } }
      | undefined
    const prevComments = prev?.expression?.comments
    if (prevComments?.some((c) => typeof c.value === 'string' && c.value.includes(TODO_MARKER))) {
      return
    }
  }
  const emptyExpr = j.jsxEmptyExpression()
  ;(emptyExpr as { comments?: Array<unknown> }).comments = [
    {
      type: 'CommentBlock',
      value: TODO_TEXT,
      leading: true,
      trailing: false,
    },
  ]
  const todoNode = j.jsxExpressionContainer(emptyExpr)
  containerNode.children.splice(idx, 0, todoNode as unknown)
}
