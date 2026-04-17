## Subreddit: r/reactjs

**Title:** I compared the real cost of 10 product tour tools for a 5,000 MAU SaaS — the gap between sticker price and actual spend was eye-opening

**Body:**

I spent a few days pulling pricing from every product tour vendor I could find (Appcues, Userpilot, Chameleon, Pendo, WalkMe, UserGuiding, Userflow, Intercom) plus the open-source options (React Joyride, Shepherd.js, Tour Kit).

The range is absurd: $0 to $142,000/year. But the interesting part isn't the sticker price — it's what happens when your MAU count grows.

**Key findings:**

- SaaS tools start at $69-$300/month but scale with MAUs. Appcues at 20K MAUs runs ~$2,000/month based on G2 reviewer reports.
- 7 out of 8 SaaS tools hide real pricing behind "Contact Sales" above a certain MAU threshold.
- Hidden costs (implementation, training, compliance add-ons, switching) push actual spend 2-5x beyond published prices per a CompareTiers analysis.
- Open-source libraries (React Joyride, Tour Kit) cost $0 in licensing but 8-40 hours of integration time at your team's hourly rate.
- Three-year TCO difference between SaaS and open-source for a 5K MAU product: $14,000-$53,000.

The decision really comes down to whether you have React developers on your team. If you do, the open-source path pays for itself within 2-3 months vs any SaaS subscription.

Full breakdown with pricing table and decision framework: https://usertourkit.com/blog/product-tour-software-cost-2026

Disclosure: I built Tour Kit, so I'm biased toward the open-source path. But every number is sourced from vendor pricing pages and published reviews.
