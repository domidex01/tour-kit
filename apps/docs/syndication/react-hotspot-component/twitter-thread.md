## Thread (6 tweets)

**1/** Most React hotspot tutorials skip accessibility entirely. WCAG 1.4.13 requires hover/focus content to be dismissable (Escape key), hoverable, and persistent. Almost no hotspot component handles all three.

**2/** The fix: render each hotspot as a focusable <button> with aria-expanded. Use Floating UI's useDismiss for Escape handling. Respect prefers-reduced-motion on the pulse animation with a CSS media query.

**3/** Bundle size matters here. React Joyride ships at ~37KB gzipped. Tour Kit's core + hints packages come in under 10KB combined, and tree-shake to even less if you only use the <Hint> component.

**4/** The key architectural decision: independent state per hotspot via a React reducer. Opening one tooltip auto-closes any other. Each hint tracks its own open/dismissed state separately. No sequential tour model required.

**5/** One gotcha we kept hitting: CSS selectors break for elements inside modals or lazy-loaded routes. Use React refs instead — Tour Kit watches the ref and renders the hotspot only after the element mounts.

**6/** Full tutorial with 6 steps, comparison table, troubleshooting, and FAQ:

https://usertourkit.com/blog/react-hotspot-component
