# How to send onboarding notifications based on product tour behavior
## Connecting Tour Kit's analytics to Novu's notification infrastructure

*Originally published at [usertourkit.com](https://usertourkit.com/blog/tour-kit-novu-onboarding-notifications)*

A product tour teaches your user something. Then it vanishes. If that user doesn't come back, the lesson disappears with it. The fix isn't a longer tour. It's a notification that arrives based on what actually happened during the tour.

Novu is open-source notification infrastructure that sends across in-app, email, SMS, push, and chat through a single API. As of April 2026, it has over 36,000 GitHub stars and ships a free tier of 10,000 events per month. Tour Kit's analytics plugin system gives you structured events for every tour lifecycle moment. Connect the two, and your onboarding follows users across channels.

Cross-channel onboarding campaigns boost retention by 130% compared to 71% for in-app alone (Braze, 2025). But most teams wire their product tour to one analytics tool and their email to another. The systems don't talk.

## The integration pattern

Tour Kit's analytics package accepts plugins that implement a `track` method. Each plugin receives a typed event with the tour ID, step index, duration, and metadata. A Novu plugin maps those events to workflow triggers.

The key decisions: which events become notifications (we chose completion, skip, and abandonment), and what each notification channel does (in-app immediately, email after 24 hours, push on day three).

Novu's digest engine prevents notification fatigue by combining multiple triggers into a single message. If a user finishes five micro-tours in 30 minutes, they get one summary instead of five separate messages.

## What you build

About 60 lines of TypeScript for the plugin, a Novu workflow definition, and an API route to proxy events from the browser to the server. The visible result: a notification in Novu's inbox component and a follow-up email in the user's mailbox, both driven by real tour behavior.

The gotcha we hit: Novu's Node SDK is server-side only. Client-side Tour Kit setups need to proxy through an API route. The full article covers both the server-side and client-safe plugin versions.

## Going further

Three extensions make it production-ready: user-controlled channel preferences, conditional workflow steps that skip redundant messages, and personalized content driven by tour metadata.

Full walkthrough with all code examples, comparison tables, and the complete plugin implementation:

**[usertourkit.com/blog/tour-kit-novu-onboarding-notifications](https://usertourkit.com/blog/tour-kit-novu-onboarding-notifications)**

---

*Suggested Medium publications: JavaScript in Plain English, Better Programming, Bits and Pieces*
