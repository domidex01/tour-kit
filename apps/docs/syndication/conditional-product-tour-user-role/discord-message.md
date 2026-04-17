## Channel: #articles in Reactiflux

**Message:**

Wrote a tutorial on building role-based product tours in React. The idea: each tour step has a `when` callback that checks the user's role, so admins see billing steps, editors see content steps, and viewers get a completely separate flow. Covers the `forRoles()` helper pattern, wiring auth context into tour data, and handling role changes mid-session.

https://usertourkit.com/blog/conditional-product-tour-user-role

Curious if anyone's tackled this differently — especially the mid-session role change problem.
