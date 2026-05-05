import { render } from '@testing-library/react'
import { LocaleProvider, SegmentationProvider } from '@tour-kit/core'
import type { ReactNode } from 'react'
import { describe, expect, it } from 'vitest'
import { ChecklistTask } from '../components/checklist-task'
import type { ChecklistTaskState } from '../types'

function makeTaskState(overrides: Partial<ChecklistTaskState['config']>): ChecklistTaskState {
  return {
    config: {
      id: overrides.id ?? 't1',
      title: overrides.title ?? 'Task',
      description: overrides.description,
      media: overrides.media,
    },
    completed: false,
    locked: false,
    visible: true,
    active: false,
  }
}

function withProviders(children: ReactNode): ReactNode {
  return (
    <SegmentationProvider segments={{}} userContext={{}}>
      <LocaleProvider locale="en" messages={{}}>
        {children}
      </LocaleProvider>
    </SegmentationProvider>
  )
}

describe('ChecklistTask renders MediaSlot', () => {
  it('renders MediaSlot inside the task row when config.media is set (YouTube)', () => {
    const task = makeTaskState({
      id: 'yt',
      media: { src: 'https://youtu.be/dQw4w9WgXcQ', alt: 'demo' },
    })
    render(withProviders(<ChecklistTask task={task} />))
    expect(document.querySelector('[data-slot="checklist-task-media"]')).not.toBeNull()
    expect(document.querySelector('iframe')).not.toBeNull()
  })

  it('renders no media slot when config.media is omitted', () => {
    const task = makeTaskState({ id: 'plain' })
    render(withProviders(<ChecklistTask task={task} />))
    expect(document.querySelector('[data-slot="checklist-task-media"]')).toBeNull()
    expect(document.querySelector('iframe')).toBeNull()
  })

  it('respects an explicit type override (CDN URL with type="video")', () => {
    const task = makeTaskState({
      id: 'cdn',
      media: { src: 'https://my-cdn.example/v', type: 'video', alt: 'cdn' },
    })
    render(withProviders(<ChecklistTask task={task} />))
    expect(document.querySelector('video')).not.toBeNull()
  })
})
