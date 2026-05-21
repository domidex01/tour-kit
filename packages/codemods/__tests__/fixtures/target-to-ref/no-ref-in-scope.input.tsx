import { TourStep } from '@tour-kit/react'

export function App() {
  return (
    <div>
      <TourStep id="s1" target="#missing" title="Hi" content="There" />
    </div>
  )
}
