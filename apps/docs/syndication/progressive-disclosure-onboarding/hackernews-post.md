## Title: Progressive disclosure in onboarding: data from 15M interactions shows 53% vs 75% completion

## URL: https://usertourkit.com/blog/progressive-disclosure-onboarding

## Comment to post immediately after:

Jakob Nielsen introduced progressive disclosure in 1995 and the principle hasn't aged. The core idea: show only the most important options first, reveal complexity on demand.

I looked at how this applies to SaaS onboarding specifically. Chameleon's benchmark data across 15 million product tour interactions shows linear tours (the "here's everything on first login" approach) average 53% completion. Contextual progressive disclosure — where features surface based on behavior signals rather than a schedule — hits 75%.

The interesting part to me was NN/g's finding that more than 2 disclosure levels per interaction causes navigation confusion. Most product tours with 8-12 steps violate this completely. The three-layer model (orientation, contextual, power user) works because each layer operates independently with its own triggers.

Also worth noting: Google's Agent Developer Kit now uses progressive disclosure for AI agent context management — loading skill metadata at ~100 tokens per skill at startup instead of stuffing 10,000 tokens into a monolithic prompt. The 1995 UX pattern is finding new applications in 2026.

Full writeup includes React code examples and a measurement framework for each disclosure layer. Written from the perspective of building Tour Kit (a headless product tour library), but the principles are tool-agnostic.
