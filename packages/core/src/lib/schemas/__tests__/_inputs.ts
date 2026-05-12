/**
 * Shared input fixtures for schema tests. Used by `parse.test.ts`,
 * `parse.bench.test.ts`, and (later) Phase 7a's migration-doc examples.
 *
 * Each export is a typed `unknown` shape — the schema is what validates.
 */

export const validMinimal: unknown = {
  id: 'demo',
  steps: [{ id: 's1', target: '#a', content: 'hi' }],
}

export const validFull: unknown = {
  id: 'demo',
  steps: [
    { id: 's1', target: '#a', content: 'hi', placement: 'top', kind: 'visible' },
    { id: 's2', target: '#b', content: 'there', title: 'Step 2' },
  ],
  audience: { segment: 'admins' },
  autoStart: true,
  startAt: 0,
}

export const validWithConditionAudience: unknown = {
  id: 'demo',
  steps: [{ id: 's1', target: '#a', content: '' }],
  audience: [{ key: 'plan', operator: 'equals', value: 'pro' }],
}

export const validFiveSteps: unknown = {
  id: 'bench',
  steps: [
    { id: 's1', target: '#a', content: 'one', placement: 'top' },
    { id: 's2', target: '#b', content: 'two', placement: 'right' },
    { id: 's3', target: '#c', content: 'three', placement: 'bottom' },
    { id: 's4', target: '#d', content: 'four', placement: 'left', kind: 'visible' },
    { id: 's5', target: '#e', content: 'five', kind: 'hidden' },
  ],
  audience: [{ key: 'plan', operator: 'equals', value: 'pro' }],
  autoStart: true,
}

export const invalidEmptyId: unknown = { id: '', steps: [] }

export const invalidEmptySteps: unknown = { id: 't', steps: [] }

export const invalidRefTarget: unknown = {
  id: 't',
  steps: [{ id: 's', target: { current: null }, content: '' }],
}

export const invalidPlacement: unknown = {
  id: 't',
  steps: [{ id: 's', target: '#a', content: '', placement: 'invalid-direction' }],
}

export const invalidConditionOperator: unknown = {
  id: 't',
  steps: [{ id: 's', target: '#a', content: '' }],
  audience: [{ key: 'plan', operator: 'bogus', value: 'x' }],
}
