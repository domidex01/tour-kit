## Thread (7 tweets)

**1/** Most SaaS apps treat billing and product UX as completely separate systems. Stripe handles the money. React handles the UI. The gap between them is where upgrade prompts go to die.

**2/** Stripe already knows when trials are ending, payments fail, and users downgrade. It broadcasts these as webhook events. But most teams only use them for backend logic — the frontend never hears about them.

**3/** We wired 5 Stripe events to 5 tour types:
- trial_will_end → upgrade tour
- payment_failed → recovery tour
- subscription_updated → plan change tour
- invoice_paid → feature celebration
- subscription_deleted → win-back tour

**4/** The data backs this up: contextual upgrade prompts convert at 2.3x vs random CTAs (Appcues). Mixpanel reports 32% higher plan upgrades from event-driven prompts. Payment recovery tours reduce involuntary churn by 20-30%.

**5/** Three gotchas we hit:
1. Stripe webhooks hit your server, not your browser — you need a bridge
2. Stripe fires multiple events simultaneously — deduplicate or tours collide
3. The polling hook needs React context — place it inside the provider

**6/** The key insight: generic "upgrade now" banners convert at 2-5%. Tours that reference the user's actual usage ("You used 847 of 1,000 API calls") convert at 8-10%.

**7/** Full tutorial with TypeScript code for Next.js App Router: https://usertourkit.com/blog/tour-kit-stripe-billing-upgrade-tours

(Built with Tour Kit — the headless tour library I'm working on)
