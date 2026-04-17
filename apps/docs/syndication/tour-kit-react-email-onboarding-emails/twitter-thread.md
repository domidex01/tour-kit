## Thread (6 tweets)

**1/** Most product tours end when the user clicks "Done." Tooltip disappears, silence, user never comes back. The fix isn't a better tooltip — it's an email that picks up where the tour left off.

**2/** Cross-channel onboarding (email + in-app) boosts retention by 130% vs 71% for in-app alone (Braze data). But most teams treat them as separate systems. The onboarding email says "Check out Feature X" while the product tour already showed it yesterday.

**3/** I connected Tour Kit's analytics callbacks to React Email + Resend. When a user skips step 4, they get an email about that specific feature. When they finish everything, they get a deeper dive. Behavior-based, not time-based.

**4/** Some numbers: React Email is at 920K weekly npm downloads. Behavior-based email sequences convert 30% better than drip schedules. Welcome emails hit 50-70% open rates, dropping 3-5% per subsequent email. 5-7 emails over 14 days is the sweet spot.

**5/** The pattern nobody talks about: cross-channel deduplication. Before emailing about Feature X, check if the user already discovered it via product tour. One lookup against completion state prevents the most annoying pattern in onboarding.

**6/** Full tutorial with TypeScript code — email templates, Tour Kit callbacks, API route, deduplication pattern:

https://usertourkit.com/blog/tour-kit-react-email-onboarding-emails
