import { defineCollections, defineConfig, defineDocs, frontmatterSchema } from 'fumadocs-mdx/config'
import { z } from 'zod'

export const docs = defineDocs({
  dir: 'content/docs',
})

export const compare = defineCollections({
  type: 'doc',
  dir: 'content/compare',
  schema: frontmatterSchema.extend({
    competitor: z.string(),
    competitorSlug: z.string(),
    lastUpdated: z.string().optional(),
  }),
})

export const alternatives = defineCollections({
  type: 'doc',
  dir: 'content/alternatives',
  schema: frontmatterSchema.extend({
    competitor: z.string(),
    competitorSlug: z.string(),
    lastUpdated: z.string().optional(),
  }),
})

export const blog = defineCollections({
  type: 'doc',
  dir: 'content/blog',
  schema: frontmatterSchema.extend({
    category: z.string(),
    lastUpdated: z.string().optional(),
  }),
})

export default defineConfig({})
