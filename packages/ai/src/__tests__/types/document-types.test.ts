import { describe, expectTypeOf, it } from 'vitest'
import type { Document, DocumentMetadata, RetrievedDocument } from '../../types/document'

describe('Document Types — US-5', () => {
  it('Document has id, content, and optional metadata', () => {
    expectTypeOf<Document>().toHaveProperty('id')
    expectTypeOf<Document['id']>().toBeString()
    expectTypeOf<Document>().toHaveProperty('content')
    expectTypeOf<Document['content']>().toBeString()
    expectTypeOf<Document>().toHaveProperty('metadata')
  })

  it('DocumentMetadata has optional source and title', () => {
    expectTypeOf<DocumentMetadata>().toHaveProperty('source')
    expectTypeOf<DocumentMetadata>().toHaveProperty('title')
  })

  it('RetrievedDocument extends Document with score', () => {
    expectTypeOf<RetrievedDocument>().toHaveProperty('score')
    expectTypeOf<RetrievedDocument['score']>().toBeNumber()
    expectTypeOf<RetrievedDocument>().toHaveProperty('id')
    expectTypeOf<RetrievedDocument>().toHaveProperty('content')
  })
})
