## Subject: Accessible React empty states — testing 9 design systems with axe-core

## Recipients:
- Cooperpress (React Status, JavaScript Weekly, Frontend Focus): editor@cooperpress.com
- This Week in React: sebastien@thisweekinreact.com
- Bytes.dev: submit via site

## Email body:

Hi [name],

I wrote a tutorial on building accessible empty state components in React with TypeScript. The angle: I tested 9 major design system EmptyState components with axe-core and found none of them properly support screen readers (missing `role="status"` and `aria-live="polite"` per WCAG 2.1 AA 4.1.3).

The article includes a typed compound component with discriminated union variants, a tracking hook for measuring conversion, and data showing users with a single guided action are 67% more likely to be active at 90 days.

Link: https://usertourkit.com/blog/react-empty-state-component

Thanks,
Domi
