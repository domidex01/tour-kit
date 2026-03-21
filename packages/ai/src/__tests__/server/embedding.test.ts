import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createAiSdkEmbedding } from '../../server/embedding'

vi.mock('ai', () => ({
  embed: vi.fn(),
  embedMany: vi.fn(),
}))

import { embed, embedMany } from 'ai'

const mockEmbed = vi.mocked(embed)
const mockEmbedMany = vi.mocked(embedMany)

describe('createAiSdkEmbedding', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns an EmbeddingAdapter with correct name and dimensions', () => {
    const adapter = createAiSdkEmbedding({
      model: { modelId: 'text-embedding-3-small' } as Parameters<typeof embed>[0]['model'],
      dimensions: 256,
    })

    expect(adapter.name).toBe('ai-sdk:text-embedding-3-small')
    expect(adapter.dimensions).toBe(256)
  })

  it('calls ai.embed() and returns the embedding vector', async () => {
    const mockEmbedding = [0.1, 0.2, 0.3]
    mockEmbed.mockResolvedValue({ embedding: mockEmbedding } as Awaited<ReturnType<typeof embed>>)

    const adapter = createAiSdkEmbedding({
      model: { modelId: 'test-model' } as Parameters<typeof embed>[0]['model'],
    })

    const result = await adapter.embed('hello world')
    expect(result).toEqual(mockEmbedding)
    expect(mockEmbed).toHaveBeenCalledWith({
      model: expect.objectContaining({ modelId: 'test-model' }),
      value: 'hello world',
    })
  })

  it('calls ai.embedMany() and returns the embedding vectors', async () => {
    const mockEmbeddings = [
      [0.1, 0.2],
      [0.3, 0.4],
    ]
    mockEmbedMany.mockResolvedValue({ embeddings: mockEmbeddings } as Awaited<
      ReturnType<typeof embedMany>
    >)

    const adapter = createAiSdkEmbedding({
      model: { modelId: 'test-model' } as Parameters<typeof embed>[0]['model'],
    })

    const result = await adapter.embedMany(['text 1', 'text 2'])
    expect(result).toEqual(mockEmbeddings)
    expect(mockEmbedMany).toHaveBeenCalledWith({
      model: expect.objectContaining({ modelId: 'test-model' }),
      values: ['text 1', 'text 2'],
    })
  })

  it('uses default dimensions of 1536 when not specified', () => {
    const adapter = createAiSdkEmbedding({
      model: { modelId: 'test' } as Parameters<typeof embed>[0]['model'],
    })
    expect(adapter.dimensions).toBe(1536)
  })

  it('propagates errors from the embedding API', async () => {
    mockEmbed.mockRejectedValue(new Error('API rate limit exceeded'))

    const adapter = createAiSdkEmbedding({
      model: { modelId: 'test' } as Parameters<typeof embed>[0]['model'],
    })

    await expect(adapter.embed('test')).rejects.toThrow('API rate limit exceeded')
  })

  it('handles string model ID', () => {
    const adapter = createAiSdkEmbedding({
      model: 'openai/text-embedding-3-small' as Parameters<typeof embed>[0]['model'],
    })
    expect(adapter.name).toBe('ai-sdk:openai/text-embedding-3-small')
  })
})
