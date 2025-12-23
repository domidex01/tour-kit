import type {
  A11yConfig,
  KeyboardConfig,
  PersistenceConfig,
  ScrollConfig,
  SpotlightConfig,
} from './config'
import type { TourCallbackContext } from './state'
import type { TourStep } from './step'

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
  onStart?: (context: TourCallbackContext) => void
  onComplete?: (context: TourCallbackContext) => void
  onSkip?: (context: TourCallbackContext) => void
  onStepChange?: (step: TourStep, index: number, context: TourCallbackContext) => void
}

export type TourOptions = Omit<Tour, 'id' | 'steps'>
