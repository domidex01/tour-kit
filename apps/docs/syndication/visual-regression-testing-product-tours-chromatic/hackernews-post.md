## Title: Visual regression testing for product tour components with Storybook and Chromatic

## URL: https://usertourkit.com/blog/visual-regression-testing-product-tours-chromatic

## Comment to post immediately after:

We build a headless product tour library for React and kept hitting bugs that passed all unit and integration tests but were obviously broken visually: tooltips drifting after CSS changes, overlay masks with off-by-one pixel cutouts, z-index stacking issues with sticky headers.

The approach: each tour step becomes a Storybook story, play functions simulate multi-step flows (clicking "Next" twice, then capturing), and Chromatic diffs every screenshot against the approved baseline on each PR.

What surprised us: the snapshot budget math works out well on the free tier. 3 stories x 3 viewports x 2 themes = 18 snapshots per PR. At 10 PRs/month that's 180 out of 5,000 free snapshots. The main gotcha was animations causing non-deterministic diffs; we solve that by detecting Chromatic's UA and zeroing out transition durations.

Chromatic also runs Axe accessibility audits alongside visual snapshots at no extra cost, which catches missing aria-labels on tour tooltips that we'd otherwise only find in manual QA.
