import { bench, describe } from 'vitest'
import { interpolate } from './interpolate'

const TEMPLATE_RE = /\{\{\s*([^}|]+?)\s*(?:\|\s*([^}]*?))?\s*\}\}/g
const filler = ' '.repeat(160)
const template = `Hi {{user.name | there}}, today is {{date}}. ${filler}`
const vars = { user: { name: 'Domi' }, date: '2026-05-04' }

describe('interpolate vs native String.replace', () => {
  bench(
    'interpolate(template, vars)',
    () => {
      interpolate(template, vars)
    },
    { iterations: 10_000 }
  )

  bench(
    'native template.replace baseline',
    () => {
      template.replace(TEMPLATE_RE, (_m, rawKey: string, rawFallback?: string) => {
        const path = rawKey.trim().split('.')
        let v: unknown = vars
        for (const k of path) {
          if (v && typeof v === 'object' && k in v) v = (v as Record<string, unknown>)[k]
          else {
            v = undefined
            break
          }
        }
        if (v != null) return String(v)
        if (rawFallback !== undefined) return rawFallback.trim()
        return ''
      })
    },
    { iterations: 10_000 }
  )
})
