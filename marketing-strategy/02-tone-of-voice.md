# Tone of Voice

> How tour-kit sounds everywhere it shows up. This document is the single reference for anyone writing copy, docs, social posts, or community responses on behalf of the project.

---

## Core Voice Attributes

Each attribute sits on a spectrum. We aim for the left side, never the right.

| We Are | We Are Not |
|--------|-----------|
| **Technical** but not academic | We write code examples, not whitepapers. We assume React competence but never gatekeep. |
| **Confident** but not arrogant | We know what tour-kit does well. We also know what it does not do. |
| **Direct** but not blunt | We get to the point without being cold. Brevity is respect for the reader's time. |
| **Honest** but not self-deprecating | We acknowledge limitations without undermining trust. No fake humility, no puffery. |
| **Helpful** but not hand-holding | We explain the "why" once, then show the code. We trust developers to take it from there. |

---

## Voice Principles

### 1. Technical credibility first

We write like engineers because we are engineers. Every claim is backed by a code snippet, a bundle size number, or a link to the source. If we cannot prove it, we do not say it.

**Before:**
> Tour-kit provides an incredibly powerful and flexible tour engine that will transform your onboarding experience.

**After:**
> Tour-kit gives you headless hooks for tour state, step navigation, and focus management. Wrap them in your own components or use the pre-styled ones.

### 2. Direct and concise

No filler words. No throat-clearing. No "In order to" when "To" will do. Every sentence earns its place.

**Before:**
> In this section, we're going to walk you through the process of setting up and configuring your very first product tour using Tour Kit's powerful component API.

**After:**
> Set up your first tour in three steps.

### 3. Honest about tradeoffs

Developers respect tools that tell the truth. When something has a limitation, we say so plainly and suggest alternatives.

**Before:**
> Tour-kit works with any framework!

**After:**
> Tour-kit is built for React. If you use Vue or Svelte, this is not the right tool. Check out [Driver.js](https://driverjs.com/) for a framework-agnostic option.

### 4. Show, don't tell

A six-line code block communicates more than three paragraphs of feature descriptions.

**Before:**
> Tour-kit offers a highly composable API that allows you to create custom tour cards with full control over rendering, styling, and behavior.

**After:**
> Build your own tour card:
> ```tsx
> const { currentStep, next, prev } = useTour('onboarding');
>
> return (
>   <div className="my-card">
>     <h3>{currentStep?.title}</h3>
>     <p>{currentStep?.content}</p>
>     <button onClick={prev}>Back</button>
>     <button onClick={next}>Next</button>
>   </div>
> );
> ```

### 5. Respectful of developer time

Developers are scanning, not reading. Structure everything for scanning: short paragraphs, code first, tables for comparisons, bullet points for lists. No walls of text.

**Before:**
> Tour Kit provides several different approaches to styling your tour components. You can use CSS variables for theming, which is the recommended approach for most use cases. Alternatively, you can use Tailwind CSS utility classes directly on the components if you prefer that approach. For the most control, you can build completely custom components using the headless hooks from the core package.

**After:**
> Three ways to style tours:
> - **CSS variables** -- Override `--tour-card-background` and friends. Recommended for most projects.
> - **Tailwind classes** -- Apply utilities directly to tour components.
> - **Headless** -- Use `useTour` and build your own UI from scratch.

---

## Channel-Specific Tone

### Documentation

Docs are reference material. They should be scannable, precise, and complete.

**Headings:** Use imperative or noun phrases. "Configure keyboard navigation" not "How to configure keyboard navigation." "Return Value" not "What the hook returns."

**Descriptions:** One sentence that tells the developer what this thing does and when to use it. No opinion, no sell.

**Good:** `useFocusTrap` traps keyboard focus within a container and restores it on unmount.

**Bad:** `useFocusTrap` is an awesome hook that makes accessibility super easy!

**Code comments:** Explain the "why," not the "what." If the code is obvious, skip the comment.

```tsx
// Good: explain a non-obvious decision
// Small delay ensures the DOM has painted before we measure position
requestAnimationFrame(() => activate())

// Bad: restating the code
// Activate the focus trap
activate()
```

**Vocabulary in docs:**
- "Pass" not "provide" (for props)
- "Returns" not "gives you back"
- "Call" not "invoke" (for functions)
- "Fires" not "triggers" (for callbacks)
- Use present tense: "Starts the tour" not "Will start the tour"

**Callouts:** Use sparingly. Reserve `warn` for things that will break. Reserve `info` for genuinely non-obvious behavior. If every other section has a callout, none of them stand out.

### GitHub (README, Issues, PRs, Discussions)

**README voice:** Factual, scannable, code-heavy. The README is a 30-second pitch to a developer scrolling through search results. Lead with what it does, then show the code, then explain why it exists.

**Issue responses:** Acknowledge the report, explain what is happening, and give a timeline or workaround. Do not over-apologize. Do not use corporate language.

**Before:**
> Thank you so much for reporting this issue! We truly appreciate your contribution to making tour-kit better. We'll definitely look into this as soon as possible and get back to you!

**After:**
> Thanks for the report. This looks like a race condition in the positioning engine when the target element resizes mid-animation. Working on a fix -- will post an update in this thread when it's ready.

**Declining feature requests:**

**Before:**
> Unfortunately, this doesn't align with our product vision at this time, but we'll keep it in mind for future iterations.

**After:**
> Interesting idea. This is outside what tour-kit is designed for -- we focus on product tours and onboarding, not general modals. For a modal system, [Radix Dialog](https://radix-ui.com) covers that well. Closing this, but feel free to reopen if I'm misunderstanding the use case.

**PR reviews:** Be specific. Point to the line. Suggest the fix, don't just describe the problem.

### Twitter/X

Casual-technical. Think "engineer talking to another engineer at a meetup," not "brand account posting content."

**Thread format:**
1. Hook: What you built and the problem it solves (1 tweet)
2. Demo: GIF or short video
3. Code: The simplest possible example
4. Differentiator: What makes this different from existing tools (1 tweet)
5. Link: To docs or repo

**Tone balance:** 80% technical, 20% personality. It is fine to be excited about shipping something. It is not fine to use words like "game-changing."

**Hashtags:** Use zero to two per post. `#reactjs` and `#opensource` when relevant. Never `#coding #webdev #javascript #frontend #buildinpublic` stacked.

**Before:**
> We're thrilled to announce the launch of tour-kit v2.0! This game-changing release unlocks incredible new possibilities for your onboarding flows. Check it out! #react #opensource #webdev #javascript #typescript #coding #buildinpublic

**After:**
> tour-kit v2.0 is out. New in this release:
>
> - Branching tours (if user did X, skip to step Y)
> - Route-aware steps (works with Next.js App Router)
> - 40% smaller bundle (core is now 4.8KB gzipped)
>
> Upgrade: `pnpm add @tour-kit/react@latest`

**No emojis in technical tweets.** A single emoji in a casual reply is acceptable. Never use emoji as bullet points.

### Hacker News

HN is allergic to marketing. Write like you are explaining your project to a senior engineer who is mildly skeptical.

**Rules:**
- No superlatives. Never "best," "fastest," "revolutionary," "the ultimate."
- No exclamation marks in the title.
- Lead with the problem, not the solution.
- Mention tradeoffs before someone in the comments does.
- If someone criticizes the project, respond with facts and gratitude, never defensiveness.

**Show HN title:**

**Before:**
> Show HN: Tour-kit -- The best open-source product tour library for React!

**After:**
> Show HN: Tour-kit -- Headless product tours for React (open source)

**Responding to criticism:**

**Before:**
> Actually, if you read the docs carefully, you'd see that we already handle that case.

**After:**
> Fair point. The current API does handle that via `useBranch`, but the docs don't make it obvious. I've opened an issue to improve that section: [link]. Thanks for flagging it.

**Before/after for a comment explaining the project:**

**Before:**
> Tour-kit is an incredibly powerful, feature-rich, and highly customizable product tour library that leverages cutting-edge React patterns to deliver a seamless developer experience.

**After:**
> Tour-kit is a headless React library for building product tours. The core package is hooks-only (~5KB gzipped) -- you bring your own UI. There's also a pre-styled layer that works with shadcn/ui if you don't want to build from scratch.
>
> Main difference from existing tools like Shepherd.js or React Joyride: it's composition-based (components, not config objects) and ships with focus trapping, keyboard nav, and screen reader announcements by default.
>
> Free tier is MIT. Extended packages (analytics, checklists, announcements) are $99 one-time.

### Reddit (r/reactjs, r/webdev)

Reddit communities can smell self-promotion instantly. Post as a developer sharing a tool, not as a brand launching a product.

**Format:** "I built X to solve Y" -- then explain what Y was, what you tried before, and why you ended up building your own.

**Rules:**
- Participate in the subreddit before and after posting. Answer other people's questions. Be a community member, not a drive-by promoter.
- Respond to every comment, even critical ones.
- Never say "we." Say "I" -- even if there's a team. Reddit values individual makers.
- Include what the tool does NOT do. Reddit respects honesty.

**Before:**
> Hey everyone! We're excited to share tour-kit, a revolutionary new product tour library for React! It has tons of amazing features and we'd love for you to check it out! Link in comments.

**After:**
> I built an open-source product tour library for React because I got tired of fighting Joyride's callback-based API.
>
> It's headless-first -- core is just hooks, ~5KB. There's a styled layer for shadcn/ui if you want pre-built components.
>
> What it does well: composition-based API, real accessibility (focus trap, keyboard nav, screen reader), TypeScript throughout.
>
> What it doesn't do: no visual builder, no analytics dashboard, no drag-and-drop. It's a library, not a platform.
>
> Repo: [link]. Happy to answer questions about the architecture.

### Product Hunt

Product Hunt rewards storytelling and personality more than other channels. Still technical, but lead with the "why" narrative.

**Tagline (60 chars max):** Headless product tours for React. Open source.

**Maker's comment format:**
1. The problem you personally hit (1-2 sentences)
2. What exists today and why it did not work for you (2-3 sentences)
3. What you built and the key technical decisions (3-4 sentences)
4. Honest scope: what it does and does not do (2 sentences)
5. What is free vs paid (1 sentence)
6. Invitation for feedback (1 sentence)

**Before:**
> Hi Product Hunt! We're SO excited to finally launch tour-kit! It's been months of hard work and we can't wait for you to try it. Tour-kit is a game-changing, feature-rich product tour library that will revolutionize how you build onboarding experiences. We'd love your support -- please upvote!

**After:**
> Hey PH -- I built tour-kit because every product tour library I tried either locked me into their UI (Joyride), required a $300/mo SaaS subscription (Chameleon, UserGuiding), or wasn't accessible out of the box.
>
> Tour-kit is headless-first. The core package is React hooks -- `useTour`, `useFocusTrap`, `useKeyboard` -- and you build whatever UI you want on top. If you use shadcn/ui, there's a pre-styled component layer that drops right in.
>
> Accessibility is built in, not bolted on: focus trapping, keyboard navigation, screen reader announcements, and `prefers-reduced-motion` support are all in the core.
>
> Free tier (MIT): tours, hints, spotlights, keyboard nav, TypeScript. Extended packages (analytics, checklists, announcements): $99 one-time.
>
> Would genuinely appreciate feedback on the API design -- especially from anyone who's built onboarding flows before.

### Blog Posts / Dev.to

Three distinct tones depending on the post type:

**Tutorial tone:** Teacher mode. Step-by-step, zero assumptions beyond stated prerequisites. Every code block runs. Every file path is shown. Test the tutorial from scratch before publishing.

**Before:**
> First, you'll want to set up tour-kit in your project. It's super easy!

**After:**
> **Prerequisites:** A React 18+ project with TypeScript. This tutorial uses Next.js 14 App Router, but the tour-kit code works in any React setup.
>
> Install the packages:
> ```bash
> pnpm add @tour-kit/react
> ```

**Announcement tone:** Ship notes. What changed, why, and how to upgrade. Lead with the most impactful change. Link to the migration guide if there are breaking changes.

**Before:**
> We're incredibly excited to announce an amazing new version of tour-kit packed with tons of awesome new features that we've been working super hard on!

**After:**
> tour-kit v2.0 is out. The headline change: branching tours. You can now skip, repeat, or redirect steps based on user behavior.
>
> Also in this release:
> - Route-aware steps for Next.js App Router
> - 40% smaller core bundle (4.8KB gzipped)
> - New `useAdvanceOn` hook for event-driven progression
>
> Breaking changes: `onStepChange` callback signature changed. See the [migration guide](/docs/migration).

**Comparison tone:** Factual, fair, structured. Use a table. Acknowledge where competitors are stronger. Never trash-talk.

**Before:**
> Unlike other inferior libraries, tour-kit is way better because it's actually accessible and doesn't have a bloated bundle.

**After:**
> | | tour-kit | React Joyride | Shepherd.js |
> |---|---|---|---|
> | API style | Components + hooks | Config object + callbacks | Config object + methods |
> | Bundle (core) | ~5KB | ~28KB | ~35KB |
> | TypeScript | Native | DefinitelyTyped | Native |
> | Accessibility | Focus trap, keyboard, screen reader | Partial keyboard | Partial keyboard |
> | Pricing | Free (MIT) / $99 Pro | Free (MIT) | Free (MIT) |
>
> Joyride has a larger ecosystem and more Stack Overflow answers. Shepherd has better framework coverage (Vue, Angular, Ember). tour-kit focuses on React-only with deeper accessibility and composition patterns.

---

## Vocabulary Guide

### Words We Use

| Word | Why |
|------|-----|
| headless | Accurately describes the architecture. Developers know what this means. |
| composable | Describes the component-based API. Preferred over "modular." |
| accessible | Specific and verifiable (WCAG 2.1 AA). |
| type-safe | Backed by TypeScript strict mode. |
| lightweight | Only when followed by a number: "lightweight (~5KB gzipped)." Never on its own. |
| works with | "Works with shadcn/ui." Factual. No promise of perfection. |
| you own the UI | Describes the headless model: your components, your styles, your markup. |
| hooks-only | Describes the core package. Clear and literal. |

### Words We Never Use

| Banned Word | Why | Use Instead |
|-------------|-----|-------------|
| revolutionary | No library is revolutionary. | Describe what it does differently. |
| game-changing | Same energy. | Show the before/after. |
| best-in-class | Unverifiable. | Cite a specific metric. |
| world-class | Meaningless. | "WCAG 2.1 AA compliant." |
| seamless | Nothing is seamless. | "works with" or describe the integration steps. |
| robust | Vague. | "handles [specific edge case]." |
| cutting-edge | Every tool claims this. | Name the actual technique. |
| leverage | Corporate jargon. | "use." |
| synergy | No. | No. |
| paradigm shift | No. | Describe the actual shift. |
| 10x | Impossible to verify. | Show a benchmark. |
| unlock | Features are not locked. | "adds" or "enables." |
| supercharge | Not a real verb. | Say what it actually does. |
| seamlessly integrates | Doubly banned. | "works with [X]. Here's how: [code]." |
| blazingly fast | Overused to the point of parody. | "Core renders in <2ms. [Benchmark link]." |
| delightful | Subjective and overused. | Let users decide if they're delighted. |
| empower | Corporate. | "lets you" or "gives you." |

### Emoji Rules

- **Docs:** No emojis. Ever.
- **GitHub README:** No emojis in prose. Badges are fine.
- **GitHub issues/PRs:** No emojis in descriptions. Reaction emojis on comments are fine.
- **Twitter/X:** One emoji per post maximum, and only if it genuinely adds meaning (e.g., a ship emoji on a release announcement). Never as bullet points.
- **Product Hunt:** Sparingly acceptable per platform norms.
- **Blog posts:** No.

### Competitor References

We mention competitors when it helps the reader make a better decision. We never trash-talk.

**Pattern:** "If you need [X], [competitor] is a good choice. tour-kit focuses on [Y]."

**Good examples:**

> If you need framework-agnostic tours that work in Vue, Angular, and vanilla JS, Shepherd.js covers that well. tour-kit is React-only by design.

> React Joyride has been around since 2016 and has a large community with extensive Stack Overflow coverage. tour-kit takes a different approach: composition-based components instead of config objects, with accessibility built into the core.

> If you need a no-code visual builder where product managers create tours without developer involvement, Chameleon or UserGuiding are built for that. tour-kit is a developer tool -- you write code.

**Never:**

> Unlike [competitor], tour-kit actually works.

> [Competitor] is bloated and outdated.

> We're the only library that does [X]. (Almost certainly false.)

---

## Writing Checklist

Run through this before publishing anything -- a doc page, a tweet, an issue response, a blog post.

- [ ] **Can I remove a sentence without losing meaning?** If yes, remove it.
- [ ] **Is there a code example where I'm using prose?** Show the code instead.
- [ ] **Did I use any banned words?** Ctrl+F the vocabulary list above.
- [ ] **Am I making a claim without evidence?** Add a number, a benchmark, a code snippet, or a link. Or delete the claim.
- [ ] **Would I be embarrassed if a senior engineer read this?** If the writing feels like marketing, rewrite it.
- [ ] **Am I respecting the reader's time?** Could a developer scanning this for 15 seconds get the key information?
- [ ] **Is the tone right for the channel?** Docs should be precise, Twitter can be casual, HN must be humble.
- [ ] **Did I check for emojis?** Remove them unless the channel explicitly allows them.
- [ ] **If I mention a competitor, am I being fair?** Acknowledge what they do well. State where tour-kit differs. No snark.
- [ ] **Does every heading describe what the section contains?** No clever headings. "Configure Keyboard Navigation" not "Take Control of Your Keys."
