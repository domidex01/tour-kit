import type { DocPage } from '../source-adapter.js'

interface SearchResult {
  page: DocPage
  score: number
  matchedFields: string[]
}

interface SearchOptions {
  query: string
  section?: string
  limit?: number
}

const WEIGHTS = {
  titleExact: 10,
  titlePartial: 5,
  description: 3,
  heading: 2,
  content: 1,
} as const

export class SearchIndex {
  private pages: DocPage[]

  constructor(pages: DocPage[]) {
    this.pages = pages
  }

  // biome-ignore lint/complexity/noExcessiveCognitiveComplexity: search scoring requires multiple conditional branches
  search({ query, section, limit = 10 }: SearchOptions): SearchResult[] {
    const normalizedQuery = query.toLowerCase().trim()
    const queryTerms = normalizedQuery.split(/\s+/)

    let candidates = this.pages
    if (section) {
      candidates = candidates.filter((p) => p.section === section)
    }

    const results: SearchResult[] = []

    for (const page of candidates) {
      let score = 0
      const matchedFields: string[] = []

      const titleLower = page.title.toLowerCase()
      const descLower = page.description.toLowerCase()
      const contentLower = page.content.toLowerCase()

      // Title exact match
      if (titleLower === normalizedQuery) {
        score += WEIGHTS.titleExact
        matchedFields.push('title:exact')
      }
      // Title partial match
      else if (queryTerms.every((term) => titleLower.includes(term))) {
        score += WEIGHTS.titlePartial
        matchedFields.push('title:partial')
      }

      // Description match
      if (queryTerms.some((term) => descLower.includes(term))) {
        score += WEIGHTS.description
        matchedFields.push('description')
      }

      // Heading match
      for (const heading of page.headings) {
        if (queryTerms.some((term) => heading.toLowerCase().includes(term))) {
          score += WEIGHTS.heading
          matchedFields.push('heading')
          break
        }
      }

      // Content match
      if (queryTerms.some((term) => contentLower.includes(term))) {
        score += WEIGHTS.content
        matchedFields.push('content')
      }

      if (score > 0) {
        results.push({ page, score, matchedFields })
      }
    }

    return results.sort((a, b) => b.score - a.score).slice(0, Math.min(limit, 50))
  }
}
