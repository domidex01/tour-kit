import { useRef } from 'react'
import { TourStep } from '@tour-kit/react'

export function App() {
  const heroRef = useRef<HTMLDivElement>(null)
  return (
    <div>
      <div ref={heroRef} id="hero" />
      <TourStep id="s1" target="#hero" title="Hero" content="..." />
      <TourStep id="s2" target="#orphan" title="Orphan" content="..." />
    </div>
  )
}
