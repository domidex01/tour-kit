## Subreddit: r/reactjs (primary), r/webdev (secondary)

**Title:** I calculated the 3-year TCO of onboarding tools: SaaS vs building from scratch vs headless libraries

**Body:**

I spent a week digging into the real cost of onboarding software for a React SaaS app. Not the pricing page numbers — the actual total cost of ownership over 3 years including MAU overages, implementation fees, and maintenance hours.

Here's the summary:

- **SaaS tools (Appcues, Userpilot, Pendo):** $15,400-$39,800 over 3 years. The big gotcha is MAU-based pricing. Growing from 2K to 20K users can push your Appcues bill from $3,600/year to $24,000/year with no feature change.

- **Building from scratch:** $122,316 over 3 years. Appcues published a breakdown: 3 engineers + 1 PM + 1 designer for a 2-month sprint = $70K in year one, plus $25K/year maintenance. Atlassian's growth team spent $3M over 3 years.

- **Headless libraries (e.g., React Joyride, Tour Kit):** ~$8,099 over 3 years. The library handles positioning, accessibility, and state management. You write the UI components. No MAU fees, no vendor lock-in.

The "build vs buy" framing that most articles use is missing an option. If you already have a React codebase and a design system, a headless library eliminates 70-80% of the custom engineering work at a fraction of the SaaS cost.

I also compiled pricing data for 8 major vendors (Appcues, Userpilot, Pendo, WalkMe, Chameleon, UserGuiding, Userflow, Intercom). Intercom's is completely opaque — you can't even get a ballpark without talking to sales, which is a red flag in itself.

Full breakdown with all pricing tables, code examples, and the 3-year TCO comparison: https://usertourkit.com/blog/onboarding-software-cost-2026

Disclosure: I built Tour Kit, one of the headless libraries mentioned. The TCO numbers are based on published vendor pricing and Appcues/Userpilot's own cost research, not my estimates. Happy to answer questions about methodology.
