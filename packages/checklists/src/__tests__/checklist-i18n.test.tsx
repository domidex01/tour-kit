import { render, screen } from '@testing-library/react'
import { LocaleProvider } from '@tour-kit/core'
import type { ReactNode } from 'react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { ChecklistTask } from '../components/checklist-task'
import type { ChecklistTaskState } from '../types'

function makeTaskState(overrides: Partial<ChecklistTaskState['config']>): ChecklistTaskState {
  return {
    config: {
      id: overrides.id ?? 't1',
      title: overrides.title ?? 'Default title',
      description: overrides.description,
      ...overrides,
    },
    completed: false,
    locked: false,
    visible: true,
    active: false,
  }
}

function withLocale(opts: {
  messages?: Record<string, string>
  userContext?: Record<string, unknown>
  children: ReactNode
}): ReactNode {
  return (
    <LocaleProvider locale="en" messages={opts.messages ?? {}} userContext={opts.userContext}>
      {opts.children}
    </LocaleProvider>
  )
}

describe('checklists i18n widening', () => {
  it('resolves `{ key }` titles via LocaleProvider messages', () => {
    const task = makeTaskState({ id: 'profile', title: { key: 'task.profile' } })
    render(
      withLocale({
        messages: { 'task.profile': 'Complete profile' },
        children: <ChecklistTask task={task} />,
      })
    )
    expect(screen.getByText('Complete profile')).toBeInTheDocument()
  })

  it('interpolates `{{user.name}}` from LocaleProvider userContext on plain string templates', () => {
    const task = makeTaskState({
      id: 'hi',
      title: 'Hi {{user.name | there}}',
    })
    render(
      withLocale({
        userContext: { user: { name: 'Ada' } },
        children: <ChecklistTask task={task} />,
      })
    )
    expect(screen.getByText('Hi Ada')).toBeInTheDocument()
  })

  it('falls back to the inline default when userContext omits the var', () => {
    const task = makeTaskState({ id: 'fallback', title: 'Hi {{user.name | there}}' })
    render(withLocale({ userContext: {}, children: <ChecklistTask task={task} /> }))
    expect(screen.getByText('Hi there')).toBeInTheDocument()
  })

  it('renders plain strings without a LocaleProvider (graceful degradation)', () => {
    const task = makeTaskState({ id: 'plain', title: 'Plain title' })
    render(<ChecklistTask task={task} />)
    expect(screen.getByText('Plain title')).toBeInTheDocument()
  })

  describe('keyed text without LocaleProvider', () => {
    afterEach(() => {
      vi.unstubAllEnvs()
    })

    it('falls back to the key string in dev (Phase 1 contract)', () => {
      vi.stubEnv('NODE_ENV', 'development')
      const task = makeTaskState({ id: 'k', title: { key: 'task.profile' } })
      render(<ChecklistTask task={task} />)
      expect(screen.getByText('task.profile')).toBeInTheDocument()
    })

    it('falls back to empty string in production (Phase 1 contract)', () => {
      vi.stubEnv('NODE_ENV', 'production')
      const task = makeTaskState({
        id: 'k',
        title: { key: 'task.profile' },
        description: 'static fallback',
      })
      render(<ChecklistTask task={task} />)
      // Title resolves to empty string in prod when no provider/messages.
      expect(screen.queryByText('task.profile')).toBeNull()
      // The description still renders so the row isn't a ghost.
      expect(screen.getByText('static fallback')).toBeInTheDocument()
    })
  })

  it('resolves description LocalizedText alongside title', () => {
    const task = makeTaskState({
      id: 'desc',
      title: 'Static',
      description: { key: 'desc.profile' },
    })
    render(
      withLocale({
        messages: { 'desc.profile': 'Resolved description' },
        children: <ChecklistTask task={task} />,
      })
    )
    expect(screen.getByText('Resolved description')).toBeInTheDocument()
  })
})
