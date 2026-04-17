## Channel: #articles or #show-off in Reactiflux

**Message:**

Wrote a tutorial on building accessible empty state components in React. Tested 9 design system EmptyState implementations with axe-core and found none properly support screen readers. The fix is just `role="status"` + `aria-live="polite"`, but it's wild that Chakra, Polaris, Ant Design etc. all skip it. Article covers a typed compound component pattern, tracking hook, and common gotchas: https://usertourkit.com/blog/react-empty-state-component

Would love feedback on the discriminated union approach for variant typing — curious if anyone uses a different pattern.
