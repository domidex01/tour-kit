import type { Tour } from '@tour-kit/core'

/**
 * Shared two-step demo tour for every fixture page.
 *
 * Targets `#a` and `#b` are sibling elements in each HTML — keeps the test
 * surface uniform across the three pages so the smoke spec asserts the
 * SAME tour behavior under different provider props (bridge-on / off /
 * diagnose-on).
 */
export const demoTour: Tour = {
  id: 'demo',
  steps: [
    {
      id: 'welcome',
      target: '#a',
      title: 'Welcome',
      content: 'Step A',
      placement: 'bottom',
    },
    {
      id: 'pricing',
      target: '#b',
      title: 'Pricing',
      content: 'Step B',
      placement: 'bottom',
    },
  ],
}
