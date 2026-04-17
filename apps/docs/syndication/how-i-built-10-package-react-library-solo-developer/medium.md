# I Built a 12-Package React Library Solo in 3.5 Months — Here's What I Learned

## 31,000 lines of TypeScript, 141 commits, zero npm downloads

*Originally published at [usertourkit.com](https://usertourkit.com/blog/how-i-built-10-package-react-library-solo-developer)*

On December 22, 2025, I created a Git repo called `tour-kit`. Three and a half months later, it's 12 packages, 31,000 lines of TypeScript, and 141 commits. I built every line alone.

This isn't a success story. Not yet, anyway. Tour Kit hasn't launched publicly. Zero npm downloads. No GitHub stars.

I'm writing this while the packages still sit unpublished in a monorepo that only I have ever cloned.

But building it taught me things about package architecture, monorepo tooling, and solo-developer tradeoffs that I couldn't have learned any other way. This is the honest version of that story.

---

## The starting point: I got annoyed at React Joyride

I was adding product tours to a client project in late 2025. React Joyride was the obvious pick. 603K weekly downloads. Battle-tested. Everyone uses it.

Then I looked at the bundle. 37KB gzipped for the core package, with Popper.js bundled in, and a styling system that fought Tailwind at every turn. I spent more time overriding Joyride's CSS than writing the actual tour steps. The tooltip wouldn't match our design system no matter how many `!important` declarations I threw at it.

I checked Shepherd.js. AGPL licensed. That's a non-starter for most commercial projects unless you want to open-source your entire application.

So I did what every developer with more ambition than sense does. I started from scratch.

---

## The first month: getting core right

The first version of Tour Kit was a single package. About 800 lines of code. It worked. Sort of. The positioning logic was tangled with the React rendering logic, which was tangled with the step sequencing logic.

I rewrote it into two packages by mid-January: `@tour-kit/core` for the framework-agnostic logic and `@tour-kit/react` for the React bindings. This was the first real architectural decision, and it shaped everything that came after.

The split forced me to think about what "core" actually meant. Step sequencing? Core. Position calculations? Core. Keyboard navigation? Core. React context? Not core. JSX components? Not core. If it needed `import React`, it didn't belong in `@tour-kit/core`.

That boundary was hard to draw at first. But once the line was clean, adding new functionality got dramatically easier.

---

## Key decisions that shaped the architecture

Three choices defined the project more than any individual piece of code.

**Turborepo over Nx.** I tried Nx for a weekend. The configuration surface area was enormous for a single developer. Turborepo's `turbo.json` is 36 lines. That was the entire build configuration.

**tsup for every package.** It produces ESM + CJS dual output with `.d.ts` declarations from a 10-line config file. Every package uses the same template. When a bundler bug hits one package, the fix applies to all of them.

**Headless-first, always.** Every component ships without styles. No CSS files, no CSS-in-JS, no inline styles. You bring your own `<div>` and your own classes. The core package ships at under 8KB gzipped because there's nothing to style.

The headless approach also solved theming. React Joyride users open dozens of GitHub issues about customizing the tooltip's appearance. Tour Kit doesn't have a tooltip. You render whatever you want. Zero theming bugs by design.

---

## What went wrong

**I built packages nobody asked for.** By February, I had 10 packages. Every time I thought "someone might want this," I created a new package. The surveys package alone has 5 question types, a scoring engine, fatigue prevention, and context awareness. That's an entire product. I spent two weeks building it before a single person had installed `@tour-kit/core`.

**TypeScript strict mode tripled development time.** Getting generic types to propagate correctly through `TourProvider` → `useTour()` → `useStep()` → `onStepComplete` took three full days. The resulting DX is good. But three days for type plumbing on a solo project is a lot.

**Biome wasn't painless.** Import ordering rules fight with TypeScript path aliases. Cognitive complexity warnings flagged functions that were genuinely complex. I'd still choose Biome again though — 200ms for the whole monorepo.

---

## What worked

**The core boundary held.** After three months and thousands of lines of code, no React import has leaked into core. Every new package depends only on core's types and utilities.

**Bundle budgets caught regressions.** Hard limits: core under 8KB gzipped, react under 12KB, hints under 5KB. Every time I added a dependency, the budget told me immediately whether it was worth the bytes.

**Vitest was fast enough to not skip.** Full test run across all packages takes under 8 seconds. That's fast enough that I actually run tests before committing.

---

## The numbers (honest ones)

- **Packages:** 12
- **Total lines of TypeScript:** 31,043
- **Commits:** 141
- **Time span:** Dec 22, 2025 to Apr 11, 2026 (~3.5 months)
- **npm downloads:** 0 (pre-launch)
- **GitHub stars:** 0 (pre-launch)
- **Core bundle size:** Under 8KB gzipped
- **Runtime dependencies:** 0

Zero downloads. Zero stars. That's uncomfortable to publish, but it's the truth.

---

## What I'd do differently

1. **Ship core + react first.** Building all ten packages before launch was wrong. I should have published core and react in January and let actual users tell me what to build next.

2. **Use AI more carefully.** AI-generated code ships faster but needs more review. A GitClear study found AI-assisted code produces 1.7x more issues. Solo developers don't have a code review safety net.

3. **Write docs earlier.** I started the docs site around commit 80. It should have been commit 10. Writing docs forces you to articulate the API from the user's perspective.

---

## Five things I wish I'd known

1. Ship the smallest useful thing first
2. Set bundle budgets from day one
3. Draw the framework-agnostic boundary before writing a single component
4. Write docs before you think you need them
5. Get human eyes on your code, especially the AI-generated parts

Tour Kit's source is at [github.com/DomiDex/tour-kit](https://github.com/DomiDex/tour-kit). If you're building product tours in React and want a headless library that doesn't fight your design system, give it a look.

---

**Suggested Medium publications to submit to:**
- JavaScript in Plain English
- Better Programming
- The Startup
