# What Is a Progress Bar? The Developer's Guide to Onboarding Indicators

*A practical breakdown of progress bar types, ARIA accessibility, and the psychology behind why they work*

*Originally published at [usertourkit.com](https://usertourkit.com/blog/what-is-progress-bar-onboarding)*

Every SaaS onboarding flow with more than three steps faces the same question: do users know where they are? Progress bars answer that. But the implementation details get buried under product-manager-focused advice. Here's the developer version.

## What is a progress bar?

A progress bar is a visual indicator that communicates how much of a multi-step process a user has completed and how much remains. In onboarding, it typically sits at the top of a setup flow, showing the ratio of finished steps to total steps.

The HTML spec defines a native `<progress>` element for this. The WAI-ARIA spec adds `role="progressbar"` for custom implementations with accessible state attributes like `aria-valuenow`, `aria-valuemin`, and `aria-valuemax`.

Progress bars differ from spinners. A spinner is indeterminate: it loops without telling you when things will finish. A progress bar is determinate, showing actual completion percentage. Jakob Nielsen's research established a 10-second threshold. After 10 seconds without progress feedback, users assume the process has stalled. Onboarding flows routinely exceed that, which is why 78% of products now include progress indicators during setup (UserGuiding, 2026).

## The psychology behind progress bars

Five psychological principles explain why progress bars increase onboarding completion rates by 20-30% (UserPilot):

- **Zeigarnik effect**: Incomplete tasks nag at memory. Seeing "3 of 5 done" creates pull to finish.
- **Endowed progress**: Starting ahead boosts motivation. Pre-filling the first step (account creation) as complete helps.
- **Goal gradient**: Effort increases near the finish line. Users rush through the last 2 steps.
- **Anchoring**: The first number sets expectations. "Step 1 of 4" feels lighter than "Step 1 of 12."
- **Perceived control**: Visibility reduces anxiety. Users tolerate longer flows when they see the end.

One caveat: progress bars can *decrease* completion when early progress feels slow. A meta-analysis of 32 experiments found that bars perceived as decelerating led to higher abandonment (Irrational Labs, 2025). Start the animation slow and accelerate toward the end for the best perceived speed.

## Six types of progress bars

Not every onboarding flow needs the same indicator:

1. **Linear (continuous fill)** — Simple 3-5 step flows. Medium user clarity.
2. **Segmented / stepped** — Multi-step wizards and onboarding checklists. High clarity.
3. **Circular / radial** — Dashboards and compact sidebars.
4. **Percentage text** — Inline status where bar space is tight.
5. **Hybrid (steps + percentage)** — Complex onboarding with 8+ steps. Very high clarity.
6. **Indeterminate (spinner)** — Unknown-duration tasks only. Low clarity.

Segmented progress bars dominate onboarding because they answer two questions at once: "how far am I?" and "what's the next step?"

## Why this matters

The median checklist completion rate sits at 10.1% (Userpilot, 2026). Progress bars won't fix a broken flow, but they reduce one specific failure mode: users quitting because they don't know how much is left.

The real question isn't whether to show progress. It's whether your flow has a clear enough structure to make progress meaningful. Branching paths, optional steps, or context-dependent screens will make a linear progress bar lie to users. And they'll notice.

---

Full article with React code examples, ARIA implementation guide, and comparison tables: [usertourkit.com/blog/what-is-progress-bar-onboarding](https://usertourkit.com/blog/what-is-progress-bar-onboarding)

*Suggest submitting to: JavaScript in Plain English, Better Programming*
