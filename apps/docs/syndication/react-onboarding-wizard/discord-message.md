## Channel: #articles or #show-off in Reactiflux

**Message:**

Wrote a tutorial on building an accessible onboarding wizard with a stepper UI in React. The main angle: I checked 5 popular stepper tutorials and none handle focus management or ARIA roles for step indicators. The tutorial covers aria-current="step", focus management with useEffect, and aria-live regions for screen reader announcements. Also has a bundle size comparison table.

https://usertourkit.com/blog/react-onboarding-wizard

Would love feedback on the ARIA patterns — anyone have experience with more complex step sequences (conditional branching, etc.)?
