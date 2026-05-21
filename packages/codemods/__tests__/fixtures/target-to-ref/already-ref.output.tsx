import { useRef } from 'react'
import { TourStep } from '@tour-kit/react'

export function App() {
  const someRef = useRef<HTMLDivElement>(null)
  return (
    <div>
      <TourStep id="s1" target={someRef} title="Hi" content="There" />
    </div>
  )
}

