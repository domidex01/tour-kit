import type { TourStep } from './step'
import type {
  KeyboardConfig,
  SpotlightConfig,
  PersistenceConfig,
  A11yConfig,
  ScrollConfig,
} from './config'
import type { TourContext } from './state'

/**
 * Tour definition
 */
export interface Tour {
  id: string
  steps: TourStep[]
  autoStart?: boolean
  startAt?: number
  keyboard?: KeyboardConfig | boolean
  spotlight?: SpotlightConfig | boolean
  persistence?: PersistenceConfig | boolean
  a11y?: A11yConfig
  scroll?: ScrollConfig
  onStart?: (context: TourContext) => void
  onComplete?: (context: TourContext) => void
  onSkip?: (context: TourContext) => void
  onStepChange?: (step: TourStep, index: number, context: TourContext) => void
}

export type TourOptions = Omit<Tour, 'id' | 'steps'>
