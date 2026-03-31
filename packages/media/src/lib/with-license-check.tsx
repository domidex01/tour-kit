import type * as React from 'react'
import { ProWatermark } from './pro-watermark'

// biome-ignore lint/suspicious/noExplicitAny: HOC generic needs flexible constraint
export function withLicenseCheck<P extends Record<string, any>>(
  Component: React.ComponentType<P>,
  displayName: string
): React.FC<P> {
  const Wrapped: React.FC<P> = (props) => (
    <ProWatermark>
      <Component {...props} />
    </ProWatermark>
  )
  Wrapped.displayName = `Licensed(${displayName})`
  return Wrapped
}
