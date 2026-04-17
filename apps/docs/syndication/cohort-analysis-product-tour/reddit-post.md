## Subreddit: r/reactjs (also consider r/SaaS or r/analytics)

**Title:** I analyzed how trigger type affects product tour retention — the 2x completion gap nobody talks about

**Body:**

I've been building an onboarding system and got curious about whether tour completion rates actually predict retention. The short answer: not really, at least not on their own.

Chameleon published benchmark data from 15 million tour interactions that has some interesting findings. Click-triggered tours (where the user initiates) complete at 67%. Auto-popup tours with a set delay complete at 31%. That's a 2x gap based entirely on how the tour starts.

But here's the part that most analytics setups miss: completion rate alone doesn't tell you if users retain. You need behavioral cohort analysis — splitting users into groups like "completed tour AND used the featured action within 24 hours" versus "completed tour but never used the action" and then comparing day-30 retention across those groups.

Some other data points from the research:

- 4-step tours hit peak completion at 74%
- 5-step tours drop to 34% (cognitive load cliff)
- 7+ step tours: 16% completion
- Checklist-triggered tours see +21% completion over baseline
- Users completing onboarding within 24 hours show 40% higher retention at 90 days

The most useful cohort split I found was trigger-type cohorts. Nobody seems to be asking: "Do click-triggered completers also retain at higher rates, or does the trigger type only affect whether they finish?"

I wrote up the full analysis with code examples showing how to pipe step-level tour events into PostHog/Amplitude/Mixpanel for cohort analysis: https://usertourkit.com/blog/cohort-analysis-product-tour

Curious if anyone else has run this kind of analysis on their onboarding tours. What cohort splits produced the most surprising results for you?
