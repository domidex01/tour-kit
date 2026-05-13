import type { ASTNode, JSCodeshift, ObjectExpression, ObjectProperty, Property } from 'jscodeshift'
import { type Todo, emitTodo } from './todo-emitter'

/**
 * Joyride `Step` shape, distilled to the fields Tour Kit understands plus the
 * Joyride-only fields we drop (and the function-target case we can't migrate).
 *
 * Returned by `mapStepObject`. Callers use this to decide what to emit:
 *  - `target`, `content`, `title`, `placement`, `id`, `data` → forwarded
 *  - `unsupportedFields` → field names dropped; warn the user in output
 *  - `todos` → comment lines to insert above/below the migrated step
 *  - `dropped` → properties to remove from the rewritten step literal
 */
export interface StepMapping {
  id?: string
  target: string
  content?: ASTNode
  title?: ASTNode
  placement?: string
  todos: Todo[]
  unsupportedFields: string[]
  dropped: string[]
}

/**
 * Joyride-only fields with no Tour Kit equivalent. Each emits a TODO with a
 * matching anchor in `apps/docs/content/docs/migration/joyride.mdx`.
 */
const UNSUPPORTED_FIELDS: Record<string, string> = {
  styles: 'styles',
  tooltipComponent: 'tooltip-component',
  beaconComponent: 'beacon-component',
  spotlightTarget: 'spotlight-target',
  scrollTarget: 'scroll-target',
  isFixed: 'is-fixed',
  portalElement: 'portal-element',
  spotlightClicks: 'spotlight-clicks',
  spotlightPadding: 'spotlight-padding',
  disableOverlay: 'disable-overlay',
  disableScrolling: 'disable-scrolling',
  hideCloseButton: 'hide-close-button',
  hideFooter: 'hide-footer',
  hideBackButton: 'hide-back-button',
  showProgress: 'show-progress',
  showSkipButton: 'show-skip-button',
  locale: 'locale',
}

/**
 * Beacon-like fields that are silent no-ops in Tour Kit (no default beacon).
 * We still emit a TODO so the user sees the no-op call site.
 */
const NOOP_FIELDS = new Set(['disableBeacon', 'skipBeacon'])

/**
 * Joyride placement values map cleanly to Tour Kit placements. `auto` and
 * `center` need explicit handling — see anchor `#placement`.
 */
const PLACEMENT_MAP: Record<string, string> = {
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
  center: 'top',
}

type PropLike = ObjectProperty | Property

function isPropLike(node: ASTNode): node is PropLike {
  return node.type === 'ObjectProperty' || node.type === 'Property'
}

function getKeyName(prop: PropLike): string | null {
  const key = prop.key
  if (!key) return null
  if (key.type === 'Identifier') return key.name
  if (key.type === 'Literal' && typeof key.value === 'string') return key.value
  if (key.type === 'StringLiteral') return key.value
  return null
}

function stringValueOf(prop: PropLike): string | undefined {
  const v = prop.value
  if (!v) return undefined
  if (v.type === 'Literal' && typeof v.value === 'string') return v.value
  if (v.type === 'StringLiteral') return v.value
  return undefined
}

// biome-ignore lint/complexity/noExcessiveCognitiveComplexity: dispatch on Joyride Step field names — splitting would add indirection without clarity
export function mapStepObject(_j: JSCodeshift, obj: ObjectExpression): StepMapping {
  const mapping: StepMapping = {
    target: '',
    todos: [],
    unsupportedFields: [],
    dropped: [],
  }

  for (const prop of obj.properties) {
    if (!isPropLike(prop)) continue
    const name = getKeyName(prop)
    if (!name) continue

    if (name === 'target') {
      mapTarget(prop, mapping)
      continue
    }
    if (name === 'content') {
      mapping.content = prop.value as ASTNode
      continue
    }
    if (name === 'title') {
      mapping.title = prop.value as ASTNode
      continue
    }
    if (name === 'placement') {
      mapPlacement(prop, mapping)
      continue
    }
    if (name === 'id') {
      mapping.id = stringValueOf(prop)
      continue
    }
    if (name === 'data') {
      // Joyride's `data` is passed through to callbacks; Tour Kit consumers
      // can stuff anything into step.data too. No-op pass-through.
      continue
    }
    if (NOOP_FIELDS.has(name)) {
      mapping.todos.push(
        emitTodo(`Step.${name} is a no-op in Tour Kit (no default beacon)`, 'beacon')
      )
      mapping.dropped.push(name)
      continue
    }
    if (name in UNSUPPORTED_FIELDS) {
      const anchor = UNSUPPORTED_FIELDS[name]
      mapping.unsupportedFields.push(name)
      mapping.todos.push(emitTodo(`Step.${name} → manual port`, anchor))
      mapping.dropped.push(name)
      continue
    }
    // Unknown Joyride field — preserve but flag.
    mapping.todos.push(
      emitTodo(`Step.${name} unrecognized — verify after migration`, 'unknown-step-field')
    )
  }

  return mapping
}

function mapTarget(prop: PropLike, mapping: StepMapping): void {
  const v = prop.value
  if (!v) {
    mapping.target = ''
    return
  }
  if (v.type === 'Literal' && typeof v.value === 'string') {
    mapping.target = v.value
    return
  }
  if (v.type === 'StringLiteral') {
    mapping.target = v.value
    return
  }
  if (v.type === 'ArrowFunctionExpression' || v.type === 'FunctionExpression') {
    mapping.todos.push(
      emitTodo(
        'Step.target as function — Tour Kit expects a selector string or DOM ref',
        'target-function'
      )
    )
    mapping.target = ''
    return
  }
  // Dynamic expression (Identifier, MemberExpression, etc.) — preserve and flag.
  mapping.todos.push(
    emitTodo(
      'Step.target dynamic expression — verify the selector resolves at runtime',
      'target-dynamic'
    )
  )
  mapping.target = ''
}

// biome-ignore lint/complexity/noExcessiveCognitiveComplexity: dispatch on placement literal — branches are intentional, not nested logic
function mapPlacement(prop: PropLike, mapping: StepMapping): void {
  const v = prop.value
  if (!v) return
  if (v.type === 'Literal' && typeof v.value === 'string') {
    const mapped = PLACEMENT_MAP[v.value]
    if (mapped) {
      mapping.placement = mapped
      if (v.value === 'auto' || v.value === 'center') {
        mapping.todos.push(
          emitTodo(
            `Step.placement '${v.value}' → '${mapped}' (Tour Kit has no '${v.value}'); review manually`,
            'placement'
          )
        )
      }
    } else {
      mapping.todos.push(
        emitTodo(`Step.placement '${v.value}' unrecognized — defaulting to 'top'`, 'placement')
      )
      mapping.placement = 'top'
    }
    return
  }
  if (v.type === 'StringLiteral') {
    const mapped = PLACEMENT_MAP[v.value]
    if (mapped) {
      mapping.placement = mapped
      if (v.value === 'auto' || v.value === 'center') {
        mapping.todos.push(
          emitTodo(
            `Step.placement '${v.value}' → '${mapped}' (Tour Kit has no '${v.value}'); review manually`,
            'placement'
          )
        )
      }
    } else {
      mapping.placement = 'top'
    }
    return
  }
  mapping.todos.push(
    emitTodo('Step.placement dynamic expression — verify after migration', 'placement')
  )
}
