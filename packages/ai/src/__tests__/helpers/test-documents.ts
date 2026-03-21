import type { Document } from '../../types/document'

export function createTestDocument(overrides: Partial<Document> = {}): Document {
  return {
    id: 'doc-1',
    content: 'Tour Kit is a headless onboarding library for React.',
    metadata: { source: 'test', title: 'Test Document' },
    ...overrides,
  }
}

export function createTestDocuments(count: number): Document[] {
  return Array.from({ length: count }, (_, i) =>
    createTestDocument({
      id: `doc-${i + 1}`,
      content: `Test document ${i + 1} content about topic ${i + 1}.`,
      metadata: { source: 'test', title: `Document ${i + 1}` },
    })
  )
}
