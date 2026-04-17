## Subreddit: r/opensource (primary), r/indiehackers (secondary)

**Title:** I tracked the relationship between GitHub stars and actual revenue for my open-source library. Here's what I found.

**Body:**

I've been building an open-source React library as a solo developer for the past year. Along the way I got very interested in one question: do GitHub stars actually matter for the business side of open source?

Short answer: they matter, but not the way most people think. Stars are a discovery mechanism, not a revenue signal.

Some data points I came across while researching this:

- A 2024 study found over 4.5 million suspected fake stars on GitHub. You can buy them for EUR 0.08/star.
- OpenSSL, which secures basically the entire internet, received roughly $2,000/year in donations.
- One developer with a 5,000+ star repo got exactly one recurring donation: $1/month.
- Postiz (open-source social media tool) hit $14,200/month MRR as a solo dev, but the revenue came from cloud hosting, not the code.

The biggest lesson: stars feed GitHub's search algorithm, which makes your library findable. That's the actual business value. But there's a long gap between "someone found my repo" and "someone paid for the premium tier."

I wrote up the full breakdown with a correlation table (stars vs downloads vs revenue signals) and what I'd do differently if starting over: https://usertourkit.com/blog/github-stars-business

Curious if other maintainers have tracked this. What metrics do you actually look at?
