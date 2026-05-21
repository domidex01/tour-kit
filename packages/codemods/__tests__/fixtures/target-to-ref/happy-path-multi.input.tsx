import { useRef } from 'react'
import { TourStep } from '@tour-kit/react'

export function App() {
  const heroRef = useRef<HTMLDivElement>(null)
  const navRef = useRef<HTMLDivElement>(null)
  const footerRef = useRef<HTMLDivElement>(null)
  return (
    <div>
      <div ref={heroRef} id="hero" />
      <div ref={navRef} id="nav" />
      <div ref={footerRef} id="footer" />
      <TourStep id="s1" target="#hero" title="Hero" content="..." />
      <TourStep id="s2" target="#nav" title="Nav" content="..." />
      <TourStep id="s3" target="#footer" title="Footer" content="..." />
    </div>
  )
}
