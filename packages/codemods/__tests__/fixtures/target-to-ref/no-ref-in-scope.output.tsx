import { TourStep } from '@tour-kit/react'

export function App() {
  return (
    <div>
      {/* TODO(tour-kit): target-to-ref — no matching useRef binding found; pass a RefObject<HTMLElement> or a () => HTMLElement getter */
      }<TourStep id="s1" target="#missing" title="Hi" content="There" />
    </div>
  );
}

