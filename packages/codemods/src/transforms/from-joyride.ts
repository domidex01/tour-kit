// jscodeshift transform — react-joyride → @tour-kit/react.
//
// Covers BOTH coexisting Joyride v2 APIs (per memory #181 — confirmed 2026-05-12):
//   - legacy `<Joyride .../>` JSX form
//   - modern `useJoyride({...})` hook form
//
// Approach: deterministic, mechanical rewrites only. We do NOT synthesize
// helper components, refactor callback dispatchers, or restructure the
// component tree. Every Joyride-only shape becomes a `// TODO:` comment
// pointing at a heading in `docs/migration/joyride.mdx` so the user can
// hand-port. A transform that mangles user code is worse than no transform.

import type { API, ASTPath, Collection, FileInfo, JSCodeshift } from 'jscodeshift'
import { type Todo, attachLeadingComments, emitTodo } from '../lib/todo-emitter'

export const parser = 'tsx'

const TARGET_MODULE = '@tour-kit/react'

interface JoyrideImports {
  defaultName: string | null
  named: Map<string, string>
  typeOnly: Set<string>
}

export default function transform(file: FileInfo, api: API): string {
  const j = api.jscodeshift
  const root = j(file.source)

  const joyrideImports = root.find(j.ImportDeclaration, {
    source: { value: 'react-joyride' },
  })
  if (joyrideImports.size() === 0) return file.source

  const imports = collectJoyrideImports(joyrideImports)

  let mutated = false
  if (imports.defaultName) {
    if (rewriteJoyrideJsx(j, root, imports.defaultName)) mutated = true
  }
  if (imports.named.has('useJoyride')) {
    const localName = imports.named.get('useJoyride') ?? 'useJoyride'
    if (rewriteUseJoyrideHook(j, root, localName)) mutated = true
  }

  rewriteJoyrideImport(j, joyrideImports, imports)

  return mutated || joyrideImports.size() > 0
    ? root.toSource({ quote: 'single', trailingComma: true })
    : file.source
}

// biome-ignore lint/complexity/noExcessiveCognitiveComplexity: walks every import spec on every react-joyride decl; one branch per AST node kind, not nested logic
function collectJoyrideImports(decls: Collection): JoyrideImports {
  const out: JoyrideImports = {
    defaultName: null,
    named: new Map(),
    typeOnly: new Set(),
  }
  for (const path of decls.paths()) {
    const specifiers = path.node.specifiers ?? []
    for (const spec of specifiers) {
      if (spec.type === 'ImportDefaultSpecifier' && spec.local) {
        out.defaultName = spec.local.name
      } else if (spec.type === 'ImportSpecifier') {
        const imported = spec.imported.name
        const local = spec.local?.name ?? imported
        out.named.set(imported, local)
        const importKind = (spec as { importKind?: string }).importKind
        if (importKind === 'type') out.typeOnly.add(imported)
      }
    }
    const declKind = (path.node as { importKind?: string }).importKind
    if (declKind === 'type') {
      for (const k of out.named.keys()) out.typeOnly.add(k)
    }
  }
  return out
}

// biome-ignore lint/complexity/noExcessiveCognitiveComplexity: import rewrite is inherently structural — keep, drop, add side decl branches in one place
function rewriteJoyrideImport(j: JSCodeshift, decls: Collection, imports: JoyrideImports): void {
  const hasUseJoyride = imports.named.has('useJoyride')
  const needsTourProvider = imports.defaultName !== null

  const droppedNamedImports = [...imports.named.keys()].filter((name) => name !== 'useJoyride')
  const dropTodos: Todo[] = droppedNamedImports.map((dropped) =>
    emitTodo(
      `Import '${dropped}' has no Tour Kit equivalent — remove this import and rework references`,
      dropped.toLowerCase()
    )
  )

  const paths = decls.paths()
  for (let idx = 0; idx < paths.length; idx += 1) {
    const path = paths[idx]
    if (idx > 0) {
      j(path).remove()
      continue
    }

    const newSpecifiers: ReturnType<typeof j.importSpecifier>[] = []
    if (needsTourProvider) {
      newSpecifiers.push(j.importSpecifier(j.identifier('TourProvider')))
    }
    if (hasUseJoyride) {
      const localName = imports.named.get('useJoyride') ?? 'useJoyride'
      newSpecifiers.push(
        j.importSpecifier(
          j.identifier('useTour'),
          localName === 'useJoyride' ? j.identifier('useTour') : j.identifier(localName)
        )
      )
    }

    path.node.source = j.literal(TARGET_MODULE)
    path.node.specifiers = newSpecifiers
    ;(path.node as { importKind?: string }).importKind = 'value'

    if (droppedNamedImports.length > 0) {
      const sideSpecifiers = droppedNamedImports.map((name) => {
        const spec = j.importSpecifier(j.identifier(name))
        if (imports.typeOnly.has(name)) {
          ;(spec as { importKind?: string }).importKind = 'type'
        }
        return spec
      })
      const sideImport = j.importDeclaration(sideSpecifiers, j.literal('react-joyride'))
      attachLeadingComments(sideImport, dropTodos)
      const parent = path.parent.node as { body: unknown[] }
      const at = parent.body.indexOf(path.node)
      if (at >= 0) parent.body.splice(at + 1, 0, sideImport)
    }
  }
}

function rewriteJoyrideJsx(j: JSCodeshift, root: Collection, joyrideLocalName: string): boolean {
  const elements = root.find(j.JSXElement, {
    openingElement: { name: { type: 'JSXIdentifier', name: joyrideLocalName } },
  })
  if (elements.size() === 0) return false

  for (const path of elements.paths()) {
    rewriteJoyrideJsxElement(j, path)
  }
  return true
}

function rewriteJoyrideJsxElement(j: JSCodeshift, path: ASTPath): void {
  const node = path.node as {
    openingElement: { attributes: unknown[]; name: unknown; selfClosing: boolean }
    closingElement: unknown
    children: unknown[]
  }

  const attrs = node.openingElement.attributes ?? []
  const todos: Todo[] = []
  let stepsExpression: unknown = null

  for (const attr of attrs) {
    const a = attr as { type: string; name?: { name?: string }; value?: unknown }
    if (a.type !== 'JSXAttribute') {
      todos.push(
        emitTodo('JSX spread attribute on <Joyride> — verify props after migration', 'jsx-spread')
      )
      continue
    }
    const name = a.name?.name
    if (!name) continue
    if (name === 'steps') {
      stepsExpression = extractAttrExpression(a.value)
      continue
    }
    todos.push(mapJoyrideJsxProp(name))
  }

  const newAttrs: unknown[] = [
    j.jsxAttribute(
      j.jsxIdentifier('tours'),
      j.jsxExpressionContainer(
        j.arrayExpression([
          j.objectExpression([
            j.property('init', j.identifier('id'), j.literal('migrated-tour')),
            stepsExpression
              ? j.property.from({
                  kind: 'init',
                  key: j.identifier('steps'),
                  value: stepsExpression as ReturnType<typeof j.identifier>,
                  shorthand: false,
                })
              : j.property('init', j.identifier('steps'), j.arrayExpression([])),
          ]),
        ])
      )
    ),
  ]

  const newOpening = j.jsxOpeningElement(
    j.jsxIdentifier('TourProvider'),
    newAttrs as ReturnType<typeof j.jsxAttribute>[],
    true
  )
  const newElement = j.jsxElement(newOpening, null, [])

  if (todos.length > 0) {
    attachLeadingComments(newElement, todos)
  }
  ;(path as ASTPath<typeof newElement>).replace(newElement)
}

const JSX_PROP_MAP: ReadonlyMap<string, { msg: string; anchor: string }> = new Map([
  [
    'stepIndex',
    {
      msg: '<Joyride stepIndex> — Tour Kit owns step index internally; use useTour().goTo()',
      anchor: 'step-index',
    },
  ],
  [
    'run',
    {
      msg: '<Joyride run> — Tour Kit is imperative; call useTour().start() from a descendant',
      anchor: 'run-prop',
    },
  ],
  [
    'callback',
    {
      msg: '<Joyride callback> splits into onTourEnd / onTourSkip / onStepAdvance',
      anchor: 'callback',
    },
  ],
  [
    'continuous',
    {
      msg: '<Joyride continuous> is the default in Tour Kit (no opt-in needed)',
      anchor: 'continuous',
    },
  ],
  [
    'showProgress',
    {
      msg: '<Joyride showProgress> → render <TourProgress /> inside <TourCard />',
      anchor: 'show-progress',
    },
  ],
  [
    'showSkipButton',
    {
      msg: '<Joyride showSkipButton> → render <TourClose /> inside <TourCard />',
      anchor: 'show-skip-button',
    },
  ],
])

function mapJoyrideJsxProp(name: string): Todo {
  const entry = JSX_PROP_MAP.get(name)
  if (entry) return emitTodo(entry.msg, entry.anchor)
  if (name === 'debug' || name === 'disableCloseOnEsc') {
    return emitTodo(
      `<Joyride ${name}> has no Tour Kit equivalent — drop or wire manually`,
      name.toLowerCase()
    )
  }
  return emitTodo(`<Joyride ${name}> unrecognized — verify after migration`, 'unknown-jsx-prop')
}

function extractAttrExpression(value: unknown): unknown {
  if (!value) return null
  const v = value as { type: string; expression?: unknown }
  if (v.type === 'JSXExpressionContainer') return v.expression
  if (v.type === 'Literal' || v.type === 'StringLiteral') return v
  return null
}

function rewriteUseJoyrideHook(j: JSCodeshift, root: Collection, localName: string): boolean {
  let mutated = false
  const usages = root.find(j.CallExpression, {
    callee: { type: 'Identifier', name: localName },
  })
  if (usages.size() === 0) return false

  const tourLocals = new Set<string>()

  for (const path of usages.paths()) {
    rewriteUseJoyrideCall(j, path, tourLocals)
    mutated = true
  }

  if (tourLocals.size > 0) {
    for (const tourName of tourLocals) {
      const tourEls = root.find(j.JSXElement, {
        openingElement: { name: { type: 'JSXIdentifier', name: tourName } },
      })
      for (const elPath of tourEls.paths()) {
        rewriteTourComponentUsage(j, elPath)
        mutated = true
      }
    }
  }

  return mutated
}

function rewriteUseJoyrideCall(j: JSCodeshift, path: ASTPath, tourLocals: Set<string>): void {
  const callNode = path.node as { callee: { name: string }; arguments: unknown[] }
  // Rewrite the call: useJoyride({...}) → useTour()
  callNode.callee = j.identifier('useTour') as unknown as { name: string }
  callNode.arguments = []

  const parent = path.parent.node as { type: string }
  if (parent.type !== 'VariableDeclarator') {
    // Standalone call (`useJoyride({steps})` as a statement) — leave the
    // useTour() rewrite; consumer drops it manually.
    return
  }

  const declarator = parent as {
    type: 'VariableDeclarator'
    id: { type: string; properties?: unknown[]; name?: string }
  }
  const idNode = declarator.id

  if (idNode.type !== 'ObjectPattern' || !idNode.properties) return

  const controlsAlias = extractControlsAlias(idNode.properties, tourLocals)
  ;(declarator as { id: unknown }).id = j.identifier(controlsAlias ?? '_useTour')

  const grandparent = path.parent.parent.node as { comments?: unknown[] }
  attachLeadingComments(grandparent as unknown as { comments?: unknown[] }, [
    emitTodo(
      'useJoyride() collapsed to useTour() — register the tour at a parent: <TourProvider tours={[{ id: "migrated-tour", steps }]}>',
      'use-joyride-hook'
    ),
    emitTodo(
      'Joyride controls.start/.next/.previous/.skip map to Tour Kit useTour() returns; verify each call site',
      'controls-api'
    ),
  ])
}

function extractControlsAlias(properties: unknown[], tourLocals: Set<string>): string | null {
  let controlsAlias: string | null = null
  for (const prop of properties) {
    const p = prop as {
      type: string
      key?: { name?: string }
      value?: { type?: string; name?: string }
    }
    if (p.type !== 'ObjectProperty' && p.type !== 'Property') continue
    const keyName = p.key?.name
    if (keyName === 'Tour') {
      const local = p.value?.name ?? 'Tour'
      if (p.value?.type === 'Identifier') tourLocals.add(local)
      continue
    }
    if (keyName === 'controls') {
      controlsAlias = p.value?.name ?? 'controls'
    }
  }
  return controlsAlias
}

function rewriteTourComponentUsage(j: JSCodeshift, path: ASTPath): void {
  const nullLiteral = j.nullLiteral()
  attachLeadingComments(nullLiteral, [
    emitTodo(
      '<Tour /> from useJoyride was rendered inline — Tour Kit renders via <TourProvider> + <TourCard /> in an ancestor',
      'tour-component'
    ),
  ])
  const parent = path.parent.node as { type: string }
  if (parent.type === 'JSXElement' || parent.type === 'JSXFragment') {
    const container = j.jsxExpressionContainer(nullLiteral)
    ;(path as ASTPath<unknown>).replace(container as unknown as never)
    return
  }
  ;(path as ASTPath<unknown>).replace(nullLiteral as unknown as never)
}

