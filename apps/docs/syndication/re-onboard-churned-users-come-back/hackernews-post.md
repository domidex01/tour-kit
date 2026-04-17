## Title: Re-onboarding churned users: segmentation, adaptive tours, and what to measure

## URL: https://usertourkit.com/blog/re-onboard-churned-users-come-back

## Comment to post immediately after:

Most win-back content covers the marketing side — email sequences, discount tiers. Almost nothing covers what the product should do when the user actually clicks "log in" again.

I wrote this after noticing a pattern: returning users who saw the same first-run onboarding tour had worse retention than those who saw no tour at all. Replaying "click here for settings" to someone who used the product for 3 months is condescending.

The core idea is segment-then-tour. Feature-gap churners (left because you lacked something) get a changelog tour filtered to releases after their last session. Engagement-gap churners (never hit the "aha" moment) resume onboarding from where they stalled. Price-gap churners get value demonstration before pricing.

Key stat that shaped the approach: event-based win-back triggers outperform calendar-based ones 3-5x (Hightouch). "Your missing feature just shipped" beats "it's been 30 days."

The success metric is 60-day retention of reactivated users, not tour view count. If they churn again within two months, the onboarding failed.

Code examples are React/TypeScript. The detection patterns (localStorage, server-side, feature-fingerprint) are framework-agnostic.
