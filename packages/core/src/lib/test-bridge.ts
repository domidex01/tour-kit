/** v2 §1.3b — RED STUB for `attachTestBridge`. */
import type { EligibilityReport } from '../types/diagnostic'

export interface TestBridgeTarget {
  start(tourId: string): unknown
  next(): unknown
  prev(): unknown
  goToStep(stepId: string): unknown
  complete(): void
  skip(): void
  getDiagnostic?(tourId: string): EligibilityReport | null
}

export interface AttachTestBridgeOptions {
  /** `false` suppresses the non-production console warning. */
  warn?: boolean
}

export function attachTestBridge(
  _target: TestBridgeTarget,
  _options?: AttachTestBridgeOptions
): () => void {
  throw new Error('attachTestBridge: not implemented')
}
