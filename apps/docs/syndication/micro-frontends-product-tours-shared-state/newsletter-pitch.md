## Subject: Micro-frontends and product tours: shared state across federated modules

## Recipients:
- Cooperpress (React Status, JavaScript Weekly, Frontend Focus): editor@cooperpress.com
- This Week in React: sebastien@thisweekinreact.com
- Bytes.dev: submit via site

## Email body:

Hi [name],

I wrote a deep-dive on running product tours across micro-frontend boundaries using Module Federation. I tested React Joyride, Shepherd.js, and Driver.js in a federated setup and documented three coordination patterns (CustomEvent bus, shared Zustand singleton, headless hook wrapper) with full TypeScript implementations.

The article includes comparison tables, accessibility gotchas (focus trapping across React roots), and honest tradeoffs. With Module Federation at 3.2M weekly npm downloads, this is a problem more teams are hitting.

Link: https://usertourkit.com/blog/micro-frontends-product-tours-shared-state

Thanks,
Domi
