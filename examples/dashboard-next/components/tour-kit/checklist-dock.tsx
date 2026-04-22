'use client'

import { useEffect } from 'react'
import { ChecklistLauncher, useChecklist } from '@tour-kit/checklists'

function ChecklistEventBridge() {
  const { completeTask } = useChecklist('get-started')

  useEffect(() => {
    const onProjectCreated = () => completeTask('create-project')
    const onInvite = () => completeTask('invite-teammate')
    const onCardMoved = () => completeTask('move-card')

    window.addEventListener('project:created', onProjectCreated)
    window.addEventListener('team:invite-sent', onInvite)
    window.addEventListener('kanban:card-moved', onCardMoved)

    return () => {
      window.removeEventListener('project:created', onProjectCreated)
      window.removeEventListener('team:invite-sent', onInvite)
      window.removeEventListener('kanban:card-moved', onCardMoved)
    }
  }, [completeTask])

  return null
}

export function ChecklistDock() {
  return (
    <>
      <ChecklistEventBridge />
      <ChecklistLauncher checklistId="get-started" position="bottom-right" />
    </>
  )
}
