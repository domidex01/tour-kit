import { describe, expect, it } from 'vitest'
import { ZodError, z } from 'zod'
import {
  createTourStepDefinitionSchema,
  parseTourDefinition,
  safeParseTourDefinition,
} from '../parse'
import * as fx from './_inputs'

describe('parseTourDefinition — happy path', () => {
  it('parses minimal valid input', () => {
    const t = parseTourDefinition(fx.validMinimal)
    expect(t.id).toBe('demo')
    expect(t.steps).toHaveLength(1)
    expect(t.steps[0]?.target).toBe('#a')
  })

  it('parses full input with audience + autoStart + startAt', () => {
    const t = parseTourDefinition(fx.validFull)
    expect(t.audience).toEqual({ segment: 'admins' })
    expect(t.autoStart).toBe(true)
    expect(t.startAt).toBe(0)
    expect(t.steps[0]?.placement).toBe('top')
  })

  it('parses condition-array audience', () => {
    const t = parseTourDefinition(fx.validWithConditionAudience)
    expect(Array.isArray(t.audience)).toBe(true)
    const audience = t.audience as Array<{ operator: string }>
    expect(audience[0]?.operator).toBe('equals')
  })
})

describe('parseTourDefinition — failure modes (throws ZodError)', () => {
  it('rejects empty steps array', () => {
    expect(() => parseTourDefinition(fx.invalidEmptySteps)).toThrow(ZodError)
  })

  it('rejects empty step id', () => {
    expect(() =>
      parseTourDefinition({ id: 't', steps: [{ id: '', target: '#a', content: '' }] })
    ).toThrow(ZodError)
  })

  it('rejects ref-style target (object with .current)', () => {
    expect(() => parseTourDefinition(fx.invalidRefTarget)).toThrow(ZodError)
  })

  it('rejects invalid placement value', () => {
    expect(() => parseTourDefinition(fx.invalidPlacement)).toThrow(ZodError)
  })

  it('rejects invalid condition operator', () => {
    expect(() => parseTourDefinition(fx.invalidConditionOperator)).toThrow(ZodError)
  })

  it('rejects negative `startAt`', () => {
    expect(() =>
      parseTourDefinition({
        id: 't',
        steps: [{ id: 's', target: '#a', content: '' }],
        startAt: -1,
      })
    ).toThrow(ZodError)
  })

  it('rejects empty-string segment name', () => {
    expect(() =>
      parseTourDefinition({
        id: 't',
        steps: [{ id: 's', target: '#a', content: '' }],
        audience: { segment: '' },
      })
    ).toThrow(ZodError)
  })
})

describe('safeParseTourDefinition — tagged union shape', () => {
  it('returns { success: true, data } on valid input', () => {
    const r = safeParseTourDefinition(fx.validMinimal)
    expect(r.success).toBe(true)
    if (r.success) {
      expect(r.data.id).toBe('demo')
    }
  })

  it('returns { success: false, error: ZodError } on invalid input', () => {
    const r = safeParseTourDefinition(fx.invalidEmptyId)
    expect(r.success).toBe(false)
    if (!r.success) {
      expect(r.error).toBeInstanceOf(ZodError)
      expect(r.error.issues.length).toBeGreaterThan(0)
    }
  })
})

describe('createTourStepDefinitionSchema factory', () => {
  it('accepts content matching the custom contentSchema', () => {
    const customBlock = z.object({ kind: z.literal('text'), value: z.string() })
    const stepSchema = createTourStepDefinitionSchema({ contentSchema: customBlock })
    expect(() =>
      stepSchema.parse({
        id: 's',
        target: '#a',
        content: { kind: 'text', value: 'ok' },
      })
    ).not.toThrow()
  })

  it('rejects content that does NOT match the custom contentSchema', () => {
    const customBlock = z.object({ kind: z.literal('text'), value: z.string() })
    const stepSchema = createTourStepDefinitionSchema({ contentSchema: customBlock })
    expect(() =>
      stepSchema.parse({
        id: 's',
        target: '#a',
        content: 'plain-string-not-allowed-here',
      })
    ).toThrow(ZodError)
  })
})
