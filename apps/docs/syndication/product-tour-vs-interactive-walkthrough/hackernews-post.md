## Title: Product tours vs interactive walkthroughs: resolving the vendor naming conflict

## URL: https://usertourkit.com/blog/product-tour-vs-interactive-walkthrough

## Comment to post immediately after:

I kept hitting conflicting definitions while researching in-app onboarding patterns. Navattic defines "interactive product tour" as an external shareable replica, while Userpilot uses "interactive walkthrough" to mean in-app action-required guidance. Both are internally consistent but contradict each other.

The article maps both axes (location and interaction depth) into a 2x2 model. The implementation difference turns out to be a single property (`advanceOn`) that switches step advancement from button-driven to event-driven.

Most interesting data from Chameleon's 15M interactions: self-serve tours see 123% higher completion than auto-triggered ones. The trigger method matters more than passive vs. active.

Disclosure: I built Tour Kit (open-source React tour library), so code examples use its API. Benchmark data and definitions are from third-party sources.
