export type TodoSource = 'joyride' | 'shepherd' | 'driver'

export interface Todo {
  message: string
  anchor: string
  source?: TodoSource
}

// Source defaults to 'joyride' so the Phase 7a transform keeps emitting the
// same URLs it always did — Shepherd/Driver pass an explicit source.
export function emitTodo(message: string, anchor: string, source: TodoSource = 'joyride'): Todo {
  return { message, anchor, source }
}

export function todoToComment(t: Todo): string {
  const src = t.source ?? 'joyride'
  return `// TODO: ${t.message} — see https://tourkit.dev/migration/${src}#${t.anchor}`
}
