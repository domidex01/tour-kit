# Phase 7 — Gemini-Specific Optimization

**Duration:** Days 24–25 (~3.5h)
**Depends on:** Phase 2 (sitemap.ts, structured-data.tsx, robots.ts, JSON-LD on doc pages)
**Blocks:** Nothing
**Risk Level:** LOW — content-only changes to MDX frontmatter and structured data; no runtime code changes; Search Console submission is a manual one-time step
**Stack:** nextjs, typescript
**Runner:** Manual (content edits) + Google Search Console (external)

---

## 1. Objective + What Success Looks Like

Optimize Tour Kit documentation for Google Gemini's grounding feature and Google AI Studio. When a developer asks Gemini "How do I create a tour with Tour Kit?", Gemini should be able to ground its answer in the actual Tour Kit documentation — not hallucinate APIs.

**Success looks like:**

- Every MDX page has a unique, keyword-rich meta description of 120–160 characters that accurately summarizes the page content
- The top 10 most important pages have FAQ structured data (`FAQPage` JSON-LD schema) that surfaces in Google's Rich Results
- The sitemap (from Phase 2) is submitted to Google Search Console and indexing is verified
- In Google AI Studio, Gemini with grounding enabled correctly answers Tour Kit questions by citing tour-kit.dev documentation
- No duplicate descriptions across the 192 MDX pages — each is unique and specific to its content

---

## 2. Key Design Decisions

**D1: Meta descriptions are written in frontmatter, not generated.**
Each MDX page already has a `description` field in its frontmatter. This phase audits and rewrites them manually to be keyword-rich, unique, and under 160 characters. Auto-generation via LLM is tempting but would produce generic descriptions — hand-written descriptions are more precise and keyword-targeted for the Tour Kit domain.

**D2: FAQ structured data targets the 10 pages most likely to appear in Gemini grounding.**
The top 10 pages are selected based on: (a) common developer questions about onboarding libraries, (b) pages covering core concepts that Gemini would need to answer "How do I...?" questions, and (c) pages with high search intent keywords. These are:
1. Getting Started / Installation
2. Getting Started / Quick Start
3. Core / Hooks / useTour
4. Core / Hooks / useStep
5. React / Components / Tour
6. React / Components / TourCard
7. React / Headless / Overview
8. Guides / Accessibility
9. Hints / Overview
10. Examples / Basic Tour

**D3: FAQ questions mirror real developer queries, not documentation headings.**
FAQ questions are phrased as natural language questions a developer would ask an AI: "How do I install Tour Kit?", "What is the useTour hook?", "How do I make my tour accessible?". This aligns with how Gemini's grounding feature matches user queries to indexed content.

**D4: FAQ schema is added as a JSON-LD component in each MDX page, not in the layout.**
Phase 2 already adds `TechArticle` JSON-LD via the docs layout. FAQ schema is page-specific — each of the 10 pages gets its own `FAQPage` JSON-LD block. This is implemented by adding a `<FaqSchema>` component call in the MDX file itself, or by extending the frontmatter to include FAQ data that the layout picks up.

**D5: Description audit uses a systematic checklist, not ad-hoc edits.**
Every description is checked against these rules:
- 120–160 characters (Google truncates at ~160)
- Includes the primary keyword for the page (e.g., "useTour hook", "product tour", "onboarding checklist")
- Starts with an action verb or clear noun (not "This page..." or "Learn about...")
- Unique across all 192 pages — no two pages share the same description
- Accurately describes the page content (no clickbait)

### Data Model Strategy

| Concern | Approach |
|---------|----------|
| Meta descriptions | `description` field in MDX frontmatter, used by Fumadocs for `<meta name="description">` |
| FAQ structured data | `FAQPage` JSON-LD schema per Phase 2's `structured-data.tsx` pattern |
| FAQ questions | 3–5 natural-language Q&A pairs per page, answers are 1–2 sentences |
| Validation | Google Rich Results Test (https://search.google.com/test/rich-results) |
| Indexing verification | Google Search Console URL Inspection tool |
| Gemini grounding test | Google AI Studio with "Search as a tool" enabled |

---

## 3. Tasks

### 7.1: Audit and rewrite meta descriptions for all MDX pages (1.5h)

**Files:** All `content/docs/**/*.mdx` files (~192 pages)

Systematically review every MDX page's `description` frontmatter field. For each page:

1. Check if `description` exists — add one if missing
2. Check length — rewrite if over 160 or under 80 characters
3. Check keyword inclusion — ensure the primary topic keyword appears
4. Check uniqueness — no duplicates across the entire docs site
5. Check quality — rewrite vague descriptions ("Learn about X") to be specific ("Configure keyboard navigation and focus trapping for WCAG 2.1 AA compliant product tours")

**Audit script (optional helper):**

```typescript
// scripts/audit-descriptions.ts — run once to identify issues
import { globSync } from 'glob'
import matter from 'gray-matter'
import { readFileSync } from 'fs'

const files = globSync('content/docs/**/*.mdx')
const descriptions = new Map<string, string[]>()

for (const file of files) {
  const { data } = matter(readFileSync(file, 'utf-8'))
  const desc = data.description ?? ''

  // Check length
  if (desc.length === 0) console.warn(`MISSING: ${file}`)
  else if (desc.length > 160) console.warn(`TOO LONG (${desc.length}): ${file}`)
  else if (desc.length < 80) console.warn(`TOO SHORT (${desc.length}): ${file}`)

  // Track duplicates
  const existing = descriptions.get(desc) ?? []
  existing.push(file)
  descriptions.set(desc, existing)
}

// Report duplicates
for (const [desc, files] of descriptions) {
  if (files.length > 1) {
    console.warn(`DUPLICATE: "${desc}" in ${files.join(', ')}`)
  }
}
```

**Description writing guidelines:**

| Page type | Pattern | Example |
|-----------|---------|---------|
| Hook reference | "{HookName} hook: {what it does} in {context}" | "useTour hook: control tour state, navigation, and step transitions in React product tours" |
| Component reference | "{ComponentName}: {what it renders} with {key feature}" | "TourCard component: render step content with built-in navigation, progress indicators, and close controls" |
| Guide | "How to {action} with Tour Kit — {scope}" | "How to add keyboard navigation and focus trapping to product tours for WCAG 2.1 AA compliance" |
| Getting started | "{Action verb} Tour Kit {in what context}" | "Install Tour Kit in your React project with npm, pnpm, or yarn and configure TypeScript support" |
| Package overview | "{PackageName}: {purpose} for {use case}" | "@tour-kit/hints: add contextual hint beacons that highlight features and guide users to actions" |

### 7.2: Add FAQ structured data to top 10 pages (1h)

**Files:** 10 MDX files (listed in D2 above) + `apps/docs/lib/structured-data.tsx` (update)

**Step 1: Extend the structured data component (or create FAQ helper).**

Add a `FaqSchema` component or extend the existing `structured-data.tsx` from Phase 2:

```typescript
// In apps/docs/lib/structured-data.tsx (add to existing file)

interface FaqItem {
  question: string
  answer: string
}

interface FaqSchemaProps {
  items: FaqItem[]
}

export function FaqSchema({ items }: FaqSchemaProps) {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: items.map(item => ({
      '@type': 'Question',
      name: item.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: item.answer,
      },
    })),
  }

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  )
}
```

**Step 2: Add FAQ data to each of the 10 target pages.**

Either add FAQ directly in frontmatter (if Fumadocs supports custom frontmatter → JSON-LD pipeline) or add the `<FaqSchema>` component directly in the MDX body. The frontmatter approach is cleaner:

```yaml
# Option A: Frontmatter-based (preferred if layout supports it)
---
title: Installation
description: Install Tour Kit in your React project with npm, pnpm, or yarn and configure TypeScript support
faq:
  - q: "How do I install Tour Kit?"
    a: "Run npm install @tour-kit/core @tour-kit/react or use pnpm/yarn. Tour Kit requires React 18+ and TypeScript 4.7+."
  - q: "Does Tour Kit work with Next.js?"
    a: "Yes, Tour Kit works with Next.js App Router and Pages Router. Use the TourProvider in your layout or _app file."
  - q: "What are the peer dependencies for Tour Kit?"
    a: "Tour Kit requires react >= 18.0.0 and react-dom >= 18.0.0 as peer dependencies."
---
```

```tsx
// Option B: Inline component (if frontmatter pipeline is not set up)
import { FaqSchema } from '@/lib/structured-data'

<FaqSchema items={[
  {
    question: "How do I install Tour Kit?",
    answer: "Run npm install @tour-kit/core @tour-kit/react or use pnpm/yarn. Tour Kit requires React 18+ and TypeScript 4.7+."
  },
  {
    question: "Does Tour Kit work with Next.js?",
    answer: "Yes, Tour Kit works with Next.js App Router and Pages Router. Use the TourProvider in your layout or _app file."
  },
]} />
```

**FAQ content for each page (3–5 Q&A pairs each):**

| Page | Sample questions |
|------|----------------|
| Installation | "How do I install Tour Kit?", "Does Tour Kit work with Next.js?", "What are the peer dependencies?" |
| Quick Start | "How do I create my first product tour?", "What is the minimum code for a Tour Kit tour?" |
| useTour | "What does the useTour hook return?", "How do I programmatically start a tour?", "Can I have multiple tours on one page?" |
| useStep | "How do I access the current step data?", "How do I navigate between steps programmatically?" |
| Tour component | "How do I define tour steps?", "How do I customize the tour card appearance?" |
| TourCard | "What props does TourCard accept?", "How do I style the tour card?" |
| Headless overview | "What is headless mode in Tour Kit?", "How do I build a custom tour UI?" |
| Accessibility | "Is Tour Kit accessible?", "How does Tour Kit handle focus management?", "Does Tour Kit support screen readers?" |
| Hints overview | "What are hints in Tour Kit?", "How do I show a hint beacon on an element?" |
| Basic tour example | "How do I create a basic multi-step tour?", "How do I handle tour completion?" |

### 7.3: Submit sitemap to Google Search Console and verify indexing (0.5h)

**Manual steps (no code changes):**

1. Go to [Google Search Console](https://search.google.com/search-console)
2. Add property for `tour-kit.dev` (or the actual docs domain)
3. Verify ownership via DNS TXT record or HTML file upload
4. Navigate to Sitemaps → Add `https://tour-kit.dev/sitemap.xml`
5. Wait for Google to process (can take 24–48h for initial crawl)
6. Use URL Inspection tool to manually request indexing for the top 10 pages
7. Verify robots.txt is accessible at `https://tour-kit.dev/robots.txt`

**Verification checklist:**
- Sitemap status shows "Success" (or "Pending" — that is expected initially)
- URL Inspection shows "URL is on Google" for at least the homepage
- No coverage errors or warnings in the Index → Pages report
- robots.txt is parseable with no errors

### 7.4: Create Google AI Studio test — verify Gemini grounding (0.5h)

**Manual steps (no code changes):**

1. Open [Google AI Studio](https://aistudio.google.com/)
2. Create a new prompt with Gemini 1.5 Pro or Gemini 2.0
3. Enable "Search as a tool" (grounding) in the prompt settings
4. Test with these queries and document results:

| # | Query | Expected behavior |
|---|-------|------------------|
| 1 | "How do I create a product tour with Tour Kit?" | Cites tour-kit.dev, mentions `useTour` hook and `<Tour>` component |
| 2 | "What is the useTour hook in Tour Kit?" | Cites the useTour docs page, lists return values |
| 3 | "How do I install @tour-kit/react?" | Cites installation page, shows npm/pnpm commands |
| 4 | "Is Tour Kit accessible? Does it support WCAG?" | Cites accessibility guide, mentions focus trapping and ARIA |
| 5 | "How do I use Tour Kit with Next.js?" | Cites getting started or guides, mentions App Router support |

**Expected outcomes:**
- Gemini cites `tour-kit.dev` URLs in its grounding sources for at least 3/5 queries
- Answers are factually accurate based on actual Tour Kit APIs
- If grounding does not pick up Tour Kit docs yet (site too new), document this as a known gap — indexing takes time

**Document results in:** `plan/phase-7-gemini-test-results.md` (or inline notes)

---

## 4. Deliverables

```
content/docs/
├── getting-started/
│   ├── installation.mdx                # Updated: description + FAQ schema
│   └── quick-start.mdx                 # Updated: description + FAQ schema
├── core/hooks/
│   ├── use-tour.mdx                    # Updated: description + FAQ schema
│   └── use-step.mdx                    # Updated: description + FAQ schema
├── react/
│   ├── components/tour.mdx             # Updated: description + FAQ schema
│   ├── components/tour-card.mdx        # Updated: description + FAQ schema
│   └── headless/index.mdx              # Updated: description + FAQ schema
├── guides/
│   └── accessibility.mdx               # Updated: description + FAQ schema
├── hints/
│   └── index.mdx                       # Updated: description + FAQ schema
├── examples/
│   └── basic-tour.mdx                  # Updated: description + FAQ schema
└── **/*.mdx                            # Updated: all 192 pages with unique descriptions

apps/docs/
└── lib/
    └── structured-data.tsx             # Updated: FaqSchema component added

plan/
└── phase-7-gemini-test-results.md      # Gemini grounding test results (optional)
```

---

## 5. Exit Criteria

- [ ] All ~192 MDX pages have a `description` in frontmatter — none are missing
- [ ] All descriptions are between 80–160 characters
- [ ] All descriptions are unique — no two pages share the same description
- [ ] All descriptions include a relevant keyword for the page's topic
- [ ] 10 target pages have `FAQPage` JSON-LD structured data with 3–5 Q&A pairs each
- [ ] FAQ structured data validates in [Google Rich Results Test](https://search.google.com/test/rich-results) for all 10 pages
- [ ] Sitemap submitted to Google Search Console and status is "Success" or "Pending"
- [ ] Google Search Console shows no critical errors for `tour-kit.dev`
- [ ] Gemini grounding test completed and results documented — Gemini cites tour-kit.dev for at least 3/5 test queries (or gap documented if site is too new for indexing)

---

## 6. Execution Prompt

You are implementing Phase 7 (Gemini-Specific Optimization) of the Tour Kit LLM Discoverability project. This phase optimizes Tour Kit documentation for Google Gemini's grounding feature. You are working in the docs app at `apps/docs/` within a pnpm + Turborepo monorepo.

### Monorepo context
- Docs content: `apps/docs/content/docs/**/*.mdx` (~192 pages)
- Structured data component: `apps/docs/lib/structured-data.tsx` (from Phase 2)
- Sitemap: `apps/docs/app/sitemap.ts` (from Phase 2, serves `/sitemap.xml`)
- Robots: `apps/docs/app/robots.ts` (from Phase 2, allows GPTBot, ClaudeBot, Google-Extended)
- Build: `pnpm --filter docs build`

### Phase 2 dependency
Phase 2 created `structured-data.tsx` with `TechArticle` JSON-LD, `robots.ts`, and `sitemap.ts`. Your work extends the structured data component with `FAQPage` schema support. Do NOT modify the existing `TechArticle` schema — add `FaqSchema` as a new export alongside it.

### Task 7.1 — Meta description audit

Audit all ~192 MDX pages in `content/docs/`. For each page:
1. Ensure `description` exists in frontmatter
2. Rewrite if: missing, over 160 chars, under 80 chars, generic ("Learn about..."), or duplicate
3. Include the page's primary keyword (hook name, component name, concept)
4. Use active voice: "Configure X", "Build Y", "Add Z" — not "This page describes..."

Write an audit helper script at `apps/docs/scripts/audit-descriptions.ts` to identify issues before manual fixes. Run it with `npx tsx scripts/audit-descriptions.ts` from the docs directory.

### Task 7.2 — FAQ structured data

Add `FaqSchema` component to `apps/docs/lib/structured-data.tsx`:

```typescript
interface FaqItem {
  question: string
  answer: string
}

export function FaqSchema({ items }: { items: FaqItem[] }) {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: items.map(item => ({
      '@type': 'Question',
      name: item.question,
      acceptedAnswer: { '@type': 'Answer', text: item.answer },
    })),
  }
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  )
}
```

Add FAQ data to these 10 pages (3–5 Q&A pairs each, questions phrased as natural developer queries):
1. `content/docs/getting-started/installation.mdx`
2. `content/docs/getting-started/quick-start.mdx`
3. `content/docs/core/hooks/use-tour.mdx`
4. `content/docs/core/hooks/use-step.mdx`
5. `content/docs/react/components/tour.mdx`
6. `content/docs/react/components/tour-card.mdx`
7. `content/docs/react/headless/index.mdx`
8. `content/docs/guides/accessibility.mdx`
9. `content/docs/hints/index.mdx`
10. `content/docs/examples/basic-tour.mdx`

Use the `<FaqSchema>` component inline in each MDX file. Place it at the top of the MDX body, after the frontmatter.

### Task 7.3 + 7.4 — Manual steps

These are manual steps (Search Console submission, Gemini AI Studio testing). Document results in `plan/phase-7-gemini-test-results.md`.

### Constraints
- Do NOT modify existing `TechArticle` JSON-LD — add FAQ alongside it
- Do NOT change page slugs, titles, or navigation structure
- Do NOT auto-generate descriptions with an LLM — write them by hand for precision
- All FAQ answers must be factually accurate based on actual Tour Kit APIs
- Run `pnpm --filter docs build` after all changes to verify no build errors
- Validate FAQ schema on at least 3 pages using Google Rich Results Test

---

## Readiness Check

Before starting Phase 7, confirm:

- [ ] Phase 2 is complete — `apps/docs/lib/structured-data.tsx` exists with `TechArticle` JSON-LD
- [ ] Phase 2 is complete — `apps/docs/app/sitemap.ts` generates sitemap for all doc pages
- [ ] Phase 2 is complete — `apps/docs/app/robots.ts` allows Google-Extended, GPTBot, ClaudeBot
- [ ] All ~192 MDX pages exist in `content/docs/` with at least a `title` frontmatter field
- [ ] `pnpm --filter docs build` succeeds before starting
- [ ] Google Search Console access is available for the docs domain
- [ ] Google AI Studio access is available for grounding tests
