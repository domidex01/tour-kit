import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { YouTubeEmbed } from '../components/embeds'
import { TourMedia } from '../components/tour-media'

const packageJson = JSON.parse(readFileSync(join(__dirname, '../../package.json'), 'utf8')) as {
  license?: string
  dependencies?: Record<string, string>
}

describe('@tour-kit/media license boundary', () => {
  it('is MIT and does not depend on @tour-kit/license', () => {
    expect(packageJson.license).toBe('MIT')
    expect(packageJson.dependencies).not.toHaveProperty('@tour-kit/license')
  })

  it('renders direct embeds without a license wrapper', () => {
    render(<YouTubeEmbed videoId="dQw4w9WgXcQ" title="Test Video" />)

    expect(screen.getByTitle('Test Video')).toBeInTheDocument()
    expect(screen.queryByTestId('license-watermark')).toBeNull()
  })

  it('renders routed embeds without a license wrapper', () => {
    render(<TourMedia src="https://www.youtube.com/watch?v=dQw4w9WgXcQ" alt="demo" />)

    expect(screen.getByTitle('demo')).toBeInTheDocument()
    expect(screen.queryByTestId('license-watermark')).toBeNull()
  })
})
