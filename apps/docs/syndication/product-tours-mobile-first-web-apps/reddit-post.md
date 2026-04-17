## Subreddit: r/reactjs

**Title:** I wrote up the touch-friendly patterns we use for mobile product tours — thumb zones, bottom sheets, and why 44px buttons matter

**Body:**

I've been working on product tour components in React and kept running into the same problem: everything works great on desktop, then breaks on a 375px phone screen. Tooltips overflow, close buttons are impossible to hit one-handed, and step transitions feel sluggish on mobile networks.

After digging into the research, a few patterns stood out:

- **Thumb zone layout matters more than you'd think.** 49% of users hold their phone one-handed (Steven Hoober's research), and 75% of interactions are thumb-driven. Putting Next/Back/Skip buttons at the bottom of the screen instead of anchoring them to the tooltip position made a noticeable difference in how usable tours felt on mobile.

- **Bottom sheets > tooltips on mobile.** When a tooltip anchors to an element near the top of the screen, users have to reach into the "hard zone" to interact with it. Rendering step content as a bottom sheet while highlighting the target with an overlay keeps everything in the thumb zone.

- **44px minimum touch targets.** WCAG 2.2 AA allows 24px, but Apple HIG, Material Design, and the MIT Touch Lab (average fingertip is 16-20mm) all converge around 44px. Users with motor impairments see 75% higher error rates on small targets.

- **Three-step tours win on mobile.** Chameleon analyzed 15M tour interactions and found 3-step tours hit 72% completion — the highest of any length. On mobile, shorter is almost always better.

I wrote up the full guide with React code examples, WCAG compliance requirements, and performance tips (CLS, INP, lazy loading): https://usertourkit.com/blog/product-tours-mobile-first-web-apps

Disclosure: I built Tour Kit, the library used in the examples. But the patterns apply regardless of which tour library you use. Happy to answer questions about any of these approaches.
