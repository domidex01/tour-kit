Product onboarding flows have a hidden complexity problem.

"Show step 3 after steps 1 and 2 are done" sounds trivial. But thread that logic through React Context or a global store, add persistence, add feature flag conditions, add role-based visibility... and suddenly you're debugging useEffect chains at 2am.

I tried a different approach: model each tour step as an independent Jotai atom. Conditional visibility becomes a derived atom. Progress tracking is a computed value. Persistence is one line with atomWithStorage.

The result: zero unnecessary re-renders (Context re-renders every consumer), under 11KB total bundle, and tour logic that's actually readable six months later.

Full technical walkthrough with TypeScript examples: https://usertourkit.com/blog/tour-kit-jotai-atomic-state-complex-tour-flows

#react #typescript #javascript #webdevelopment #opensource #producttours
