## Title: How we set Tour Kit's price at $99 – unit economics of a solo open-core React library

## URL: https://usertourkit.com/blog/tour-kit-pricing-decision-building-in-public

## Comment to post immediately after:

I built Tour Kit, a headless product tour library for React (10 packages, MIT core, $99 one-time for Pro extensions).

This post is the full pricing breakdown I wish existed when I started. The specific things I cover:

- Why one-time instead of subscription (39-44% of developers prefer one-time for package-based tools, per SlashData)
- The psychology of $99 specifically (below manager-approval threshold, above impulse-buy zone)
- Where to draw the MIT/Pro line without repeating n8n's mistake (designed as open-core from day one, not converted after building community trust)
- The actual napkin math: Polar.sh takes 4% + $0.40, leaving $95.64 net. At $85/month costs and a $5,000/month target, sustainability = 54 licenses/month.

I also wasted two weeks building custom Stripe infrastructure before discovering Polar handles license delivery for developer tools out of the box. That section is probably the most useful cautionary tale.

Honest about limitations: Tour Kit has a smaller community than React Joyride (603K weekly downloads), no visual builder, and requires React 18+. Those constraints matter and I don't pretend otherwise.

Happy to discuss the pricing decisions, the open-core boundary, or the Polar.sh experience.
