/**
 * The shared proof tour — identical in the Svelte example.
 *
 * Designed so the Playwright lane exercises every advance-on case:
 *
 * | # | route       | target          | advanceOn                            | why                                              |
 * |---|-------------|-----------------|--------------------------------------|--------------------------------------------------|
 * | 1 | `/`         | `#start-here`   | click on `#start-here`               | the original hazard: one real click lands on 2   |
 * | 2 | `/settings` | `#theme-toggle` | click, NO selector — document-bound   | the mirror hazard + the card-button swallow      |
 * | 3 | `/settings` | `#save-button`  | none                                 | terminal                                          |
 *
 * Step 2 is deliberately in the MIDDLE: a document-bound step at the end makes
 * "advanced past it" unobservable. It is also deliberately a VISIBLE step —
 * `HiddenTourStep` declares `advanceOn?: never`.
 */
import type { Tour } from '@tour-kit/vue'

export const tours: Tour[] = [
  {
    id: 'proof',
    steps: [
      {
        id: 'start-here',
        target: '#start-here',
        title: 'Step one',
        content: 'Click this button and you should land on step two, not step three.',
        route: '/',
        advanceOn: { event: 'click', selector: '#start-here' },
      },
      {
        id: 'theme',
        target: '#theme-toggle',
        title: 'Step two',
        content: 'This step advances on a click anywhere. One click, one step.',
        route: '/settings',
        // No `selector`: `bindStepAdvance` falls back to `document`.
        advanceOn: { event: 'click' },
      },
      {
        id: 'save',
        target: '#save-button',
        title: 'Step three',
        content: 'Last step. Finish to complete the tour.',
        route: '/settings',
      },
    ],
  },
]
