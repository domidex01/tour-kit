import { useRef } from 'react'
import { TourStep } from '@tour-kit/react'

export function App() {
  const welcomeRef = useRef<HTMLDivElement>(null)
  return (
    <div ref={welcomeRef}>
      <TourStep id="s1" target={welcomeRef} title="Hi" content="There" />
    </div>
  );
}

