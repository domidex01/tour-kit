export interface Document {
  id: string
  content: string
  metadata?: DocumentMetadata
}

export interface DocumentMetadata {
  source?: string
  title?: string
  tags?: string[]
  [key: string]: unknown
}

export interface RetrievedDocument extends Document {
  score: number
}
