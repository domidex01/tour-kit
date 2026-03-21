import type { EmbeddingAdapter } from '../../types'

function simpleHash(text: string): number {
  let hash = 0
  for (let i = 0; i < text.length; i++) {
    const char = text.charCodeAt(i)
    hash = ((hash << 5) - hash + char) | 0
  }
  return hash
}

export function createMockEmbedding(): EmbeddingAdapter {
  return {
    name: 'mock-embedding',
    dimensions: 3,

    async embed(text: string): Promise<number[]> {
      const h = simpleHash(text)
      return [Math.sin(h), Math.cos(h), Math.sin(h * 2)]
    },

    async embedMany(texts: string[]): Promise<number[][]> {
      return Promise.all(texts.map((t) => this.embed(t)))
    },
  }
}
