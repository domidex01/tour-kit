# Docs App

Fumadocs-powered documentation site.

## Content Structure

```
content/docs/
├── index.mdx              # Landing page
├── getting-started/       # Installation, quick start
├── core/                  # @tour-kit/core docs
│   ├── hooks/
│   ├── providers/
│   ├── types/
│   └── utilities/
├── react/                 # @tour-kit/react docs
│   ├── components/
│   ├── headless/
│   └── styling/
├── hints/                 # @tour-kit/hints docs
├── guides/                # Tutorials (Base UI, etc.)
├── examples/              # Code examples
└── api/                   # API reference
```

## MDX Conventions

### Frontmatter
```mdx
---
title: Component Name
description: One-line description
---
```

### Code Blocks
Use language hints for syntax highlighting:
```tsx
<Tour tourId="demo">
```

### Component Examples
Live examples should be in separate example files, imported into MDX.

## Gotchas

- **File naming**: Use kebab-case for MDX files
- **Meta files**: Each directory needs `meta.json` for navigation order
- **Internal links**: Use relative paths, Fumadocs handles routing

## Commands

```bash
pnpm --filter docs dev      # Start dev server
pnpm --filter docs build    # Build static site
```

## Related Files
- `.claude/agents/docs-writer.md` - Agent for writing documentation
- `../../wiki/design.md` - Pixel-accurate design reference for the docs website (tokens, sections, components, motion, known issues, reproduction checklist). Read before recreating, redesigning, or porting any landing or docs page.
- `./STYLEGUIDE.md` - Higher-level homepage styleguide (color palette, typography, component patterns); pairs with `wiki/design.md`.


<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->
