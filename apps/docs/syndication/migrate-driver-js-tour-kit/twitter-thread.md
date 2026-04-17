## Thread (6 tweets)

**1/** Driver.js is great for simple tours — 5KB, zero deps, works everywhere. But if you're using React with a design system, you hit walls fast. I documented the full migration to a headless approach. Here's what changes:

**2/** The biggest shift: popover rendering. Driver.js owns the tooltip UI. You configure popoverClass and hack the DOM via onPopoverRender. In headless, you write a normal React component — 20 lines of JSX using your existing Card component. No CSS overrides, no DOM manipulation.

**3/** The callback model flips too. Driver.js gives you onNextClick because it renders the Next button. In headless, you render the button, so you just call next() in onClick. Same for prev, close, and every other interaction.

**4/** The configuration mapping is mostly 1:1:
- overlayOpacity → spotlight.color
- stagePadding → spotlight.padding
- side + align → placement (combined string)

The mechanical conversion is quick. The real work is building your tooltip component.

**5/** What you gain after migrating:
- Conditional steps (show/hide by user role)
- Branching tours (different paths per action)
- Multi-page support with route matching
- Built-in persistence across reloads
- Keyboard nav + focus trapping by default

**6/** Full migration guide with before/after code, API mapping tables, and a checklist: https://usertourkit.com/blog/migrate-driver-js-tour-kit
