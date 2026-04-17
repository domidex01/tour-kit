## Subreddit: r/reactjs

**Title:** I modeled 3 years of Appcues costs vs an open-source React library for product tours — here's the spreadsheet

**Body:**

I've been working on Tour Kit, an open-source headless product tour library for React. One of the most common questions we get is "how does the cost compare to Appcues over time?" So I built a TCO model.

The short version: at 5K MAU, Appcues runs about $54K over 3 years vs ~$26K for an open-source approach (including all engineering time at $150/hr). At 25K MAU it's $114K vs $26K. At 100K MAU it's $264K+ vs $36K.

The reason the gap widens so fast is that Appcues charges per MAU and applies annual price increases (Vendr data suggests 5-15% at renewal). A client-side library has zero per-user cost, so the only variable is engineering hours for building and maintaining flows.

Where Appcues legitimately wins: if you have no frontend engineers, if you need a flow live in hours not weeks, or if you're under 2,500 MAU and staying there. The visual builder is genuinely useful for non-technical teams.

I tried to be honest about the tradeoffs. The model assumes $150/hr for a US senior React dev, 80 hours of initial implementation for Tour Kit, and 30 hours/year ongoing maintenance. I also assumed no professional services for Appcues (many deployments need $5-25K extra for that).

Full article with detailed tables and source links: https://usertourkit.com/blog/tco-comparison-appcues-tour-kit

Would be curious what others are paying for onboarding tooling and whether these numbers match your experience.
