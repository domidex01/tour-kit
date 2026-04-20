export interface Author {
  /** Display handle shown in bylines. */
  name: string
  /** Legal/real name for schema.org Person.name (E-E-A-T). Optional — falls back to `name`. */
  legalName?: string
  avatar: string
  /** Canonical author page URL on this site. */
  url: string
  github: string
  linkedin?: string
  /** Full X/Twitter profile URL (e.g. https://x.com/handle). */
  x?: string
  role: string
  /** schema.org Person.jobTitle. Shown by AI search engines on author cards. */
  jobTitle?: string
  /** schema.org Person.knowsAbout — topics the author demonstrably writes about. */
  knowsAbout?: string[]
}

export const AUTHOR_PERSON_ID = 'https://usertourkit.com/about#person'

export const AUTHORS: Record<string, Author> = {
  domidex: {
    name: 'DomiDex',
    legalName: 'Dominique Degottex',
    avatar: 'https://github.com/DomiDex.png',
    url: '/about',
    github: 'https://github.com/DomiDex',
    linkedin: 'https://www.linkedin.com/in/domidex/',
    x: 'https://x.com/domidexdesign',
    role: 'Creator of userTourKit',
    jobTitle: 'Software Engineer',
    knowsAbout: ['React', 'TypeScript', 'Product Tours', 'Developer Tools'],
  },
}

export const DEFAULT_AUTHOR = AUTHORS.domidex
