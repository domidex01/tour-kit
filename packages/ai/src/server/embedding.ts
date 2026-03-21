import { embed, embedMany } from 'ai'
import type { EmbeddingAdapter } from '../types'

export interface AiSdkEmbeddingOptions {
  /** AI SDK embedding model — string ID or model instance */
  model: Parameters<typeof embed>[0]['model']
  /** Embedding dimensions (default: 1536) */
  dimensions?: number
}

export function createAiSdkEmbedding(options: AiSdkEmbeddingOptions): EmbeddingAdapter {
  const { model, dimensions = 1536 } = options
  const modelName = typeof model === 'string' ? model : model.modelId

  return {
    name: `ai-sdk:${modelName}`,
    dimensions,

    async embed(text: string): Promise<number[]> {
      const result = await embed({ model, value: text })
      return result.embedding
    },

    async embedMany(texts: string[]): Promise<number[][]> {
      const result = await embedMany({ model, values: texts })
      return result.embeddings
    },
  }
}
