## Subject: createPortal deep-dive for product tours (event bubbling, a11y, SSR gotchas)

## Recipients:
- Cooperpress (React Status, JavaScript Weekly): editor@cooperpress.com
- This Week in React: sebastien@thisweekinreact.com
- Bytes.dev: submit via site

## Email body:

Hi [name],

I wrote a deep-dive on portal rendering for product tour overlays, covering the three gotchas most tutorials skip: React tree event bubbling (GitHub issue #11387, open since 2017), screen reader accessibility gaps with portaled tooltips, and SSR/Next.js App Router hydration caveats. It includes a comparison table of four portal target strategies with specific tradeoffs.

Your readers building any kind of overlay UI in React would find the event bubbling and accessibility sections useful beyond just product tours.

Link: https://usertourkit.com/blog/portal-rendering-product-tours-createportal

Thanks,
Domi
