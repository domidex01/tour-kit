## Subject: Visual regression testing for product tour components (Storybook + Chromatic tutorial)

## Recipients:
- Cooperpress (React Status, JavaScript Weekly, Frontend Focus): editor@cooperpress.com
- This Week in React: sebastien@thisweekinreact.com
- Bytes.dev: submit via site

## Email body:

Hi [name],

I wrote a tutorial on setting up visual regression testing specifically for product tour components using Storybook play functions and Chromatic. Product tours have overlays, dynamically positioned tooltips, and multi-step flows that unit tests completely miss, and there's surprisingly no existing content at this intersection.

The tutorial covers writing stories for each tour state, simulating step navigation with play functions so Chromatic captures post-interaction screenshots, dark/light theme testing with the modes parameter, and a GitHub Actions workflow. Includes snapshot budget math showing how the free tier handles typical tour component coverage (18 snapshots per PR = 3.6% of the monthly budget).

Link: https://usertourkit.com/blog/visual-regression-testing-product-tours-chromatic

Thanks,
Domi
