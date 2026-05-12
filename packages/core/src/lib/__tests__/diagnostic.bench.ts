import { bench, describe } from 'vitest'
import type { DiagnosticContext } from '../../types/diagnostic'
import type { Tour } from '../../types/tour'
import { explainTour } from '../diagnostic'

const tour: Tour = {
  id: 'demo',
  steps: Array.from({ length: 5 }, (_, i) => ({
    id: `s${i}`,
    target: '#stub',
    content: 'x',
  })),
}

const ctx: DiagnosticContext = {
  completedTours: [],
  skippedTours: [],
  targetResolver: () => ({ id: 'stub' }) as unknown as HTMLElement,
}

describe('explainTour bench', () => {
  bench(
    '5-step tour, no extensions',
    async () => {
      await explainTour(tour, ctx)
    },
    { iterations: 100 }
  )
})
