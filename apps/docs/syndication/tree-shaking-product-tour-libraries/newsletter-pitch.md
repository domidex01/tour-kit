## Subject: Tree-shaking deep-dive: testing 5 React tour libraries

## Recipients:
- Cooperpress (React Status, JavaScript Weekly, Frontend Focus): editor@cooperpress.com
- This Week in React: sebastien@thisweekinreact.com
- Bytes.dev: submit via site

## Email body:

Hi [name],

I tested five React product tour libraries to see how well they tree-shake on a single-hook import. The spread was surprising: from 2% reduction (Driver.js) to 64% (Tour Kit), with React Joyride shipping 31KB regardless of what you import. The article breaks down why `sideEffects: false` is the single biggest factor, with reproducible methodology and code examples.

Link: https://usertourkit.com/blog/tree-shaking-product-tour-libraries

Thanks,
Domi
