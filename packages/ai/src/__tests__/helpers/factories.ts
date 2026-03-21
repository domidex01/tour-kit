import type { Document } from '../../types'

export function createTestDocument(overrides: Partial<Document> = {}): Document {
  return {
    id: 'doc-1',
    content: 'This is test document content about product features.',
    metadata: { source: 'test', title: 'Test Document' },
    ...overrides,
  }
}

export function createTestDocuments(count: number, prefix = 'doc'): Document[] {
  return Array.from({ length: count }, (_, i) => ({
    id: `${prefix}-${i}`,
    content: `Document ${i} content about topic ${i % 5}. This has enough text to be meaningful for chunking tests.`,
    metadata: { source: `source-${i}`, title: `Document ${i}`, tags: [`tag-${i % 3}`] },
  }))
}
