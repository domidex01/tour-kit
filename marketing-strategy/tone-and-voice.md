# TourKit Tone of Voice

## Core Voice Attributes

| We Are | We Are Not |
|--------|-----------|
| **Technical** but not academic | Code examples, not whitepapers |
| **Confident** but not arrogant | Know what we do well AND what we don't |
| **Direct** but not blunt | Get to the point without being cold |
| **Honest** but not self-deprecating | Acknowledge limitations without undermining trust |
| **Helpful** but not hand-holding | Explain "why" once, then show the code |

---

## 5 Voice Principles

1. **Technical credibility first.** Every claim backed by a code snippet, bundle size number, or source link. If we can't prove it, we don't say it.
2. **Direct and concise.** No filler. "Set up your first tour in three steps." not "In this section, we're going to walk you through the process..."
3. **Honest about tradeoffs.** "Tour-kit is built for React. If you use Vue or Svelte, this is not the right tool."
4. **Show, don't tell.** A 6-line code block > 3 paragraphs of feature descriptions.
5. **Respect developer time.** Structure everything for scanning: short paragraphs, code first, tables for comparisons.

---

## Channel-Specific Tone

### Documentation
- Imperative headings: "Configure keyboard navigation" not "How to configure..."
- One-sentence descriptions: what it does + when to use it
- "Pass" not "provide", "Returns" not "gives you back", "Call" not "invoke", "Fires" not "triggers"
- Present tense always. Callouts used sparingly.

### GitHub (README, Issues, PRs)
- Factual, scannable, code-heavy
- Issue responses: acknowledge, explain, give timeline/workaround. No over-apologizing.
- PR reviews: specific, point to the line, suggest the fix

### Twitter/X
- Casual-technical. Engineer at a meetup, not a brand account.
- 80% technical, 20% personality. Fine to be excited, never "game-changing."
- Max 0-2 hashtags. No emoji bullet points.

### Hacker News
- Write for a skeptical senior engineer. No superlatives, no exclamation marks.
- Lead with the problem. Mention tradeoffs before commenters do.
- Respond to criticism with facts and gratitude, never defensiveness.

### Reddit
- "I built X to solve Y" format. Say "I" not "we."
- Always disclose you're the maintainer. Include what the tool does NOT do.
- Respond to every comment, even critical ones.

### Product Hunt
- More storytelling. Lead with the "why" narrative.
- Tagline (60 chars max): "Headless product tours for React. Open source."

### Blog / Dev.to
- Tutorial tone: step-by-step, zero assumptions. Every code block runs.
- Announcement tone: ship notes. What changed, why, how to upgrade.
- Comparison tone: factual, fair, tables. Acknowledge where competitors are stronger.

---

## Words We Use

| Word | Why |
|------|-----|
| headless | Accurate architecture description |
| composable | Component-based API (preferred over "modular") |
| accessible | Specific and verifiable (WCAG 2.1 AA) |
| type-safe | Backed by TypeScript strict mode |
| lightweight | Only when followed by a number: "lightweight (~5KB gzipped)" |
| works with | Factual, no promise of perfection |
| you own the UI | Describes the headless model |
| hooks-only | Describes the core package |

## Words We NEVER Use

| Banned | Use Instead |
|--------|-------------|
| revolutionary, game-changing | Describe what it does differently |
| best-in-class, world-class | Cite a specific metric |
| seamless | "works with" or describe integration steps |
| robust | "handles [specific edge case]" |
| cutting-edge, leverage, synergy | Name the actual technique / "use" |
| 10x, blazingly fast | Show a benchmark |
| unlock, supercharge, empower | "adds", "enables", "lets you" |
| delightful | Let users decide |

---

## Emoji Rules

| Channel | Rule |
|---------|------|
| Docs | No emojis. Ever. |
| GitHub README | No emojis in prose. Badges fine. |
| GitHub Issues/PRs | No emojis in descriptions. Reactions fine. |
| Twitter/X | Max 1, only if it genuinely adds meaning. Never as bullets. |
| Product Hunt | Sparingly acceptable. |
| Blog posts | No. |

---

## Competitor References

**Pattern:** "If you need [X], [competitor] is a good choice. tour-kit focuses on [Y]."

Never:
- "[Competitor] is bloated and outdated."
- "We're the only library that does [X]."
- "Unlike [competitor], tour-kit actually works."

---

## Writing Checklist

- [ ] Can I remove a sentence without losing meaning?
- [ ] Is there a code example where I'm using prose?
- [ ] Did I use any banned words?
- [ ] Am I making a claim without evidence?
- [ ] Would a senior engineer be embarrassed reading this?
- [ ] Could someone scanning for 15 seconds get the key info?
- [ ] Is the tone right for the channel?
- [ ] Did I check for emojis?
- [ ] If mentioning a competitor, am I being fair?
