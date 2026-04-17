## Title: The unbundling of onboarding: why all-in-one is over

## URL: https://usertourkit.com/blog/unbundling-onboarding-tools

## Comment to post immediately after:

I wrote this after talking to a few teams who spent 3-6 months migrating off Pendo, mostly because tour configurations, analytics data, and targeting rules were all trapped inside the platform. The switching cost wasn't technical complexity. It was extraction.

The broader pattern is interesting: 46% of IT teams have implemented composable architecture (Deloitte 2025), and the modular software market is past $39B. Frontend development unbundled years ago (TanStack Router, Zustand, shadcn/ui). Onboarding is just catching up.

Some numbers from the piece: WalkMe injects 180-350KB per page, Pendo adds 150-250KB. All-in-one platforms cost $15K-$140K/year at 10K MAU. A composable stack built on existing analytics + feature flags + a focused tour library reduces that by 90%+.

The counterargument is real though: composable requires React developers, no visual builder exists, and migration cost from an existing platform can be high. If you're a 5-person startup, a no-code platform is probably the right call.

Disclosure: I built Tour Kit (composable onboarding library for React), so I have a horse in this race. The trend data comes from Deloitte, Gartner, and SaaStr though, not from me.
