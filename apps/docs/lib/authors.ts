export interface Author {
  name: string
  avatar: string
  url: string
  github: string
  linkedin?: string
  role: string
}

export const AUTHORS: Record<string, Author> = {
  domidex: {
    name: 'DomiDex',
    avatar: 'https://github.com/DomiDex.png',
    url: 'https://github.com/DomiDex',
    github: 'https://github.com/DomiDex',
    role: 'Creator of Tour Kit',
  },
}

export const DEFAULT_AUTHOR = AUTHORS.domidex
