import type { Metadata } from 'next'
import { getDocsMetadata, renderDocsPage } from './_page-logic'

export default async function DocsRootPage() {
  return renderDocsPage(undefined)
}

export async function generateMetadata(): Promise<Metadata> {
  return getDocsMetadata(undefined)
}
