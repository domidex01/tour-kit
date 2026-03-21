import { expect, it } from 'vitest'
import { describeWithApiKey } from '../helpers/skip-conditions'

describeWithApiKey('Vector Search Spike — US-4', () => {
  it('returns top-3 semantically relevant results in < 200ms', async () => {
    const { embed, embedMany, cosineSimilarity } = await import('ai')
    const { openai } = await import('@ai-sdk/openai')

    const docs = [
      'Tour Kit is a headless onboarding library for React applications.',
      'Installation requires pnpm add @tour-kit/core @tour-kit/react.',
      'The analytics package supports plugin-based event tracking.',
      'WCAG 2.1 AA accessibility compliance is a core requirement.',
      'Keyboard navigation supports Escape to close and Tab for focus.',
    ]

    const embeddingModel = openai.embedding('text-embedding-3-small')

    const { embeddings } = await embedMany({ model: embeddingModel, values: docs })
    expect(embeddings).toHaveLength(docs.length)

    const query = 'How do I install the library?'
    const { embedding: queryEmbedding } = await embed({ model: embeddingModel, value: query })

    const startSearch = performance.now()
    const results = docs
      .map((doc, i) => ({
        document: doc,
        similarity: cosineSimilarity(queryEmbedding, embeddings[i]),
      }))
      .sort((a, b) => b.similarity - a.similarity)
      .slice(0, 3)
    const searchTime = performance.now() - startSearch

    // Search (excluding embedding API calls) should be < 200ms
    expect(searchTime).toBeLessThan(200)

    // All similarity scores in valid range
    for (const r of results) {
      expect(r.similarity).toBeGreaterThanOrEqual(-1)
      expect(r.similarity).toBeLessThanOrEqual(1)
    }

    // Top result should be the installation doc
    expect(results[0].document).toContain('install')
  }, 30_000)
})
