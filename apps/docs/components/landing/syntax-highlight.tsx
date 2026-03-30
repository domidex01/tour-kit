import type { ReactNode } from 'react'

const colors = {
  keyword: '#c4a7e7',
  string: '#a8cc8c',
  comment: '#5c6370',
  component: '#89b4fa',
  tag: '#7fb4ca',
  attr: '#cba6f7',
  func: '#e2cca9',
  number: '#f5a97f',
  bracket: '#5a5a6e',
  plain: '#abb2bf',
}

type Token = { text: string; color: string }

const keywords = new Set([
  'import', 'export', 'from', 'const', 'let', 'var', 'function',
  'return', 'if', 'else', 'default', 'new', 'null', 'undefined',
  'true', 'false', 'typeof', 'void',
])

export function highlightCode(code: string): ReactNode[] {
  const lines = code.split('\n')
  const result: ReactNode[] = []

  for (let li = 0; li < lines.length; li++) {
    if (li > 0) result.push('\n')
    const line = lines[li]
    const tokens = tokenizeLine(line)
    for (let ti = 0; ti < tokens.length; ti++) {
      const t = tokens[ti]
      result.push(
        <span key={`${li}-${ti}`} style={{ color: t.color }}>
          {t.text}
        </span>
      )
    }
  }

  return result
}

function tokenizeLine(line: string): Token[] {
  const tokens: Token[] = []
  let i = 0

  while (i < line.length) {
    // Comments
    if (line[i] === '/' && line[i + 1] === '/') {
      tokens.push({ text: line.slice(i), color: colors.comment })
      return tokens
    }

    // Strings (single or double quotes, backticks)
    if (line[i] === "'" || line[i] === '"' || line[i] === '`') {
      const quote = line[i]
      let j = i + 1
      while (j < line.length && line[j] !== quote) {
        if (line[j] === '\\') j++
        j++
      }
      j++ // include closing quote
      tokens.push({ text: line.slice(i, j), color: colors.string })
      i = j
      continue
    }

    // Numbers
    if (/\d/.test(line[i]) && (i === 0 || /[\s=:{(,]/.test(line[i - 1]))) {
      let j = i
      while (j < line.length && /[\d.]/.test(line[j])) j++
      tokens.push({ text: line.slice(i, j), color: colors.number })
      i = j
      continue
    }

    // JSX components <Component or </Component
    if (line[i] === '<') {
      const closingSlash = line[i + 1] === '/' ? '/' : ''
      const nameStart = i + 1 + closingSlash.length

      // Check if it's a tag/component name
      if (nameStart < line.length && /[a-zA-Z]/.test(line[nameStart])) {
        let j = nameStart
        while (j < line.length && /[a-zA-Z0-9.]/.test(line[j])) j++
        const name = line.slice(nameStart, j)

        // Push < or </
        tokens.push({ text: '<' + closingSlash, color: colors.bracket })
        // Component (uppercase) vs HTML tag (lowercase)
        const isComponent = name[0] === name[0].toUpperCase() && /[a-z]/.test(name)
        tokens.push({ text: name, color: isComponent ? colors.component : colors.tag })
        i = j
        continue
      }

      // Self-closing /> or just >
      tokens.push({ text: line[i], color: colors.bracket })
      i++
      continue
    }

    // Closing brackets: />, >
    if (line[i] === '/' && line[i + 1] === '>') {
      tokens.push({ text: '/>', color: colors.bracket })
      i += 2
      continue
    }
    if (line[i] === '>') {
      tokens.push({ text: '>', color: colors.bracket })
      i++
      continue
    }

    // Words (identifiers, keywords)
    if (/[a-zA-Z_$]/.test(line[i])) {
      let j = i
      while (j < line.length && /[a-zA-Z0-9_$]/.test(line[j])) j++
      const word = line.slice(i, j)

      if (keywords.has(word)) {
        tokens.push({ text: word, color: colors.keyword })
      } else if (j < line.length && line[j] === '(') {
        // Function call
        tokens.push({ text: word, color: colors.func })
      } else if (j < line.length && line[j] === '=' && line[j + 1] !== '=') {
        // JSX attribute: word=
        tokens.push({ text: word, color: colors.attr })
      } else if (i > 0 && /\s/.test(line[i - 1]) && /[a-z]/.test(word[0]) && j < line.length && (line[j] === '=' || line[j] === ':')) {
        tokens.push({ text: word, color: colors.attr })
      } else {
        tokens.push({ text: word, color: colors.plain })
      }
      i = j
      continue
    }

    // Whitespace and other chars
    let j = i
    while (j < line.length && !/[a-zA-Z_$'"`<>\/\d]/.test(line[j])) j++
    if (j === i) j = i + 1
    tokens.push({ text: line.slice(i, j), color: colors.plain })
    i = j
  }

  return tokens
}
