// jscodeshift transform — driver.js → @tour-kit/react.
//
// Driver.js v1+ is the simplest of the three competitor APIs:
//   const d = driver({ steps: [{ element, popover: { title, description, side } }, ...] })
//   d.drive()
//
// Output reshape:
//   - `driver({...})` ObjectExpression argument is rewritten into a Tour Kit
//     tour shape `{ id: 'migrated-tour', steps: [{ target, title, content, placement }, ...] }`.
//   - The `driver(...)` CallExpression itself is replaced by the rewritten
//     ObjectExpression so the binding holds the migrated tour literal.
//   - `d.drive()` and other instance methods become EmptyStatement + leading
//     TODO so tsc doesn't choke calling methods that no longer exist.
//   - Import `'driver.js'` → `'@tour-kit/react'` as `{ TourProvider }`.

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
import { type Todo, attachLeadingComments, emitTodo } from '../lib/todo-emitter'

export const parser = 'tsx'

const TARGET_MODULE = '@tour-kit/react'
const SOURCE = 'driver' as const

type PropLike = ObjectProperty | Property

interface DriverImports {
  driverLocal: string | null
}

export default function transform(file: FileInfo, api: API): string {
  const j = api.jscodeshift
  const root = j(file.source)

  const driverImports = root.find(j.ImportDeclaration, {
    source: { value: 'driver.js' },
  })
  if (driverImports.size() === 0) return file.source

  const imports = collectDriverImports(driverImports)

  const driverVarNames = new Set<string>()
  if (imports.driverLocal) {
    rewriteDriverCalls(j, root, imports.driverLocal, driverVarNames)
  }
  rewriteDriverInstanceCalls(j, root, driverVarNames)

  rewriteDriverImport(j, driverImports)

  return root.toSource({ quote: 'single', trailingComma: true })
}

function collectDriverImports(decls: Collection): DriverImports {
  const out: DriverImports = { driverLocal: null }
  for (const path of decls.paths()) {
    const specifiers = path.node.specifiers ?? []
    for (const spec of specifiers) {
      if (spec.type === 'ImportSpecifier' && spec.imported.name === 'driver') {
        out.driverLocal = spec.local?.name ?? 'driver'
      }
    }
  }
  return out
}

function rewriteDriverImport(j: JSCodeshift, decls: Collection): void {
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

function rewriteDriverCalls(
  j: JSCodeshift,
  root: Collection,
  driverLocal: string,
  driverVarNames: Set<string>
): void {
  const driverCallPaths = root
    .find(j.CallExpression, {
      callee: { type: 'Identifier', name: driverLocal },
    })
    .paths()
  for (const path of driverCallPaths) {
    // Capture the local variable binding so we can rewrite `.drive()`-style
    // chains later.
    const parent = path.parent.node as { type: string; id?: { type?: string; name?: string } }
    if (
      parent.type === 'VariableDeclarator' &&
      parent.id?.type === 'Identifier' &&
      parent.id.name
    ) {
      driverVarNames.add(parent.id.name)
    }

    const node = path.node as { arguments: unknown[] }
    const arg0 = node.arguments[0] as ASTNode | undefined
    const todoSink: Todo[] = []
    const stepsArray = extractDriverSteps(j, arg0, todoSink)

    const replacement = j.objectExpression([
      j.property('init', j.identifier('id'), j.literal('migrated-tour')),
      j.property('init', j.identifier('steps'), stepsArray),
    ])

    const constructorTodos: Todo[] = [
      emitTodo(
        'driver.js config — register via <TourProvider tours={[migratedTour]}> in an ancestor; call useTour().start() to begin',
        'driver-call',
        SOURCE
      ),
      ...todoSink,
    ]
    attachLeadingComments(replacement, constructorTodos)
    ;(path as ASTPath<unknown>).replace(replacement as unknown as never)
  }
}

// driver.js instance methods that mutate tour state at runtime. After the
// rewrite, the binding holds a plain object, so calling these is a TypeError.
// Replace each statement with an EmptyStatement + leading TODO.
const DRIVER_CONTROL_METHODS: ReadonlyMap<string, { anchor: string; msg: string }> = new Map([
  [
    'drive',
    {
      anchor: 'drive',
      msg: 'driver.js .drive() → call useTour().start() from a descendant of <TourProvider>',
    },
  ],
  [
    'destroy',
    {
      anchor: 'control-flow',
      msg: 'driver.js .destroy() → useTour().stop() inside a descendant of <TourProvider>',
    },
  ],
  [
    'moveNext',
    {
      anchor: 'control-flow',
      msg: 'driver.js .moveNext() → useTour().next() inside a descendant of <TourProvider>',
    },
  ],
  [
    'movePrevious',
    {
      anchor: 'control-flow',
      msg: 'driver.js .movePrevious() → useTour().prev() inside a descendant of <TourProvider>',
    },
  ],
  [
    'moveTo',
    {
      anchor: 'control-flow',
      msg: 'driver.js .moveTo(index) → useTour().goTo(index) inside a descendant of <TourProvider>',
    },
  ],
  [
    'highlight',
    {
      anchor: 'highlight',
      msg: 'driver.js .highlight() — Tour Kit has no single-step highlight; render <HintHotspot> from @tour-kit/hints',
    },
  ],
])

function rewriteDriverInstanceCalls(
  j: JSCodeshift,
  root: Collection,
  driverVarNames: Set<string>
): void {
  const stmtPaths = root
    .find(j.ExpressionStatement, {
      expression: {
        type: 'CallExpression',
        callee: { type: 'MemberExpression' },
      },
    })
    .paths()
  for (const path of stmtPaths) {
    const stmt = path.node as {
      expression: {
        callee?: { property?: { name?: string }; object?: { type?: string; name?: string } }
      }
    }
    const callee = stmt.expression.callee
    if (!callee) continue
    const methodName = callee.property?.name
    if (!methodName) continue
    const entry = DRIVER_CONTROL_METHODS.get(methodName)
    if (!entry) continue
    // Fail closed: only rewrite when the receiver is a known driver(...)
    // binding. Method names like `.destroy()` / `.drive()` are common on
    // unrelated APIs so an unscoped rewrite would silently clobber user code.
    if (callee.object?.type !== 'Identifier') continue
    if (!driverVarNames.has(callee.object.name ?? '')) continue

    const empty = j.emptyStatement()
    attachLeadingComments(empty, [emitTodo(entry.msg, entry.anchor, SOURCE)])
    ;(path as ASTPath<unknown>).replace(empty as unknown as never)
  }
}

// ----- Step shape mapping -----

function extractDriverSteps(
  j: JSCodeshift,
  configArg: ASTNode | undefined,
  todoSink: Todo[]
): ReturnType<JSCodeshift['arrayExpression']> {
  if (!configArg || (configArg as { type: string }).type !== 'ObjectExpression') {
    todoSink.push(
      emitTodo(
        'driver.js config argument is dynamic — populate the migrated steps array manually',
        'driver-config-dynamic',
        SOURCE
      )
    )
    return j.arrayExpression([])
  }
  const config = configArg as ObjectExpression

  let stepsValue: ASTNode | null = null
  for (const prop of config.properties) {
    if (!isPropLike(prop)) continue
    const name = getKeyName(prop)
    if (!name) continue
    if (name === 'steps') {
      stepsValue = prop.value as ASTNode
      continue
    }
    const fieldEntry = DRIVER_TOUR_LEVEL_FIELDS[name]
    if (fieldEntry) {
      todoSink.push(emitTodo(fieldEntry.msg, fieldEntry.anchor, SOURCE))
      continue
    }
    todoSink.push(
      emitTodo(
        `driver.js config field '${name}' unrecognized — verify after migration`,
        'unknown-config-field',
        SOURCE
      )
    )
  }

  if (!stepsValue) {
    return j.arrayExpression([])
  }
  if ((stepsValue as { type: string }).type !== 'ArrayExpression') {
    todoSink.push(
      emitTodo(
        'driver.js config.steps is dynamic — populate the migrated steps array manually',
        'steps-dynamic',
        SOURCE
      )
    )
    return j.arrayExpression([])
  }
  const arr = stepsValue as { elements: Array<ASTNode | null> }
  const mapped = arr.elements.map((el) => {
    if (!el) return null
    if ((el as { type: string }).type !== 'ObjectExpression') {
      todoSink.push(
        emitTodo(
          'driver.js step is not an inline object — port the shape manually',
          'step-dynamic',
          SOURCE
        )
      )
      return el
    }
    return mapDriverStep(j, el as ObjectExpression, todoSink)
  })
  return j.arrayExpression(mapped as never[])
}

const DRIVER_TOUR_LEVEL_FIELDS: Record<string, { anchor: string; msg: string }> = {
  showProgress: {
    anchor: 'show-progress',
    msg: 'driver.js showProgress → render <TourProgress /> inside <TourCard />',
  },
  allowClose: {
    anchor: 'allow-close',
    msg: 'driver.js allowClose → omit / include <TourClose /> inside <TourCard />',
  },
  doneBtnText: {
    anchor: 'btn-text',
    msg: 'driver.js doneBtnText → pass labels to your <TourNavigation /> slot',
  },
  nextBtnText: {
    anchor: 'btn-text',
    msg: 'driver.js nextBtnText → pass labels to your <TourNavigation /> slot',
  },
  prevBtnText: {
    anchor: 'btn-text',
    msg: 'driver.js prevBtnText → pass labels to your <TourNavigation /> slot',
  },
  closeBtnText: {
    anchor: 'btn-text',
    msg: 'driver.js closeBtnText → pass labels to your <TourClose /> slot',
  },
  showButtons: {
    anchor: 'show-buttons',
    msg: 'driver.js showButtons[] → compose <TourCard /> with only the slots you need',
  },
  disableActiveInteraction: {
    anchor: 'disable-active-interaction',
    msg: 'driver.js disableActiveInteraction → configure the overlay spotlight interactive flag',
  },
  smoothScroll: {
    anchor: 'smooth-scroll',
    msg: 'driver.js smoothScroll → Tour Kit always scrolls; gate manually if you need otherwise',
  },
  animate: {
    anchor: 'animate',
    msg: 'driver.js animate → respects prefers-reduced-motion automatically; remove the flag',
  },
  stagePadding: {
    anchor: 'stage-padding',
    msg: 'driver.js stagePadding → pass `padding` to your <TourOverlay /> slot',
  },
  stageRadius: {
    anchor: 'stage-radius',
    msg: 'driver.js stageRadius → theme tokens via <ThemeProvider>',
  },
  overlayColor: {
    anchor: 'overlay-color',
    msg: 'driver.js overlayColor → theme tokens via <ThemeProvider>',
  },
  overlayOpacity: {
    anchor: 'overlay-opacity',
    msg: 'driver.js overlayOpacity → theme tokens via <ThemeProvider>',
  },
  onHighlightStarted: {
    anchor: 'on-highlight-started',
    msg: 'driver.js onHighlightStarted → onShow on the per-step handler',
  },
  onHighlighted: {
    anchor: 'on-highlighted',
    msg: 'driver.js onHighlighted → onShow on the per-step handler',
  },
  onDeselected: {
    anchor: 'on-deselected',
    msg: 'driver.js onDeselected → onHide on the per-step handler',
  },
  onPopoverRender: {
    anchor: 'on-popover-render',
    msg: 'driver.js onPopoverRender → render custom JSX in <TourCard /> children',
  },
  onNextClick: {
    anchor: 'on-next-click',
    msg: 'driver.js onNextClick → handle in your <TourNavigation /> slot',
  },
  onPrevClick: {
    anchor: 'on-prev-click',
    msg: 'driver.js onPrevClick → handle in your <TourNavigation /> slot',
  },
  onCloseClick: {
    anchor: 'on-close-click',
    msg: 'driver.js onCloseClick → handle in your <TourClose /> slot',
  },
  onDestroyStarted: {
    anchor: 'on-destroy-started',
    msg: 'driver.js onDestroyStarted → onSkip / onComplete on <TourProvider>',
  },
  onDestroyed: {
    anchor: 'on-destroyed',
    msg: 'driver.js onDestroyed → onSkip / onComplete on <TourProvider>',
  },
}

const DRIVER_PLACEMENT_MAP: Record<string, string> = {
  top: 'top',
  bottom: 'bottom',
  left: 'left',
  right: 'right',
  over: 'top',
}

const DRIVER_UNSUPPORTED_FIELDS: Record<string, { anchor: string; msg: string }> = {
  disableActiveInteraction: {
    anchor: 'disable-active-interaction',
    msg: 'Step.disableActiveInteraction → configure the overlay spotlight interactive flag',
  },
  popoverClass: {
    anchor: 'popover-class',
    msg: 'Step.popoverClass — theme tokens via <ThemeProvider>',
  },
}

// biome-ignore lint/complexity/noExcessiveCognitiveComplexity: per-field dispatch — splitting hides the contract
function mapDriverStep(j: JSCodeshift, step: ObjectExpression, todoSink: Todo[]): ObjectExpression {
  const out: Array<ObjectProperty | Property> = []
  let hasTarget = false

  for (const prop of step.properties) {
    if (!isPropLike(prop)) continue
    const name = getKeyName(prop)
    if (!name) continue

    if (name === 'element') {
      const v = prop.value as ASTNode | null
      if (!v) continue
      const t = (v as { type: string }).type
      if (t === 'Literal' || t === 'StringLiteral' || t === 'TemplateLiteral') {
        out.push(j.property('init', j.identifier('target'), v as never))
        hasTarget = true
        continue
      }
      if (t === 'ArrowFunctionExpression' || t === 'FunctionExpression') {
        todoSink.push(
          emitTodo(
            'driver.js Step.element is a function — Tour Kit expects a selector string or DOM ref',
            'element-function',
            SOURCE
          )
        )
        continue
      }
      // Identifier / MemberExpression / etc. — most commonly a captured DOM
      // Element instance. We can't tell statically; flag for review.
      todoSink.push(
        emitTodo(
          'driver.js Step.element is a DOM Element instance — Tour Kit expects a selector string or DOM ref',
          'element-dom',
          SOURCE
        )
      )
      out.push(j.property('init', j.identifier('target'), v as never))
      hasTarget = true
      continue
    }
    if (name === 'popover') {
      const popoverProps = mapDriverPopover(j, prop.value as ASTNode, todoSink)
      for (const pp of popoverProps) out.push(pp)
      continue
    }
    if (name === 'onHighlightStarted' || name === 'onHighlighted') {
      todoSink.push(
        emitTodo(
          `driver.js Step.${name} → onShow on the migrated step`,
          'on-highlight-started',
          SOURCE
        )
      )
      continue
    }
    if (name === 'onDeselected') {
      todoSink.push(
        emitTodo(
          'driver.js Step.onDeselected → onHide on the migrated step',
          'on-deselected',
          SOURCE
        )
      )
      continue
    }
    if (name in DRIVER_UNSUPPORTED_FIELDS) {
      const entry = DRIVER_UNSUPPORTED_FIELDS[name]
      todoSink.push(emitTodo(entry.msg, entry.anchor, SOURCE))
      continue
    }
    todoSink.push(
      emitTodo(`Step.${name} unrecognized — verify after migration`, 'unknown-step-field', SOURCE)
    )
  }

  if (!hasTarget) {
    todoSink.push(
      emitTodo(
        'driver.js step had no resolvable Step.element — set target to a CSS selector or DOM ref',
        'target',
        SOURCE
      )
    )
  }
  return j.objectExpression(out)
}

// driver.js popover fields with no shape-affecting migration — each emits a
// single TODO. Splitting these out keeps `mapDriverPopover` under the
// noExcessiveCognitiveComplexity threshold.
const POPOVER_TODO_FIELDS: Record<string, { anchor: string; msgFor: (name: string) => string }> = {
  align: {
    anchor: 'align',
    msgFor: () =>
      'driver.js popover.align → fold into Tour Kit placement (e.g. top-start, top-end)',
  },
  showButtons: { anchor: 'btn-text', msgFor: (n) => btnTextMsg(n) },
  doneBtnText: { anchor: 'btn-text', msgFor: (n) => btnTextMsg(n) },
  nextBtnText: { anchor: 'btn-text', msgFor: (n) => btnTextMsg(n) },
  prevBtnText: { anchor: 'btn-text', msgFor: (n) => btnTextMsg(n) },
  showProgress: { anchor: 'show-progress', msgFor: (n) => progressMsg(n) },
  progressText: { anchor: 'show-progress', msgFor: (n) => progressMsg(n) },
  popoverClass: {
    anchor: 'popover-class',
    msgFor: () => 'driver.js popover.popoverClass → theme tokens via <ThemeProvider>',
  },
  onPopoverRender: {
    anchor: 'on-popover-render',
    msgFor: () => 'driver.js popover.onPopoverRender → render custom JSX in <TourCard /> children',
  },
  onNextClick: { anchor: 'on-click', msgFor: (n) => onClickMsg(n) },
  onPrevClick: { anchor: 'on-click', msgFor: (n) => onClickMsg(n) },
  onCloseClick: { anchor: 'on-click', msgFor: (n) => onClickMsg(n) },
}

function btnTextMsg(name: string): string {
  return `driver.js popover.${name} → pass labels to your <TourNavigation /> slot or omit the slot`
}
function progressMsg(name: string): string {
  return `driver.js popover.${name} → render <TourProgress /> inside <TourCard />`
}
function onClickMsg(name: string): string {
  return `driver.js popover.${name} → handle in your <TourNavigation /> / <TourClose /> slot`
}

// biome-ignore lint/complexity/noExcessiveCognitiveComplexity: per-field dispatch — splitting the title/description/side branches hides the contract
function mapDriverPopover(
  j: JSCodeshift,
  value: ASTNode,
  todoSink: Todo[]
): Array<ObjectProperty | Property> {
  if ((value as { type: string }).type !== 'ObjectExpression') {
    todoSink.push(
      emitTodo(
        'driver.js Step.popover is dynamic — port title/content/placement manually',
        'popover-dynamic',
        SOURCE
      )
    )
    return []
  }
  const out: Array<ObjectProperty | Property> = []
  for (const prop of (value as ObjectExpression).properties) {
    if (!isPropLike(prop)) continue
    const name = getKeyName(prop)
    if (!name) continue

    if (name === 'title') {
      out.push(j.property('init', j.identifier('title'), prop.value as never))
      continue
    }
    if (name === 'description') {
      out.push(j.property('init', j.identifier('content'), prop.value as never))
      continue
    }
    if (name === 'side') {
      const placementProp = mapDriverPopoverSide(j, prop.value as ASTNode, todoSink)
      if (placementProp) out.push(placementProp)
      continue
    }
    const todoField = POPOVER_TODO_FIELDS[name]
    if (todoField) {
      todoSink.push(emitTodo(todoField.msgFor(name), todoField.anchor, SOURCE))
      continue
    }
    todoSink.push(
      emitTodo(
        `driver.js popover.${name} unrecognized — verify after migration`,
        'unknown-popover-field',
        SOURCE
      )
    )
  }
  return out
}

// Map `popover.side` to Tour Kit `placement`. Returns null for non-literal
// values; the consumer drops the slot rather than emitting a guess.
function mapDriverPopoverSide(
  j: JSCodeshift,
  value: ASTNode,
  todoSink: Todo[]
): ObjectProperty | Property | null {
  const literal = readStringLiteral(value)
  if (!literal) {
    todoSink.push(
      emitTodo('driver.js popover.side is dynamic — set placement manually', 'placement', SOURCE)
    )
    return null
  }
  const mapped = DRIVER_PLACEMENT_MAP[literal]
  if (mapped) {
    return j.property('init', j.identifier('placement'), j.literal(mapped) as never)
  }
  todoSink.push(
    emitTodo(
      `driver.js popover.side '${literal}' unrecognized — defaulting to 'top'`,
      'placement',
      SOURCE
    )
  )
  return j.property('init', j.identifier('placement'), j.literal('top') as never)
}

// ----- helpers -----

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
