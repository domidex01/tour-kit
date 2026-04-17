## Channel: #articles or #show-off in Reactiflux

**Message:**

Wrote up how to wire a headless React tour library into Intercom's JS API so product tours show before the chat widget. The core is a 20-line hook that toggles the Messenger launcher and fires `trackEvent` on tour completion. Hit a fun timing gotcha with Intercom's boot sequence too.

https://usertourkit.com/blog/intercom-product-tour-integration

Anyone else doing this kind of tour-before-chat pattern? Curious how other teams handle the coordination.
