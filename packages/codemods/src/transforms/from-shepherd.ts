// jscodeshift transform — shepherd.js → @tour-kit/react.
//
// Approach mirrors from-joyride: deterministic, mechanical rewrites only.
// Shepherd is class/imperative — `new Shepherd.Tour({...})` then a chain of
// `.addStep({...})` and a final `.start()`. We RECONSTITUTE the chain into a
// single `{ id, steps: [...] }` object literal, remove the addStep
// statements, and emit TODOs above each unsupported callsite. Every Shepherd-
// only shape becomes a `// TODO:` pointing at a heading in
// `apps/docs/content/docs/migration/shepherd.mdx`.

import type {
  API,
  ASTNode,
  ASTPath,
  Collection,
  FileInfo,
  JSCodeshift,
  ObjectExpression,
  ObjectProperty,
  Property,
} from 'jscodeshift'
import { type Todo, emitTodo, todoToComment } from '../lib/todo-emitter'

export const parser = 'tsx'

const TARGET_MODULE = '@tour-kit/react'
const SOURCE = 'shepherd' as const

type PropLike = ObjectProperty | Property

interface ShepherdImports {
  defaultName: string | null
  tourLocalName: string | null
}

export default function transform(file: FileInfo, api: API): string {
  const j = api.jscodeshift
  const root = j(file.source)

  const shepherdImports = root.find(j.ImportDeclaration, {
    source: { value: 'shepherd.js' },
  })
  if (shepherdImports.size() === 0) return file.source

  const imports = collectShepherdImports(shepherdImports)

  let mutated = false
  if (rewriteTourConstructors(j, root, imports)) mutated = true
  if (rewriteControlCalls(j, root)) mutated = true

  rewriteShepherdImport(j, shepherdImports)

  return mutated || shepherdImports.size() > 0
    ? root.toSource({ quote: 'single', trailingComma: true })
    : file.source
}

function collectShepherdImports(decls: Collection): ShepherdImports {
  const out: ShepherdImports = { defaultName: null, tourLocalName: null }
  for (const path of decls.paths()) {
    const specifiers = path.node.specifiers ?? []
    for (const spec of specifiers) {
      if (spec.type === 'ImportDefaultSpecifier' && spec.local) {
        out.defaultName = spec.local.name
      } else if (spec.type === 'ImportSpecifier' && spec.imported.name === 'Tour') {
        out.tourLocalName = spec.local?.name ?? 'Tour'
      }
    }
  }
  return out
}

function rewriteShepherdImport(j: JSCodeshift, decls: Collection): void {
  const paths = decls.paths()
  for (let idx = 0; idx < paths.length; idx += 1) {
    const path = paths[idx]
    if (idx > 0) {
      j(path).remove()
      continue
    }
    path.node.source = j.literal(TARGET_MODULE)
    path.node.specifiers = [j.importSpecifier(j.identifier('TourProvider'))]
    ;(path.node as { importKind?: string }).importKind = 'value'
  }
}

// Find `new Shepherd.Tour(...)` and `new Tour(...)` (named import). Each is
// expected to live inside a VariableDeclarator so we can rewrite the
// initializer in place; standalone `new` expressions get a TODO and a no-op
// replacement.
function rewriteTourConstructors(
  j: JSCodeshift,
  root: Collection,
  imports: ShepherdImports
): boolean {
  let mutated = false

  const matches: ASTPath[] = []
  root.find(j.NewExpression).forEach((path) => {
    if (isShepherdTourConstructor(path.node, imports)) matches.push(path)
  })
  if (matches.length === 0) return false

  for (const path of matches) {
    if (rewriteOneTourConstructor(j, root, path)) mutated = true
  }
  return mutated
}

function isShepherdTourConstructor(
  node: ASTNode,
  imports: ShepherdImports
): boolean {
  const ne = node as { type: string; callee?: unknown }
  if (ne.type !== 'NewExpression') return false
  const callee = ne.callee as { type?: string; name?: string; object?: { name?: string }; property?: { name?: string } }
  if (!callee) return false
  if (
    callee.type === 'MemberExpression' &&
    callee.property?.name === 'Tour' &&
    (imports.defaultName === null || callee.object?.name === imports.defaultName)
  ) {
    return true
  }
  if (
    callee.type === 'Identifier' &&
    imports.tourLocalName !== null &&
    callee.name === imports.tourLocalName
  ) {
    return true
  }
  return false
}

function rewriteOneTourConstructor(
  j: JSCodeshift,
  root: Collection,
  path: ASTPath
): boolean {
  const parent = path.parent.node as { type: string }
  if (parent.type !== 'VariableDeclarator') {
    // Standalone `new Shepherd.Tour({...})` — rare; replace with an object
    // literal scaffold + TODO.
    const replacement = j.objectExpression([
      j.property('init', j.identifier('id'), j.literal('migrated-tour')),
      j.property('init', j.identifier('steps'), j.arrayExpression([])),
    ])
    attachLeadingComments(replacement, [
      emitTodo(
        'Shepherd Tour constructed without a binding — gather addStep() calls into the steps array and register via <TourProvider>',
        'tour-constructor',
        SOURCE
      ),
    ])
    ;(path as ASTPath<unknown>).replace(replacement as unknown as never)
    return true
  }

  const declarator = parent as { id?: { type?: string; name?: string } }
  const tourVarName = declarator.id?.type === 'Identifier' ? declarator.id.name : null

  const steps = tourVarName ? collectAddStepCalls(j, root, tourVarName) : []
  const stepObjects = steps.map((s) => mapShepherdStep(j, s.objectArg, s.todoSink))
  const allTodos = collectStepTodos(steps)

  const replacement = j.objectExpression([
    j.property('init', j.identifier('id'), j.literal('migrated-tour')),
    j.property('init', j.identifier('steps'), j.arrayExpression(stepObjects)),
  ])

  const constructorTodos: Todo[] = [
    emitTodo(
      'Shepherd Tour constructed — register via <TourProvider tours={[migratedTour]}> in an ancestor and call useTour().start() to begin',
      'tour-constructor',
      SOURCE
    ),
    ...allTodos,
  ]
  attachLeadingComments(replacement, constructorTodos)

  ;(path as ASTPath<unknown>).replace(replacement as unknown as never)
  return true
}

interface AddStepCollected {
  objectArg: ObjectExpression | null
  todoSink: Todo[]
  path: ASTPath
}

function collectAddStepCalls(
  j: JSCodeshift,
  root: Collection,
  tourVarName: string
): AddStepCollected[] {
  const calls: AddStepCollected[] = []
  root
    .find(j.CallExpression, {
      callee: {
        type: 'MemberExpression',
        object: { type: 'Identifier', name: tourVarName },
        property: { name: 'addStep' },
      },
    })
    .forEach((path) => {
      const node = path.node as { arguments: unknown[] }
      const arg0 = node.arguments[0] as ASTNode | undefined
      const objectArg =
        arg0 && (arg0 as { type: string }).type === 'ObjectExpression'
          ? (arg0 as ObjectExpression)
          : null
      const todoSink: Todo[] = []
      if (!objectArg && arg0) {
        todoSink.push(
          emitTodo(
            'Shepherd .addStep() argument is not an inline object — port the step shape manually',
            'add-step-dynamic',
            SOURCE
          )
        )
      }
      calls.push({ objectArg, todoSink, path })

      // Replace the wrapping ExpressionStatement with a no-op so the array
      // captures the data and the tour.addStep(...) lines disappear.
      let stmtPath: ASTPath | null = path.parent
      while (stmtPath && (stmtPath.node as { type: string }).type !== 'ExpressionStatement') {
        stmtPath = stmtPath.parent
      }
      if (stmtPath) j(stmtPath).remove()
    })
  return calls
}

function collectStepTodos(steps: AddStepCollected[]): Todo[] {
  const todos: Todo[] = []
  for (const s of steps) {
    for (const t of s.todoSink) todos.push(t)
  }
  return todos
}

// Replace `tour.start()` / `.show()` / `.hide()` / `.cancel()` /
// `.complete()` / `.next()` / `.back()` with an EmptyStatement carrying a
// TODO comment. The tour object is now a plain literal — these methods would
// fail tsc otherwise.
const SHEPHERD_CONTROL_METHODS: ReadonlyMap<string, { anchor: string; msg: string }> = new Map([
  ['start', { anchor: 'start', msg: 'Shepherd tour.start() → call useTour().start() from a descendant of <TourProvider>' }],
  ['show', { anchor: 'control-flow', msg: 'Shepherd .show() → useTour().goTo(index) inside a descendant of <TourProvider>' }],
  ['hide', { anchor: 'control-flow', msg: 'Shepherd .hide() → useTour().stop() inside a descendant of <TourProvider>' }],
  ['cancel', { anchor: 'control-flow', msg: 'Shepherd .cancel() → useTour().skip() inside a descendant of <TourProvider>' }],
  ['complete', { anchor: 'control-flow', msg: 'Shepherd .complete() → useTour().complete() inside a descendant of <TourProvider>' }],
  ['next', { anchor: 'control-flow', msg: 'Shepherd .next() → useTour().next() inside a descendant of <TourProvider>' }],
  ['back', { anchor: 'control-flow', msg: 'Shepherd .back() → useTour().prev() inside a descendant of <TourProvider>' }],
])

function rewriteControlCalls(j: JSCodeshift, root: Collection): boolean {
  let mutated = false
  root
    .find(j.ExpressionStatement, {
      expression: {
        type: 'CallExpression',
        callee: { type: 'MemberExpression' },
      },
    })
    .forEach((path) => {
      const stmt = path.node as {
        expression: { type: string; callee?: { property?: { name?: string }; object?: { type?: string } } }
      }
      const callee = stmt.expression.callee
      if (!callee) return
      const methodName = callee.property?.name
      if (!methodName) return
      const entry = SHEPHERD_CONTROL_METHODS.get(methodName)
      if (!entry) return
      // Only rewrite if the object looks like an identifier reference. We
      // can't easily tell if it's the tour binding, so be conservative: only
      // when called on an Identifier whose object type is Identifier.
      if (callee.object?.type !== 'Identifier') return

      const empty = j.emptyStatement()
      attachLeadingComments(empty, [emitTodo(entry.msg, entry.anchor, SOURCE)])
      ;(path as ASTPath<unknown>).replace(empty as unknown as never)
      mutated = true
    })
  return mutated
}

// ----- Step shape mapping -----

const SHEPHERD_PLACEMENT_MAP: Record<string, string> = {
  top: 'top',
  bottom: 'bottom',
  left: 'left',
  right: 'right',
  'top-start': 'top-start',
  'top-end': 'top-end',
  'bottom-start': 'bottom-start',
  'bottom-end': 'bottom-end',
  'left-start': 'left-start',
  'left-end': 'left-end',
  'right-start': 'right-start',
  'right-end': 'right-end',
  auto: 'top',
}

const SHEPHERD_UNSUPPORTED_FIELDS: Record<string, { anchor: string; msg: string }> = {
  classes: { anchor: 'classes', msg: 'Step.classes — Tour Kit uses theme tokens; port via <ThemeProvider>' },
  modalOverlayOpeningClass: { anchor: 'modal-overlay-class', msg: 'Step.modalOverlayOpeningClass — configure via <TourOverlay /> slot' },
  modalOverlayOpeningPadding: { anchor: 'modal-overlay-padding', msg: 'Step.modalOverlayOpeningPadding — pass to the overlay slot' },
  canClickTarget: { anchor: 'can-click-target', msg: 'Step.canClickTarget → configure the overlay spotlight interactive flag manually' },
  scrollTo: { anchor: 'scroll-to', msg: 'Step.scrollTo — Tour Kit auto-scrolls; gate manually if you need a custom container' },
  scrollToHandler: { anchor: 'scroll-to', msg: 'Step.scrollToHandler — wire a custom scroll handler from a descendant' },
  highlightClass: { anchor: 'highlight-class', msg: 'Step.highlightClass — use theme tokens on the spotlight slot' },
  when: { anchor: 'when', msg: 'Step.when lifecycle hooks — port to onShow / onHide on the migrated step' },
  advanceOn: { anchor: 'advance-on', msg: 'Step.advanceOn — wire useTour().next() from your own event handler' },
  beforeShowPromise: { anchor: 'before-show-promise', msg: 'Step.beforeShowPromise — await before calling useTour().goTo() OR move to a custom onShow' },
  showOn: { anchor: 'show-on', msg: 'Step.showOn predicate — branch on useTour().currentStepIndex from a descendant' },
}

// Map a Shepherd step ObjectExpression to a Tour Kit step ObjectExpression.
// Returns a NEW object expression; collects TODOs into the supplied sink.
// biome-ignore lint/complexity/noExcessiveCognitiveComplexity: per-field dispatch — splitting hides the contract
function mapShepherdStep(
  j: JSCodeshift,
  step: ObjectExpression | null,
  todoSink: Todo[]
): ObjectExpression {
  if (!step) return j.objectExpression([])

  const out: Array<ObjectProperty | Property> = []
  let hasTarget = false

  for (const prop of step.properties) {
    if (!isPropLike(prop)) continue
    const name = getKeyName(prop)
    if (!name) continue

    if (name === 'id') {
      out.push(j.property('init', j.identifier('id'), prop.value as never))
      continue
    }
    if (name === 'attachTo') {
      const mapped = mapShepherdAttachTo(j, prop.value as ASTNode, todoSink)
      if (mapped.target) {
        out.push(j.property('init', j.identifier('target'), mapped.target as never))
        hasTarget = true
      }
      if (mapped.placement) {
        out.push(j.property('init', j.identifier('placement'), mapped.placement as never))
      }
      continue
    }
    if (name === 'text' || name === 'content') {
      out.push(j.property('init', j.identifier('content'), prop.value as never))
      continue
    }
    if (name === 'title') {
      out.push(j.property('init', j.identifier('title'), prop.value as never))
      continue
    }
    if (name === 'buttons') {
      mapShepherdButtons(prop.value as ASTNode, todoSink)
      continue
    }
    if (name in SHEPHERD_UNSUPPORTED_FIELDS) {
      const entry = SHEPHERD_UNSUPPORTED_FIELDS[name]
      todoSink.push(emitTodo(entry.msg, entry.anchor, SOURCE))
      continue
    }
    // Unknown field — preserve for visibility and flag.
    todoSink.push(
      emitTodo(`Step.${name} unrecognized — verify after migration`, 'unknown-step-field', SOURCE)
    )
  }

  if (!hasTarget) {
    todoSink.push(
      emitTodo(
        'Shepherd step had no resolvable attachTo.element — set Step.target to a CSS selector or DOM ref',
        'target',
        SOURCE
      )
    )
  }
  return j.objectExpression(out)
}

interface MappedAttachTo {
  target: ASTNode | null
  placement: ASTNode | null
}

function mapShepherdAttachTo(
  j: JSCodeshift,
  value: ASTNode,
  todoSink: Todo[]
): MappedAttachTo {
  const out: MappedAttachTo = { target: null, placement: null }
  if ((value as { type: string }).type !== 'ObjectExpression') {
    todoSink.push(
      emitTodo(
        'Shepherd Step.attachTo is dynamic — set target / placement manually',
        'attach-to-dynamic',
        SOURCE
      )
    )
    return out
  }
  const obj = value as ObjectExpression
  for (const prop of obj.properties) {
    if (!isPropLike(prop)) continue
    const name = getKeyName(prop)
    if (!name) continue
    if (name === 'element') {
      const v = prop.value as ASTNode | null
      if (!v) continue
      const t = (v as { type: string }).type
      if (t === 'Literal' || t === 'StringLiteral' || t === 'TemplateLiteral') {
        out.target = v
        continue
      }
      if (t === 'ArrowFunctionExpression' || t === 'FunctionExpression') {
        todoSink.push(
          emitTodo(
            'Shepherd Step.attachTo.element is a function — Tour Kit expects a selector string or DOM ref',
            'attach-to-element-function',
            SOURCE
          )
        )
        continue
      }
      // Identifier / MemberExpression — preserve as-is; consumer verifies.
      out.target = v
      continue
    }
    if (name === 'on') {
      const literal = readStringLiteral(prop.value as ASTNode)
      if (literal && SHEPHERD_PLACEMENT_MAP[literal]) {
        out.placement = j.literal(SHEPHERD_PLACEMENT_MAP[literal])
      } else if (literal) {
        todoSink.push(
          emitTodo(
            `Shepherd Step.attachTo.on '${literal}' unrecognized — defaulting to 'top'`,
            'placement',
            SOURCE
          )
        )
        out.placement = j.literal('top')
      }
      continue
    }
  }
  return out
}

function mapShepherdButtons(value: ASTNode, todoSink: Todo[]): void {
  if ((value as { type: string }).type !== 'ArrayExpression') {
    todoSink.push(
      emitTodo(
        'Shepherd Step.buttons is dynamic — wire useTour() controls from a descendant',
        'buttons',
        SOURCE
      )
    )
    return
  }
  todoSink.push(
    emitTodo(
      'Shepherd Step.buttons — Tour Kit fixed Next/Prev/Skip slots; wire custom button actions via <TourCard /> children',
      'buttons',
      SOURCE
    )
  )
}

// ----- helpers (local to keep step-mapper.ts pristine per spec rule) -----

function isPropLike(node: ASTNode): node is PropLike {
  return node.type === 'ObjectProperty' || node.type === 'Property'
}

function getKeyName(prop: PropLike): string | null {
  const key = prop.key
  if (!key) return null
  if (key.type === 'Identifier') return key.name
  return readStringLiteral(key)
}

function readStringLiteral(node: ASTNode | null | undefined): string | null {
  if (!node) return null
  if (node.type === 'Literal' && typeof (node as { value: unknown }).value === 'string') {
    return (node as { value: string }).value
  }
  if (node.type === 'StringLiteral') return (node as { value: string }).value
  return null
}

interface LineComment {
  type: 'CommentLine'
  value: string
  leading: true
  trailing: false
}

function makeLineComment(rawComment: string): LineComment {
  const stripped = rawComment.startsWith('//') ? rawComment.slice(2).trimStart() : rawComment
  return { type: 'CommentLine', value: ` ${stripped}`, leading: true, trailing: false }
}

function attachLeadingComments(node: unknown, todos: Todo[]): void {
  if (todos.length === 0) return
  const target = node as { comments?: unknown[] }
  const existing = (target.comments as unknown[] | undefined) ?? []
  const additions = todos.map((t) => makeLineComment(todoToComment(t)))
  target.comments = [...existing, ...additions]
}
