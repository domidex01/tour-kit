# How to Wire Stripe Billing Webhooks to In-App Upgrade Tours in React

### Event-driven upgrade prompts that convert at 2.3x the rate of static banners — with working Next.js code.

*Originally published at [usertourkit.com](https://usertourkit.com/blog/tour-kit-stripe-billing-upgrade-tours)*

---

**Import instructions:** Use medium.com/p/import and paste the URL https://usertourkit.com/blog/tour-kit-stripe-billing-upgrade-tours — Medium will auto-set the canonical tag.

**Submit to:** JavaScript in Plain English publication for wider reach.

**Notes for Medium adaptation:**
- Keep code blocks under 20 lines (Medium has no syntax highlighting)
- Replace the HTML table with the prose version below
- Remove JSON-LD schema section and FAQ

---

> Use the same body content as devto.md, with these changes:
> 1. Replace the Stripe events table with: "Five Stripe events map to upgrade tours. `customer.subscription.trial_will_end` triggers a trial expiry upgrade tour 3 days before the trial ends. `invoice.payment_failed` triggers a payment recovery tour when a charge attempt fails. `customer.subscription.updated` triggers a plan change confirmation on upgrade or downgrade. `invoice.paid` triggers a new feature celebration after successful payment. And `customer.subscription.deleted` triggers a win-back or exit survey when the subscription is cancelled. We found that three events cover 80% of the upgrade tour value: trial_will_end, payment_failed, and a custom feature-limit-reached event from your own backend."
> 2. Keep all code blocks — they're all under 20 lines already except the tour component (trim it to the first TourStep only with a comment indicating the second step follows the same pattern)
> 3. Remove the FAQ section — replace with: "The full FAQ covering SSE vs polling, latency concerns, offline user handling, and Stripe Customer Portal integration is in the [original article](https://usertourkit.com/blog/tour-kit-stripe-billing-upgrade-tours)."
> 4. End with: "The complete tutorial with all code examples and FAQ is in the [original article](https://usertourkit.com/blog/tour-kit-stripe-billing-upgrade-tours)."
