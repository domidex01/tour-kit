import { describe, expect, it, vi } from 'vitest'

// Mock sharp
vi.mock('sharp', () => {
  const composite = vi.fn().mockReturnThis()
  const png = vi.fn().mockReturnThis()
  const toBuffer = vi.fn().mockResolvedValue(Buffer.from('fake-png'))
  const resize = vi.fn().mockReturnValue({ composite, png, toBuffer })

  const sharpFn = vi.fn().mockReturnValue({ resize, composite, png, toBuffer })
  return { default: sharpFn }
})

// Mock fs
vi.mock('node:fs', async () => {
  const actual = await vi.importActual<typeof import('node:fs')>('node:fs')
  return {
    ...actual,
    default: {
      ...actual,
      existsSync: vi.fn((p: string) => {
        if (typeof p === 'string' && p.includes('og-backgrounds')) return true
        return actual.existsSync(p)
      }),
      readdirSync: vi.fn((p: string) => {
        if (typeof p === 'string' && p.includes('og-backgrounds')) {
          return ['coral-reef.png', 'pirate-ship.png', 'submarine.png']
        }
        return actual.readdirSync(p)
      }),
    },
  }
})

// Mock og-image compositor
vi.mock('@/lib/og-image', () => ({
  generateOGImage: vi.fn().mockResolvedValue(Buffer.from('fake-png-data')),
  listBackgrounds: vi.fn().mockReturnValue(['coral-reef', 'pirate-ship']),
}))

// Mock comparisons
vi.mock('@/lib/comparisons', () => ({
  getBlogPost: (slug: string) => {
    if (slug === 'best-product-tour-tools-react') {
      return {
        slug: 'best-product-tour-tools-react',
        title: '10 Best Product Tour Tools for React Developers (2026)',
        description: 'We tested 10 product tour tools for React.',
        category: 'Listicle',
      }
    }
    return undefined
  },
}))

describe('blog opengraph-image', () => {
  it('exports correct image metadata', async () => {
    const mod = await import('../opengraph-image')
    expect(mod.size).toEqual({ width: 1200, height: 630 })
    expect(mod.contentType).toBe('image/png')
    expect(mod.alt).toBe('userTourKit Blog')
  })

  it('returns a Response with PNG content type for known posts', async () => {
    const mod = await import('../opengraph-image')
    const result = await mod.default({
      params: Promise.resolve({ slug: 'best-product-tour-tools-react' }),
    })

    expect(result).toBeInstanceOf(Response)
    expect(result.headers.get('Content-Type')).toBe('image/png')
  })

  it('returns a Response for unknown slugs (fallback)', async () => {
    const mod = await import('../opengraph-image')
    const result = await mod.default({
      params: Promise.resolve({ slug: 'nonexistent-post' }),
    })

    expect(result).toBeInstanceOf(Response)
    expect(result.headers.get('Content-Type')).toBe('image/png')
  })
})
