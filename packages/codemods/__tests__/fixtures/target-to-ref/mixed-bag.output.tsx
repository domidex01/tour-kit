import { useRef } from 'react'
import { TourStep } from '@tour-kit/react'

export function App() {
  const heroRef = useRef<HTMLDivElement>(null)
  return (
    <div>
      <div ref={heroRef} id="hero" />
      <TourStep id="s1" target={heroRef} title="Hero" content="..." />
      {/* TODO(tour-kit): target-to-ref — no matching useRef binding found; pass a RefObject<HTMLElement> or a () => HTMLElement getter */
      }<TourStep id="s2" target="#orphan" title="Orphan" content="..." />
    </div>
  );
}

