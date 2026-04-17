## Subreddit: r/reactjs

**Title:** I wrote up the pitch framework I used to get my team off a $48K/yr onboarding SaaS

**Body:**

Our team was paying Pendo about $4K/month for product tours and onboarding flows. When the renewal came up with a 15% uplift, I put together a case for switching to an open-source library instead.

The thing I realized is that every "build vs buy" article frames it as two options: build from scratch ($60K+) or buy SaaS. But adopting a maintained React library is a third path that nobody talks about. You get the positioning engine, state machine, and accessibility layer pre-built. Integration takes a sprint, not a quarter. And the ongoing cost is $0/month.

The strongest arguments weren't about developer experience (CTOs expect engineers to prefer open source). What actually worked:

- **Three-year TCO math**: $115K-$160K+ for SaaS vs $5K-$20K total for a library. Crossover point is about 2-4 months.
- **Security**: SaaS tools inject third-party JS from an external CDN. You can't audit it, pin it, or control when it updates. For our SOC 2 audit, this was a real line item.
- **Process lock-in**: The longer you build flows in a vendor's no-code editor, the harder it is to leave. This was the argument that landed hardest with our CTO.

The key was NOT asking for a full migration. I asked for a one-sprint spike to rebuild three existing flows. Low risk, measurable result. If the spike failed, we'd renew. It didn't fail.

I wrote the whole framework up with the cost table, seven common CTO objections with data-backed responses, and the common mistakes that kill the pitch: https://usertourkit.com/blog/pitch-cto-open-source-onboarding

Disclosure: I work on Tour Kit, which is one of the libraries I mention. But the framework works regardless of which library you choose. Curious if others have gone through a similar switch and what arguments worked for them.
