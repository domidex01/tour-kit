## Title: Why I chose $99 one-time over $300/month recurring for a React library

## URL: https://usertourkit.com/blog/why-i-chose-99-one-time-over-300-month-recurring

## Comment to post immediately after:

I built Tour Kit, a headless product tour library for React. When it came time to price the Pro tier, I defaulted to the standard SaaS playbook: monthly tiers with MRR. Then I realized I was building a library with no server, no dashboard, and near-zero marginal cost per user. Charging rent on code that ships in the buyer's bundle felt wrong.

The data backed up the instinct. 78% of finance decision-makers are increasing scrutiny on recurring costs (Getmonetizely, 2026). The median dev tool costs $32/user/month, which means $99 one-time is roughly 3 months of typical tool spend. The psychology works differently when there's no renewal.

Some things I got wrong: I should have started at $149 and discounted to $99 for launch (pricing down is easier than pricing up). I also launched with unlimited activations per license, which is generous now but may not be sustainable.

The open-core boundary was the hardest part. The three core packages (tour logic, React components, hint beacons) are MIT and functionally complete. Pro adds adjacent capabilities (surveys, scheduling, analytics) rather than gating core features. That distinction matters for community trust.

Payments run through Polar.sh (4% + $0.40, no monthly fees, automated license keys). Happy to discuss the pricing decision or open-core design in comments.
