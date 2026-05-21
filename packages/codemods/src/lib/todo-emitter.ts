export type TodoSource = 'joyride' | 'shepherd' | 'driver' | 'target-to-ref'

export interface Todo {
  message: string
  anchor: string
  source?: TodoSource
}

// Source defaults to 'joyride' so the Phase 7a transform keeps emitting the
// same URLs it always did — Shepherd/Driver/target-to-ref pass an explicit source.
export function emitTodo(message: string, anchor: string, source: TodoSource = 'joyride'): Todo {
  return { message, anchor, source }
}

export function todoToComment(t: Todo): string {
  const src = t.source ?? 'joyride'
  // `target-to-ref` is an intra-repo refactor codemod, not a competitor
  // migration — there's no `/migration/target-to-ref` page on the docs site.
  // Phase 5 §5.3 specifies the prefix `TODO(tour-kit): target-to-ref` so
  // grepping after a migration finds the open todos.
  if (src === 'target-to-ref') {
    return `// TODO(tour-kit): target-to-ref — ${t.message}`
  }
  return `// TODO: ${t.message} — see https://tourkit.dev/migration/${src}#${t.anchor}`
}

export interface LineComment {
  type: 'CommentLine'
  value: string
  leading: true
  trailing: false
}

export function makeLineComment(rawComment: string): LineComment {
  const stripped = rawComment.startsWith('//') ? rawComment.slice(2).trimStart() : rawComment
  return { type: 'CommentLine', value: ` ${stripped}`, leading: true, trailing: false }
}

export function attachLeadingComments(node: unknown, todos: Todo[]): void {
  if (todos.length === 0) return
  const target = node as { comments?: unknown[] }
  const existing = (target.comments as unknown[] | undefined) ?? []
  const additions = todos.map((t) => makeLineComment(todoToComment(t)))
  target.comments = [...existing, ...additions]
}
