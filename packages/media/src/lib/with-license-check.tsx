import * as React from 'react'
import { ProWatermark } from './pro-watermark'

export function withLicenseCheck<P extends object>(
  Component: React.ComponentType<P>,
  displayName: string
): React.ComponentType<P> {
  const Wrapped = React.forwardRef<unknown, P>((props, ref) => (
    <div style={{ position: 'relative' }}>
      <Component {...(props as P & { ref: React.Ref<unknown> })} ref={ref} />
      <ProWatermark />
    </div>
  ))
  Wrapped.displayName = `Licensed(${displayName})`
  return Wrapped as unknown as React.ComponentType<P>
}
