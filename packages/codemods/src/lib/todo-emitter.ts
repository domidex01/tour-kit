export interface Todo {
  message: string
  anchor: string
}

export function emitTodo(message: string, anchor: string): Todo {
  return { message, anchor }
}

export function todoToComment(t: Todo): string {
  return `// TODO: ${t.message} — see https://tourkit.dev/migration/joyride#${t.anchor}`
}
