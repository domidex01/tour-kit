import { Providers } from './providers'
import { SmokeClient } from './smoke-client'

export const dynamic = 'force-dynamic'

export default function SmokePage() {
  return (
    <main>
      <h1 style={{ fontSize: '1.5rem', margin: '0 0 1rem' }}>@tour-kit smoke</h1>
      <p style={{ margin: '0 0 2rem', color: '#555' }}>
        Every published package is installed from npm and mounted below. A missing export, broken
        tarball, or runtime hook error breaks this page.
      </p>
      <Providers>
        <SmokeClient />
      </Providers>
    </main>
  )
}
