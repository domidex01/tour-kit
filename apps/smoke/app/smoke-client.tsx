'use client'

import * as adoption from '@tour-kit/adoption'
import * as ai from '@tour-kit/ai'
import * as analytics from '@tour-kit/analytics'
import * as announcements from '@tour-kit/announcements'
import * as checklists from '@tour-kit/checklists'
import * as core from '@tour-kit/core'
import * as hints from '@tour-kit/hints'
import * as license from '@tour-kit/license'
import * as media from '@tour-kit/media'
import * as react from '@tour-kit/react'
import * as scheduling from '@tour-kit/scheduling'
import * as surveys from '@tour-kit/surveys'

const packages: Record<string, Record<string, unknown>> = {
  '@tour-kit/adoption': adoption,
  '@tour-kit/ai': ai,
  '@tour-kit/analytics': analytics,
  '@tour-kit/announcements': announcements,
  '@tour-kit/checklists': checklists,
  '@tour-kit/core': core,
  '@tour-kit/hints': hints,
  '@tour-kit/license': license,
  '@tour-kit/media': media,
  '@tour-kit/react': react,
  '@tour-kit/scheduling': scheduling,
  '@tour-kit/surveys': surveys,
}

export function SmokeClient() {
  return (
    <div id="smoke-root">
      <h2 style={{ fontSize: '1rem', margin: '0 0 0.5rem' }}>Loaded packages</h2>
      <table style={{ borderCollapse: 'collapse', width: '100%', maxWidth: 520 }}>
        <thead>
          <tr>
            <th style={th}>Package</th>
            <th style={th}>Named exports</th>
          </tr>
        </thead>
        <tbody>
          {Object.entries(packages).map(([name, mod]) => (
            <tr key={name}>
              <td style={td}>{name}</td>
              <td style={td}>{Object.keys(mod).length}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <p data-smoke-ok style={{ marginTop: '1rem', color: '#0a7a2f' }}>
        All 12 packages imported and providers mounted.
      </p>
    </div>
  )
}

const th: React.CSSProperties = {
  textAlign: 'left',
  borderBottom: '1px solid #ddd',
  padding: '0.35rem 0.5rem',
  fontSize: '0.85rem',
  color: '#444',
}
const td: React.CSSProperties = {
  borderBottom: '1px solid #eee',
  padding: '0.35rem 0.5rem',
  fontSize: '0.85rem',
}
