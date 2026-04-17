## Subject: Tour Kit + Novu: omnichannel onboarding from product tour events

## Recipients:
- Cooperpress (React Status, JavaScript Weekly): editor@cooperpress.com
- This Week in React: sebastien@thisweekinreact.com
- Bytes.dev: submit via site

## Email body:

Hi [name],

I wrote a guide on connecting product tour events to Novu's notification infrastructure for omnichannel onboarding. The integration maps Tour Kit analytics callbacks to Novu workflow triggers, so tour completion fires an in-app notification immediately, queues a follow-up email after 24 hours, and batches duplicate notifications through Novu's digest engine.

Cross-channel onboarding retains users at 2x the rate of single-channel approaches (Braze, 2025). The guide includes the full TypeScript plugin (~30 lines), Novu workflow definition, and API route proxy for client-side setups.

Link: https://usertourkit.com/blog/tour-kit-novu-onboarding-notifications

Thanks,
Domi
