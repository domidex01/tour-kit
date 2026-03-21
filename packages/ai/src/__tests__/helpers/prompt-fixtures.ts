import type { SystemPromptConfig } from '../../server/system-prompt'
import type { Document } from '../../types'

/** Minimal config — produces only Layer 1 defaults */
export const EMPTY_CONFIG: SystemPromptConfig = {}

/** Full config — all 3 layers active */
export const FULL_CONFIG: SystemPromptConfig = {
  productName: 'TestApp',
  productDescription: 'A testing application for automated tests.',
  tone: 'friendly',
  boundaries: ['Only answer about testing', 'Do not discuss pricing'],
  custom: 'Always be encouraging.',
  documents: [
    {
      id: 'doc-test-1',
      content: 'Guide to writing tests.',
      metadata: { source: 'docs', title: 'Testing Guide' },
    },
    {
      id: 'doc-test-2',
      content: 'FAQ about test coverage.',
      metadata: { source: 'faq', title: 'Coverage FAQ' },
    },
  ],
}

/** Override config — skips Layer 1 */
export const OVERRIDE_CONFIG: SystemPromptConfig = {
  override: true,
  productName: 'OverrideApp',
  custom: 'You are a custom assistant.',
}

/** Sample documents for document inlining tests */
export const SAMPLE_DOCUMENTS: Document[] = [
  { id: 'doc-1', content: 'First document content.' },
  {
    id: 'doc-2',
    content: 'Second document content.',
    metadata: { source: 'docs', title: 'Doc Two' },
  },
  {
    id: 'doc-3',
    content: 'Third document content.',
    metadata: { source: 'api', title: 'API Ref', tags: ['api', 'reference'] },
  },
]
