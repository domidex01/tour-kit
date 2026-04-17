## Subreddit: r/SaaS

**Title:** Resource center vs knowledge base vs help center — what's the actual difference?

**Body:**

I wrote up a breakdown of these three terms because they get thrown around interchangeably and the distinction actually matters when you're deciding what to build.

The short version: a knowledge base is an external doc site (deep reference content, good for SEO). A help center is the umbrella that includes KB + FAQs + contact forms + forums. A resource center is an in-app widget that pulls contextual excerpts from your KB and surfaces them based on what the user is currently doing in the product.

The interesting stat: Gartner found that 43% of self-service cases fail because users can't find the right content. Resource centers address this by targeting content to the user's current page and segment instead of dumping everything in one list.

On the cost side, self-service interactions run about $0.10 per contact vs $8-12 for live support (Userpilot, citing Gartner). So the ROI math is pretty straightforward once you have enough users generating support tickets.

The build-vs-buy question is where it gets interesting for dev teams. Pendo, Userpilot, and Userflow offer drag-and-drop resource centers but charge per MAU and inject third-party scripts. Building with a headless library gives you targeting logic without the per-seat fees.

Full article with architecture table, React code example, and FAQ: https://usertourkit.com/blog/what-is-resource-center-in-app

Curious how others have approached this — did you build your own or go with a vendor?
