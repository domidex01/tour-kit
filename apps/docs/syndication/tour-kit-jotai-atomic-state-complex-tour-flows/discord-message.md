## Channel: #articles or #show-off in Reactiflux

**Message:**

Wrote up a pattern for managing complex product tour state with Jotai atoms instead of Context or Zustand. Each step is an atom, conditional step visibility uses derived atoms, and you get localStorage persistence for free with atomWithStorage. Includes a comparison table of re-render behavior across state managers. Might be useful if you're building onboarding flows with interdependent steps: https://usertourkit.com/blog/tour-kit-jotai-atomic-state-complex-tour-flows

Would love feedback on the orchestrator pattern in step 4 if anyone's tried something similar.
