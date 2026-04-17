# In-App NPS vs Post-Tour Feedback: When to Ask Each Survey Type

### Most product tours ask for NPS at the wrong moment. Here's the timing framework that produces better data.

*Originally published at [usertourkit.com](https://usertourkit.com/blog/in-app-nps-vs-post-tour-feedback)*

You just shipped a five-step product tour for your dashboard. Users complete it, see a confetti animation, and then a modal asks "How likely are you to recommend us to a friend?" on a 0-to-10 scale. The user picks 8, closes it, and you record a data point that tells you almost nothing useful.

That NPS score doesn't measure whether the tour was helpful. It measures a half-formed loyalty opinion from someone who finished onboarding 12 seconds ago.

## The honeymoon effect

NPS measures loyalty. Loyalty requires experience over time. A user who just completed onboarding hasn't formed a loyalty opinion.

Fresh off a well-designed tour, users feel positive. They score 8 or 9. Two months later, half of them have churned. Your NPS dashboard showed green, but the signal was noise. We call this the honeymoon effect.

As Smashing Magazine puts it: "What people say and what people do are often very different things."

## Which survey type belongs where

The fix is matching the right survey to the right moment:

**CES (Customer Effort Score)** fires immediately after a specific tour step. It answers "How easy was that?" No recall bias. No reconstructed memory. If 40% of users score a step 5/7 or below, that step needs redesign.

**CSAT (Customer Satisfaction)** fires at tour completion. "How would you rate your experience with this tour?" on a 1-5 scale. Keep it to a single question. Adding open-text follow-up fields increases abandonment by 24%.

**NPS (Net Promoter Score)** fires 14-30 days after onboarding, then every 90 days. Event-driven NPS (triggered when a user reaches a meaningful milestone like "completed 10 projects") produces higher-quality scores than calendar-based sends.

49% of companies already combine NPS with at least one additional metric like CSAT or CES.

## Survey fatigue is a conversion killer

Onboarding is cognitively demanding. Adding survey prompts on top of that load increases abandonment of the onboarding flow itself.

The rule: never stack a survey on top of an active onboarding sequence. If a user is mid-tour, the survey waits.

For developer-facing products, this is even more critical. Developers work in deep focus states. A survey popup mid-task breaks flow in a way that takes 15-20 minutes to recover from. Trigger surveys on navigation transitions or idle states instead.

## The accessibility gap

Most survey tools fail WCAG 2.1 AA compliance by default. A popup survey that steals focus without announcing itself to screen readers, lacks keyboard dismissal, or uses low-contrast rating scales creates accessibility barriers.

Accessible surveys collect data from your entire user base, not just users who can see and click a mouse. If 5% of your users rely on screen readers and your survey widget doesn't support them, your feedback data has a 5% blind spot.

## Common mistakes

**Asking NPS on day one.** You're measuring first impressions, not loyalty. Wait at least 14 days.

**Using open-text as the primary question.** Scale-based questions take 3 seconds. Open-text takes 30+.

**Ignoring non-respondents.** A 30% response rate means 70% of users didn't answer. They skew toward the middle.

**Sending NPS by email after showing it in-app.** An email follow-up 7 days later can recover ~13% additional responses. But sending both simultaneously is spam.

## Key takeaway

Map survey types to lifecycle moments: CES at step completion, CSAT at tour end, NPS at value realization. Your response rates will be higher, your data will be cleaner, and you'll actually know which parts of onboarding need work.

Full article with code examples and implementation patterns: [usertourkit.com/blog/in-app-nps-vs-post-tour-feedback](https://usertourkit.com/blog/in-app-nps-vs-post-tour-feedback)

*Suggested Medium publications: JavaScript in Plain English, UX Collective, Better Programming*
