export interface TourKitTestingErrorOptions {
  cause?: unknown
  stepId?: string
  tourId?: string
}

export class TourKitTestingError extends Error {
  readonly stepId?: string
  readonly tourId?: string

  constructor(message: string, opts: TourKitTestingErrorOptions = {}) {
    super(message, { cause: opts.cause })
    this.name = 'TourKitTestingError'
    this.stepId = opts.stepId
    this.tourId = opts.tourId
    // Restore prototype chain across compiled targets (ES5 down-level safety).
    Object.setPrototypeOf(this, new.target.prototype)
  }
}
