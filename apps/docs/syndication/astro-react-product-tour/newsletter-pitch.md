## Subject: Adding product tours to Astro sites with React islands

## Recipients:
- Cooperpress (React Status, JavaScript Weekly, Frontend Focus): editor@cooperpress.com
- This Week in React: sebastien@thisweekinreact.com
- Bytes.dev: submit via site

## Email body (React Status / This Week in React):

Hi [name],

I wrote a tutorial on integrating product tours into Astro sites using React islands. It covers a non-obvious issue where React Context can't span island boundaries (each `client:only` component creates a separate React root), and how Nanostores solves cross-island state for under 1KB.

With Astro crossing 900k weekly npm downloads and Cloudflare's acquisition in January 2026, more React devs are building with islands. This covers the practical integration patterns.

Link: https://usertourkit.com/blog/astro-react-product-tour

Thanks,
Domi

## Email body (Frontend Focus):

Hi [name],

I put together a guide on adding interactive product tours to Astro sites without shipping unnecessary JavaScript. It uses the islands architecture to load tour code only where needed, with Nanostores for cross-island state sharing.

Covers client directive selection (`client:only="react"` vs `client:load`), hydration mismatch debugging, and accessibility patterns.

Link: https://usertourkit.com/blog/astro-react-product-tour

Thanks,
Domi
