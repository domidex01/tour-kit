## Subreddit: r/reactjs

**Title:** We reduced "how do I" support tickets by 40% with in-app product tours — here are the 5 patterns that worked

**Body:**

I've been building a product tour library for React and wanted to share what we've learned about using tours to deflect support tickets.

Most SaaS support queues are 40-60% "how do I" questions — feature discovery, workflow confusion, and setup issues. These are questions with deterministic answers that live in docs the user never found. Product tours fix this by putting the guidance on the same screen as the action.

The five patterns we've found work best:

1. **Trigger on confusion signals, not page load.** Start tours when users are idle for 30+ seconds or visit the same settings page three times. Users who are stuck want help. Users who aren't find unsolicited tours annoying.

2. **First-action tours, not feature dumps.** Nobody retains a 12-step "here's everything" tour. Guide through one action (create a project, invite a teammate). 5-7 steps max — that's the cognitive load ceiling.

3. **Persistent hints for power features.** Tours run once. Hints stay. A pulsing dot next to the export button catches the eye months after onboarding.

4. **Role-based branching.** Admin and member tours should be different. Showing billing settings to users who can't access billing generates confusion tickets.

5. **Checklists with dependency ordering.** Prevents "it's broken" tickets from users who skipped a required setup step.

The economics are interesting too: Gartner puts self-service at $0.10/interaction vs $8.01 for agent-assisted tickets. For 1,000 tickets/month with 40% deflectable, that's ~$37,500/year saved.

Full breakdown with code examples and ROI framework: https://usertourkit.com/blog/self-serve-onboarding-reduce-support

Curious if anyone else has measured support ticket impact from product tours? What patterns worked for you?
