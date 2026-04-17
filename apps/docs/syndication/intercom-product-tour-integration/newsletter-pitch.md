## Subject: Integration guide: React product tours + Intercom event bridging

## Recipients:
- Cooperpress (React Status, JavaScript Weekly): editor@cooperpress.com
- This Week in React: sebastien@thisweekinreact.com
- Bytes.dev: submit via site

## Email body:

Hi [name],

I wrote a technical guide on integrating a headless React tour library with Intercom's JS API to show contextual product tours before the chat widget appears. It covers event bridging via `trackEvent`, Messenger visibility toggling with a 20-line hook, and the gotchas we hit with Intercom's boot timing.

The article includes working TypeScript code and a comparison of Intercom's tour limitations (no lifecycle callbacks, no mobile support, ~210 KB bundle) versus a headless alternative at <8 KB.

Link: https://usertourkit.com/blog/intercom-product-tour-integration

Thanks,
Domi
