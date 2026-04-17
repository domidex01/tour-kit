## Title: Contextual tooltips vs linear tours: a data-backed decision framework

## URL: https://usertourkit.com/blog/contextual-tooltips-vs-linear-tours

## Comment to post immediately after:

I put together a decision framework for when to use contextual tooltips vs linear product tours, based on Chameleon's 2025 benchmark (550M interactions) and NN/g's research on onboarding patterns.

Key findings: tours exceeding 5 steps lose >50% of users. Self-serve tours (user-initiated) hit 67% completion vs ~40% for auto-launched. Behavior-triggered contextual tooltips achieve 2.5x higher engagement than static approaches.

The most interesting insight was from NN/g's "push vs pull revelations" framework. Linear tours are push revelations that require users to memorize information they don't need yet. Contextual tooltips are pull revelations that surface help at the point of action. The data consistently favors pull.

Article includes React code examples for both patterns and a comparison of the different accessibility requirements (aria-describedby for tooltips vs focus trapping for tours), which I haven't seen covered elsewhere.
