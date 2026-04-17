## Subject: Deep-dive: why z-index: 9999 fails in product tour overlays (stacking contexts, portals, top layer)

## Recipients:
- Cooperpress (CSS Weekly, Frontend Focus, React Status, JavaScript Weekly): editor@cooperpress.com
- This Week in React: sebastien@thisweekinreact.com
- Bytes.dev: submit via site

## Email body:

Hi [name],

I wrote a deep-dive on why z-index: 9999 doesn't fix product tour overlays — and the three strategies that do (React portals, CSS token systems, and the browser's native top layer via `<dialog>`). It includes a stacking context trigger table with all 17 CSS properties, a component library z-index conflict matrix (MUI, Chakra, Radix, Ant Design), and debugging tool recommendations.

The article is CSS/React focused, technically detailed, and includes working code examples. 89% of pages use `transform` (which silently creates stacking contexts), so this is a pain point most frontend developers have hit.

Link: https://usertourkit.com/blog/z-index-product-tour-overlay

Thanks,
Domi
