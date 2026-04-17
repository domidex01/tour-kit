# Building conditional product tours based on user role

## How to show admins, editors, and viewers different onboarding flows in React

*Originally published at [usertourkit.com](https://usertourkit.com/blog/conditional-product-tour-user-role)*

Your admin dashboard has 40 features. Your viewer can access 6 of them. Showing both users the same onboarding tour is worse than showing no tour at all. The admin misses the tools they need, and the viewer gets walked through buttons they can't click.

As of April 2026, personalized onboarding increases feature adoption by 42% and retention by 40% compared to one-size-fits-all flows. Yet most React product tour tutorials stop at "here's how to highlight an element." Nobody shows how to wire user roles into tour logic.

Tour Kit's `when` prop solves this at the step level. Each step receives the full tour context and returns a boolean. If the function returns `false`, Tour Kit skips the step entirely. No DOM re-parenting, no wasted renders.

By the end of this tutorial, you'll have a working role-based tour system where admins, editors, and viewers each see only the steps relevant to their permissions.

---

## The core pattern: a role guard function

The key insight is a single helper function that wraps Tour Kit's `when` callback:

```
function forRoles(...roles) {
  return (context) => {
    const userRole = context.data.userRole
    return userRole ? roles.includes(userRole) : false
  }
}
```

Then each step declares which roles should see it:

```
{
  id: 'billing',
  target: '#billing-nav',
  title: 'Billing and subscriptions',
  when: forRoles('admin'),
}
```

Steps without a `when` prop show for everyone. Steps with `when` only appear when the function returns `true`. Tour Kit evaluates `when` before each step transition, so the progress indicator stays accurate.

## Wiring it together

You bridge your auth system to Tour Kit with `setData()`:

```
setData('userRole', user.role)
```

When Tour Kit hits a step with a `when` callback, it passes the full context, including `data.userRole`, to that function.

## What each role sees

| Role | Steps | Unique steps |
|------|-------|-------------|
| Admin | 6 | billing, team-management |
| Editor | 4 | (shares with admin) |
| Viewer | 3 | separate standalone tour |

The progress indicator for each role shows the correct step count. An admin sees "Step 1 of 6." An editor sees "Step 1 of 4." No gaps.

## Handling role changes mid-session

Users upgrade plans. Admins grant editor access. If a role changes while a tour is running, you need the tour to adapt. The solution: a `useRef` to track the previous role and `goTo(currentStepIndex)` to force re-evaluation of the `when` conditions.

Sentry's engineering team documented this same pattern when building their product tours: refs for values that inform logic but don't drive UI.

## The security caveat

Client-side role checks are a UX improvement, not a security mechanism. As the Worldline engineering team noted: "Any JavaScript code running on the browser is present and completely readable by the end user." Always enforce permissions server-side. The tour is cosmetic; your API is the security boundary.

---

Full tutorial with all 6 code examples, troubleshooting guide, and FAQ: [usertourkit.com/blog/conditional-product-tour-user-role](https://usertourkit.com/blog/conditional-product-tour-user-role)

---

**Suggested Medium publications to submit to:**
- JavaScript in Plain English
- Better Programming
- The Startup
